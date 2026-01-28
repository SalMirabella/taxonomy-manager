import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Entity,
  QueryEntity,
  Article,
  EntityType,
  TypeConfig,
  CategoryDef,
  TYPE_CONFIG,
  CATEGORIES,
  RELATION_KEYS,
  ECMO_DATA,
  EIOS_ARTICLES,
  getAllEntities,
  getAllEntitiesIncludingVirtual,
  getEntityByUri,
  getAllDescendants,
  RELATION_LABELS,
  REVERSE_RELATION_LABELS,
} from './query-builder.data';

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './query-builder.component.html',
})
export class QueryBuilderComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  // State
  searchQuery = '';
  showDropdown = false;
  query: QueryEntity[] = [];
  selected: Entity | null = null;
  queryView: 'natural' | 'technical' = 'natural';
  detailOpen = true;
  expandedGroups: Record<string, boolean> = {};
  expandedCategories: Record<string, boolean> = {};
  private preventNavigation = false; // Flag to prevent navigation when adding from hover button
  operatorDropdownOpen: string | null = null; // Track which operator dropdown is open (e.g., "Disease", "Symptom")

  // Data references
  categories = CATEGORIES;
  typeConfig = TYPE_CONFIG;
  ecmoData = ECMO_DATA;

  // Computed
  searchResults: (Entity | { isHeader: true; label: string; type: EntityType; key: string })[] = [];
  queryResults: Article[] = [];
  relatedEntities: Entity[] = [];

  ngOnInit(): void {
    this.updateSearchResults();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
    // Close operator dropdown when clicking outside
    this.operatorDropdownOpen = null;
  }

  // Search
  onSearchChange(): void {
    this.showDropdown = true;
    this.updateSearchResults();
  }

  onSearchFocus(): void {
    this.showDropdown = true;
  }

  updateSearchResults(): void {
    if (!this.searchQuery || this.searchQuery.length < 1) {
      this.searchResults = [];
      return;
    }

    const q = this.searchQuery.toLowerCase();

    // Search for category
    const cat = CATEGORIES.find(
      c => c.label.toLowerCase().includes(q) || c.key.includes(q)
    );

    if (cat) {
      const items = (ECMO_DATA as any)[cat.key] || [];
      // Include all items except virtual "All" entities
      const filtered = items.filter((i: Entity) => !i.uri?.startsWith('virtual:'));
      this.searchResults = [
        { isHeader: true, label: cat.label, type: items[0]?.type, key: cat.key },
        ...filtered,
      ];
      return;
    }

    // Search entities
    const results: Entity[] = [];
    CATEGORIES.forEach(category => {
      const items: Entity[] = (ECMO_DATA as any)[category.key] || [];
      items.forEach(item => {
        if (item.label.toLowerCase().includes(q)) {
          results.push(item);
        }
      });
    });

    this.searchResults = results.slice(0, 20);
  }

  // Query Management - MODIFICATO per supportare categorie e operatori
  addToQuery(entity: Entity): void {
    // Blocca solo gli header, non le categorie
    if (this.isHeader(entity)) return;
    
    // Determina l'operatore di default basato sul tipo di entità
    const defaultOperator = this.getDefaultOperator(entity.type);
    
    // Permetti sia categorie che istanze
    if (!this.query.find(q => q.entity.uri === entity.uri)) {
      this.query = [...this.query, { entity, operator: defaultOperator }];
    }
    
    this.selected = entity;
    this.searchQuery = '';
    this.showDropdown = false;
    this.updateQueryResults();
    this.updateRelatedEntities();
  }

  getDefaultOperator(type: EntityType): 'any' | 'all' | 'none' {
    // Single-valued properties (Disease, Hazard): default OR (any)
    // Multi-valued properties (Symptom, Pathogen, Vector, Host): default AND (all)
    const multiValuedTypes: EntityType[] = ['Symptom', 'Pathogen', 'Vector', 'Host'];
    return multiValuedTypes.includes(type) ? 'any' : 'any';  // Start with 'any' for all
  }

  setOperatorForType(type: EntityType, operator: 'any' | 'all' | 'none'): void {
    // Update operator for all entities of this type in the query
    this.query = this.query.map(qe => {
      if (qe.entity.type === type) {
        return { ...qe, operator };
      }
      return qe;
    });
    this.updateQueryResults();
  }

  setOperatorForEntity(uri: string, operator: 'any' | 'all' | 'none'): void {
    // Update operator for a specific entity
    this.query = this.query.map(qe => {
      if (qe.entity.uri === uri) {
        return { ...qe, operator };
      }
      return qe;
    });
    this.updateQueryResults();
  }

  getOperatorForType(type: EntityType): 'any' | 'all' | 'none' {
    // Get the operator for entities of this type (use first one found)
    const found = this.query.find(qe => qe.entity.type === type);
    return found ? found.operator : 'any';
  }

  getEntitiesByType(type: EntityType): QueryEntity[] {
    return this.query.filter(qe => qe.entity.type === type);
  }

  getTypesInQuery(): EntityType[] {
    const types = new Set<EntityType>();
    this.query.forEach(qe => types.add(qe.entity.type));
    return Array.from(types);
  }

  removeFromQuery(uri: string): void {
    this.query = this.query.filter(q => q.entity.uri !== uri);
    if (this.selected?.uri === uri) {
      this.selected = null;
    }
    this.updateQueryResults();
  }

  clearAll(): void {
    this.query = [];
    this.selected = null;
    this.queryResults = [];
    this.relatedEntities = [];
  }

  selectEntity(entity: Entity): void {
    if (this.isHeader(entity)) return;
    if (this.preventNavigation) {
      // Don't navigate if we're in the middle of adding without navigation
      this.preventNavigation = false;
      return;
    }
    this.selected = entity;
    this.detailOpen = true;
    this.updateRelatedEntities();
  }

  // Results - MODIFICATO per supportare match con categorie (anche multi-livello)
  updateQueryResults(): void {
    if (this.query.length === 0) {
      this.queryResults = [];
      return;
    }

    this.queryResults = EIOS_ARTICLES.filter(article => {
      // Start with true/false based on first entity's operator
      const firstQe = this.query[0];
      const firstMatch = this.matchesEntity(article, firstQe.entity);
      
      let result: boolean;
      switch (firstQe.operator) {
        case 'any':  // have any of
        case 'all':  // have all of (treated same as any for single entity)
          result = firstMatch;
          break;
        case 'none': // have none of
          result = !firstMatch;
          break;
        default:
          result = firstMatch;
      }
      
      // Apply subsequent entities with their operators sequentially
      for (let i = 1; i < this.query.length; i++) {
        const qe = this.query[i];
        const match = this.matchesEntity(article, qe.entity);
        
        switch (qe.operator) {
          case 'any':  // OR
            result = result || match;
            break;
          case 'all':  // AND
            result = result && match;
            break;
          case 'none': // AND NOT
            result = result && !match;
            break;
        }
      }
      
      return result;
    });
  }

  private matchesEntity(article: Article, entity: Entity): boolean {
    // Se è una categoria, matcha se l'articolo contiene QUALSIASI discendente
    if (entity.isCategory) {
      const dataKey = this.getDataKeyForEntity(entity);
      const descendants = getAllDescendants(entity.uri, dataKey);
      return descendants.some(child => article.entities.includes(child.uri));
    }
    
    // Se è un'istanza, match diretto
    return article.entities.includes(entity.uri);
  }

  updateRelatedEntities(): void {
    if (!this.selected) {
      this.relatedEntities = [];
      return;
    }

    const allEntities = getAllEntities();

    // If selected is a CATEGORY/CLASS
    if (this.selected.isCategory) {
      if (this.selected.type === 'Disease') {
        // Get all descendant diseases
        const dataKey = this.getDataKeyForEntity(this.selected);
        const descendantDiseases = getAllDescendants(this.selected.uri, dataKey);
        
        // Aggregate all related entities from descendant diseases
        const aggregatedUris = new Set<string>();
        
        descendantDiseases.forEach(disease => {
          const rels = ECMO_DATA.relations[disease.uri] || {};
          RELATION_KEYS.forEach(key => {
            (rels[key] || []).forEach((uri: string) => {
              aggregatedUris.add(uri);
            });
          });
        });
        
        // Convert URIs to entities
        const results: Entity[] = [];
        aggregatedUris.forEach(uri => {
          const found = allEntities.find(e => e.uri === uri);
          if (found) results.push(found);
        });
        
        this.relatedEntities = results;
      } else {
        // For non-Disease categories, calculate inverse relations
        const dataKey = this.getDataKeyForEntity(this.selected);
        
        // Get all entities in this category (either all items or just children)
        let categoryEntities: Entity[];
        
        if (this.selected.uri?.startsWith('virtual:All')) {
          // For virtual "All", get everything except the virtual entity itself
          const allItems: Entity[] = (ECMO_DATA as any)[dataKey] || [];
          categoryEntities = allItems.filter(i => !i.uri?.startsWith('virtual:'));
        } else {
          // For regular categories, get all descendants recursively
          categoryEntities = getAllDescendants(this.selected.uri, dataKey);
        }
        
        // Calculate inverse relations: find diseases that reference these entities
        const relatedDiseaseUris = new Set<string>();
        const categoryEntityUris = new Set(categoryEntities.map(e => e.uri));
        
        ECMO_DATA.diseases.forEach(disease => {
          const rels = ECMO_DATA.relations[disease.uri];
          if (rels) {
            RELATION_KEYS.forEach(key => {
              const values = rels[key] || [];
              if (values.some(uri => categoryEntityUris.has(uri))) {
                relatedDiseaseUris.add(disease.uri);
              }
            });
          }
        });
        
        // Store both: the related diseases and the category entities
        const diseases = Array.from(relatedDiseaseUris)
          .map(uri => ECMO_DATA.diseases.find(d => d.uri === uri))
          .filter(Boolean) as Entity[];
        
        // Put diseases first, then category entities
        this.relatedEntities = [...diseases, ...categoryEntities];
      }
      return;
    }

    // If selected is an INSTANCE (existing logic)
    if (this.selected.type === 'Disease') {
      const rels = ECMO_DATA.relations[this.selected.uri] || {};
      const results: Entity[] = [];
      RELATION_KEYS.forEach(key => {
        (rels[key] || []).forEach((uri: string) => {
          const found = allEntities.find(e => e.uri === uri);
          if (found) results.push(found);
        });
      });
      this.relatedEntities = results;
    } else {
      // Find diseases that have this entity
      const diseases = ECMO_DATA.diseases.filter(d => {
        if (d.isCategory) return false;
        const rels = ECMO_DATA.relations[d.uri] || {};
        return RELATION_KEYS.some(k => (rels[k] || []).includes(this.selected!.uri));
      });
      this.relatedEntities = diseases;
    }
  }

  // Group toggle
  toggleGroup(uri: string): void {
    this.expandedGroups = {
      ...this.expandedGroups,
      [uri]: !this.expandedGroups[uri],
    };
  }

  isGroupExpanded(uri: string): boolean {
    return !!this.expandedGroups[uri];
  }

  // Category toggle
  toggleCategory(key: string): void {
    this.expandedCategories = {
      ...this.expandedCategories,
      [key]: !this.expandedCategories[key],
    };
  }

  isCategoryExpanded(key: string): boolean {
    return !!this.expandedCategories[key];
  }

  // Entity-level expansion (for individual items in the tree)
  private expandedEntities: Record<string, boolean> = {};

  isEntityExpanded(uri: string): boolean {
    return !!this.expandedEntities[uri];
  }

  toggleEntityExpansion(uri: string): void {
    this.expandedEntities = {
      ...this.expandedEntities,
      [uri]: !this.expandedEntities[uri],
    };
  }

  // Select all entities in a category
  selectAllInCategory(key: string): void {
    const items: Entity[] = (ECMO_DATA as any)[key] || [];
    const selectableItems = items.filter(i => !i.isCategory);
    
    // Add all selectable items to query
    selectableItems.forEach(item => {
      if (!this.query.find(q => q.entity.uri === item.uri)) {
        const defaultOperator = this.getDefaultOperator(item.type);
        this.query = [...this.query, { entity: item, operator: defaultOperator }];
      }
    });
    
    this.updateQueryResults();
    
    // Expand the category to show what was selected
    this.expandedCategories = {
      ...this.expandedCategories,
      [key]: true,
    };
  }

  // Check if "All [Category]" is selected
  isAllCategorySelected(key: string): boolean {
    const virtualUri = `virtual:All${key.charAt(0).toUpperCase() + key.slice(1, -1)}s`;
    return this.query.some(q => q.entity.uri === virtualUri);
  }

  // Toggle "All [Category]" selection
  toggleAllCategory(key: string): void {
    const items: Entity[] = (ECMO_DATA as any)[key] || [];
    const virtualEntity = items.find(i => i.uri?.startsWith('virtual:All'));
    
    if (!virtualEntity) return;
    
    if (this.isAllCategorySelected(key)) {
      // Remove the virtual "All" entity
      this.query = this.query.filter(q => q.entity.uri !== virtualEntity.uri);
    } else {
      // Add the virtual "All" entity
      const defaultOperator = this.getDefaultOperator(virtualEntity.type);
      this.query = [...this.query, { entity: virtualEntity, operator: defaultOperator }];
      
      // Expand the category
      this.expandedCategories = {
        ...this.expandedCategories,
        [key]: true,
      };
    }
    
    this.updateQueryResults();
  }

  // Select virtual entity to view details (without adding to query)
  selectVirtualEntity(key: string): void {
    const items: Entity[] = (ECMO_DATA as any)[key] || [];
    const virtualEntity = items.find(i => i.uri?.startsWith('virtual:All'));
    
    if (virtualEntity) {
      this.selected = virtualEntity;
      this.updateRelatedEntities();
    }
  }

  // Select "All [Category]" from dropdown header
  selectAllFromDropdown(headerItem: any): void {
    if (!headerItem.key) return;
    
    const items: Entity[] = (ECMO_DATA as any)[headerItem.key] || [];
    const virtualEntity = items.find(i => i.uri?.startsWith('virtual:All'));
    
    if (virtualEntity) {
      // Add to query
      if (!this.query.find(q => q.entity.uri === virtualEntity.uri)) {
        const defaultOperator = this.getDefaultOperator(virtualEntity.type);
        this.query = [...this.query, { entity: virtualEntity, operator: defaultOperator }];
      }
      
      // Select for details panel
      this.selected = virtualEntity;
      
      // Close dropdown
      this.searchQuery = '';
      this.showDropdown = false;
      
      // Update results
      this.updateQueryResults();
      this.updateRelatedEntities();
    }
  }

  // Helpers
  isHeader(item: any): item is { isHeader: true } {
    return item && item.isHeader === true;
  }

  getTypeConfig(type: EntityType): TypeConfig {
    return TYPE_CONFIG[type];
  }

  getCategoryTypeConfig(key: string): TypeConfig | null {
    const items = this.getCategoryItems(key);
    return items.length > 0 ? TYPE_CONFIG[items[0].type] : null;
  }

  getSelectedConfig(): TypeConfig | null {
    return this.selected ? TYPE_CONFIG[this.selected.type] : null;
  }

  isInQuery(uri: string): boolean {
    return !!this.query.find(q => q.entity.uri === uri);
  }

  getChildren(parentUri: string, dataKey: string): Entity[] {
    const items: Entity[] = (ECMO_DATA as any)[dataKey] || [];
    return items.filter(i => i.parent === parentUri);
  }

  getCategoryItems(key: string): Entity[] {
    const items: Entity[] = (ECMO_DATA as any)[key] || [];
    // Return only top-level items (no parent) and exclude virtual "All" entities
    return items.filter(i => !i.parent && !i.uri?.startsWith('virtual:'));
  }

  getSelectableCount(key: string): number {
    const items: Entity[] = (ECMO_DATA as any)[key] || [];
    return items.filter(i => !i.isCategory).length;
  }

  getDataKeyForEntity(entity: Entity): string {
    for (const cat of CATEGORIES) {
      const items: Entity[] = (ECMO_DATA as any)[cat.key] || [];
      if (items.some(i => i.uri === entity.uri)) {
        return cat.key;
      }
    }
    return '';
  }

  // Natural language helpers
  getGroupedQuery(): { type: EntityType; operator: 'any' | 'all' | 'none'; items: Entity[] }[] {
    const grouped: Record<string, QueryEntity[]> = {};
    this.query.forEach(qe => {
      if (!grouped[qe.entity.type]) grouped[qe.entity.type] = [];
      grouped[qe.entity.type].push(qe);
    });
    return Object.entries(grouped).map(([type, queryEntities]) => ({
      type: type as EntityType,
      operator: queryEntities[0].operator,  // Use first operator (all should be same for a type)
      items: queryEntities.map(qe => qe.entity),
    }));
  }

  getOperatorLabel(operator: 'any' | 'all' | 'none'): string {
    switch (operator) {
      case 'any': return 'any of';
      case 'all': return 'all of';
      case 'none': return 'none of';
      default: return 'any of';
    }
  }

  getFirstOperatorLabel(operator: 'any' | 'all' | 'none'): string {
    switch (operator) {
      case 'any': return 'have';
      case 'all': return 'have';
      case 'none': return 'exclude';
      default: return 'have';
    }
  }

  getSubsequentOperatorLabel(operator: 'any' | 'all' | 'none'): string {
    switch (operator) {
      case 'any': return 'or';
      case 'all': return 'and';
      case 'none': return 'not';
      default: return 'or';
    }
  }

  toggleOperatorDropdown(type: EntityType, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.operatorDropdownOpen = this.operatorDropdownOpen === type ? null : type;
  }

  toggleOperatorDropdownForEntity(uri: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.operatorDropdownOpen = this.operatorDropdownOpen === uri ? null : uri;
  }

  isOperatorDropdownOpen(type: EntityType): boolean {
    return this.operatorDropdownOpen === type;
  }

  isOperatorDropdownOpenForEntity(uri: string): boolean {
    return this.operatorDropdownOpen === uri;
  }

  selectOperator(type: EntityType, operator: 'any' | 'all' | 'none', event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.setOperatorForType(type, operator);
    this.operatorDropdownOpen = null;
  }

  selectOperatorForEntity(uri: string, operator: 'any' | 'all' | 'none', event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.setOperatorForEntity(uri, operator);
    this.operatorDropdownOpen = null;
  }

  getTypeLabel(type: EntityType, count: number): string {
    const cfg = TYPE_CONFIG[type];
    return count > 1 ? cfg.plural : cfg.singular;
  }

  addToQueryWithoutNavigation(entity: Entity, event: Event): void {
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
    
    // Set flag to prevent any navigation that might be triggered
    this.preventNavigation = true;
    
    // Add to query WITHOUT changing selected entity (no navigation)
    if (this.isHeader(entity)) {
      this.preventNavigation = false;
      return;
    }
    
    const defaultOperator = this.getDefaultOperator(entity.type);
    
    if (!this.query.find(q => q.entity.uri === entity.uri)) {
      this.query = [...this.query, { entity, operator: defaultOperator }];
    }
    
    // Reset flag after a short delay to ensure any queued events are processed
    setTimeout(() => {
      this.preventNavigation = false;
    }, 100);
    
    // Do NOT set this.selected = entity (this would trigger navigation)
    this.searchQuery = '';
    this.showDropdown = false;
    this.updateQueryResults();
    // Do NOT call updateRelatedEntities() since we're not changing selected
  }

  isVirtualAllEntity(entity: Entity): boolean {
    return entity?.uri?.startsWith('virtual:All') || false;
  }

  // Get diseases from relatedEntities (for non-Disease categories showing inverse relations)
  getRelatedDiseases(): Entity[] {
    return this.relatedEntities.filter(e => e.type === 'Disease');
  }

  // Get non-disease entities from relatedEntities
  getCategoryInstances(): Entity[] {
    return this.relatedEntities.filter(e => e.type !== 'Disease');
  }

  // Get diseases in a Disease category (for showing in "Diseases in this category" section)
  getDiseaseInstances(): Entity[] {
    if (!this.selected || this.selected.type !== 'Disease' || !this.selected.isCategory) {
      return [];
    }
    
    const dataKey = this.getDataKeyForEntity(this.selected);
    
    if (this.selected.uri?.startsWith('virtual:All')) {
      // For "All Diseases", get all diseases
      return ECMO_DATA.diseases.filter(d => !d.isCategory);
    } else {
      // For specific disease categories, get descendants
      return getAllDescendants(this.selected.uri, dataKey);
    }
  }

  getRelationLabel(type: string): string {
    return (RELATION_LABELS as any)[type]?.plural || type;
  }

  getReverseRelationLabel(type: EntityType): string {
    return REVERSE_RELATION_LABELS[type] || 'is related to';
  }

  // NUOVO: Descrizione entità per natural language
  getEntityDescription(entity: Entity): string {
    if (entity.isCategory) {
      const dataKey = this.getDataKeyForEntity(entity);
      const descendants = getAllDescendants(entity.uri, dataKey);
      
      // For virtual "All" entities, don't add the type suffix
      if (entity.uri?.startsWith('virtual:All')) {
        return `any ${entity.label.toLowerCase()} (${descendants.length} types)`;
      }
      
      return `any ${entity.label.toLowerCase()} (${descendants.length} types)`;
    }
    return entity.label;
  }

  // Group related entities by type
  getGroupedRelatedEntities(): { type: EntityType; entities: Entity[] }[] {
    const grouped: Record<string, Entity[]> = {};
    this.relatedEntities.forEach(e => {
      if (!grouped[e.type]) grouped[e.type] = [];
      grouped[e.type].push(e);
    });
    return Object.entries(grouped).map(([type, entities]) => ({
      type: type as EntityType,
      entities,
    }));
  }

  getArticleEntity(uri: string): Entity | undefined {
    return getEntityByUri(uri);
  }

  trackByUri(index: number, item: Entity): string {
    return item.uri;
  }

  trackById(index: number, item: Article): number {
    return item.id;
  }
}
