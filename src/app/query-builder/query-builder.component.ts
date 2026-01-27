import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Entity,
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
  query: Entity[] = [];
  selected: Entity | null = null;
  queryView: 'natural' | 'technical' = 'natural';
  detailOpen = true;
  expandedGroups: Record<string, boolean> = {};
  expandedCategories: Record<string, boolean> = {};

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
      // Include top-level categories/instances but exclude virtual "All" entities
      const filtered = items.filter((i: Entity) => !i.parent && !i.uri?.startsWith('virtual:'));
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

  // Query Management - MODIFICATO per supportare categorie
  addToQuery(entity: Entity): void {
    // Blocca solo gli header, non le categorie
    if (this.isHeader(entity)) return;
    
    // Permetti sia categorie che istanze
    if (!this.query.find(q => q.uri === entity.uri)) {
      this.query = [...this.query, entity];
    }
    
    this.selected = entity;
    this.searchQuery = '';
    this.showDropdown = false;
    this.updateQueryResults();
    this.updateRelatedEntities();
  }

  removeFromQuery(uri: string): void {
    this.query = this.query.filter(q => q.uri !== uri);
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
      return this.query.every(q => {
        // Se è una categoria, matcha se l'articolo contiene QUALSIASI discendente
        if (q.isCategory) {
          const dataKey = this.getDataKeyForEntity(q);
          const descendants = getAllDescendants(q.uri, dataKey);
          return descendants.some(child => article.entities.includes(child.uri));
        }
        
        // Se è un'istanza, match diretto
        return article.entities.includes(q.uri);
      });
    });
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
        // For non-Disease categories, show all children as related entities
        const dataKey = this.getDataKeyForEntity(this.selected);
        
        // For virtual "All" entities, get ALL entities in that category
        if (this.selected.uri?.startsWith('virtual:All')) {
          const allItems: Entity[] = (ECMO_DATA as any)[dataKey] || [];
          // Exclude only the virtual "All" entity itself, keep everything else
          this.relatedEntities = allItems.filter(i => !i.uri?.startsWith('virtual:'));
        } else {
          const children = this.getChildren(this.selected.uri, dataKey);
          this.relatedEntities = children;
        }
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
      if (!this.query.find(q => q.uri === item.uri)) {
        this.query = [...this.query, item];
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
    return this.query.some(q => q.uri === virtualUri);
  }

  // Toggle "All [Category]" selection
  toggleAllCategory(key: string): void {
    const items: Entity[] = (ECMO_DATA as any)[key] || [];
    const virtualEntity = items.find(i => i.uri?.startsWith('virtual:All'));
    
    if (!virtualEntity) return;
    
    if (this.isAllCategorySelected(key)) {
      // Remove the virtual "All" entity
      this.query = this.query.filter(q => q.uri !== virtualEntity.uri);
    } else {
      // Add the virtual "All" entity
      this.query = [...this.query, virtualEntity];
      
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
      if (!this.query.find(q => q.uri === virtualEntity.uri)) {
        this.query = [...this.query, virtualEntity];
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
    return !!this.query.find(q => q.uri === uri);
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
  getGroupedQuery(): { type: EntityType; items: Entity[] }[] {
    const grouped: Record<string, Entity[]> = {};
    this.query.forEach(q => {
      if (!grouped[q.type]) grouped[q.type] = [];
      grouped[q.type].push(q);
    });
    return Object.entries(grouped).map(([type, items]) => ({
      type: type as EntityType,
      items,
    }));
  }

  getTypeLabel(type: EntityType, count: number): string {
    const cfg = TYPE_CONFIG[type];
    return count > 1 ? cfg.plural : cfg.singular;
  }

  isVirtualAllEntity(entity: Entity): boolean {
    return entity?.uri?.startsWith('virtual:All') || false;
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
