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
  getEntityByUri,
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
      const filtered = items.filter((i: Entity) => i.isCategory || !i.parent);
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

  // Query Management
  addToQuery(entity: Entity): void {
    if (this.isHeader(entity) || entity.isCategory) return;
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
    if (this.isHeader(entity) || entity.isCategory) return;
    this.selected = entity;
    this.detailOpen = true;
    this.updateRelatedEntities();
  }

  // Results
  updateQueryResults(): void {
    if (this.query.length === 0) {
      this.queryResults = [];
      return;
    }

    this.queryResults = EIOS_ARTICLES.filter(article =>
      this.query.every(q => article.entities.includes(q.uri))
    );
  }

  updateRelatedEntities(): void {
    if (!this.selected) {
      this.relatedEntities = [];
      return;
    }

    const allEntities = getAllEntities();

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

  // Helpers
  isHeader(item: any): item is { isHeader: true } {
    return item && item.isHeader === true;
  }

  getTypeConfig(type: EntityType): TypeConfig {
    return TYPE_CONFIG[type];
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
    return (ECMO_DATA as any)[key] || [];
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

  getRelationLabel(type: string): string {
    return (RELATION_LABELS as any)[type]?.plural || type;
  }

  getReverseRelationLabel(type: EntityType): string {
    return REVERSE_RELATION_LABELS[type] || 'is related to';
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
