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
} from './query-builder.data';
import { EcmoDataService } from '../services/ecmo-data.service';

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

  // Navigation history
  navigationHistory: Entity[] = [];
  navigationIndex: number = -1;

  // Data references
  categories: CategoryDef[];
  typeConfig: Record<EntityType, TypeConfig>;
  ecmoData: {
    diseases: Entity[];
    symptoms: Entity[];
    pathogens: Entity[];
    vectors: Entity[];
    hosts: Entity[];
    hazards: Entity[];
    routesOfTransmission: Entity[];
    phsmTypes: Entity[];
    animalTypes: Entity[];
    taxonomicRanks: Entity[];
    severityLevels: Entity[];
    plantTypes: Entity[];
    species: Entity[];
    toxinTypes: Entity[];
    pestTypes: Entity[];
    owlClasses: Entity[];
    relations: Record<string, Record<string, string[]>>;
  };

  constructor(private dataService: EcmoDataService) {
    this.categories = dataService.categories;
    this.typeConfig = dataService.typeConfig;
    this.ecmoData = dataService.ecmoData;
  }

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
    const cat = this.categories.find(
      c => c.label.toLowerCase().includes(q) || c.key.includes(q)
    );

    if (cat) {
      const items = (this.ecmoData as any)[cat.key] || [];
      // Include all items except virtual "All" entities
      const filtered = items.filter((i: Entity) => !i.uri?.startsWith('virtual:'));

      // Sort: OWL Classes first, then categories, then regular instances
      const sorted = filtered.sort((a: Entity, b: Entity) => {
        // OWL Classes first
        if (a.isOwlClass && !b.isOwlClass) return -1;
        if (!a.isOwlClass && b.isOwlClass) return 1;

        // Then categories
        if (a.isCategory && !b.isCategory) return -1;
        if (!a.isCategory && b.isCategory) return 1;

        // Then alphabetically
        return a.label.localeCompare(b.label);
      });

      this.searchResults = [
        { isHeader: true, label: cat.label, type: items[0]?.type, key: cat.key },
        ...sorted,
      ];
      return;
    }

    // Search entities
    const results: Entity[] = [];
    this.categories.forEach(category => {
      const items: Entity[] = (this.ecmoData as any)[category.key] || [];
      items.forEach(item => {
        if (item.label.toLowerCase().includes(q)) {
          results.push(item);
        }
      });
    });

    // Sort: OWL Classes first, then categories, then regular instances
    const sorted = results.sort((a: Entity, b: Entity) => {
      // OWL Classes first
      if (a.isOwlClass && !b.isOwlClass) return -1;
      if (!a.isOwlClass && b.isOwlClass) return 1;

      // Then categories
      if (a.isCategory && !b.isCategory) return -1;
      if (!a.isCategory && b.isCategory) return 1;

      // Then alphabetically
      return a.label.localeCompare(b.label);
    });

    this.searchResults = sorted.slice(0, 20);
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

  selectEntity(entity: Entity, skipHistory: boolean = false): void {
    if (this.isHeader(entity)) return;
    if (this.preventNavigation) {
      // Don't navigate if we're in the middle of adding without navigation
      this.preventNavigation = false;
      return;
    }

    // Add to navigation history (unless we're navigating via back/forward)
    if (!skipHistory) {
      // Remove any forward history if we're navigating to a new entity
      if (this.navigationIndex < this.navigationHistory.length - 1) {
        this.navigationHistory = this.navigationHistory.slice(0, this.navigationIndex + 1);
      }

      // Add the new entity to history
      this.navigationHistory.push(entity);
      this.navigationIndex = this.navigationHistory.length - 1;
    }

    this.selected = entity;
    this.detailOpen = true;
    this.updateRelatedEntities();
  }

  // Navigation history methods
  canGoBack(): boolean {
    return this.navigationIndex > 0;
  }

  canGoForward(): boolean {
    return this.navigationIndex < this.navigationHistory.length - 1;
  }

  goBack(): void {
    if (this.canGoBack()) {
      this.navigationIndex--;
      const entity = this.navigationHistory[this.navigationIndex];
      this.selected = entity;
      this.detailOpen = true;
      this.updateRelatedEntities();
    }
  }

  goForward(): void {
    if (this.canGoForward()) {
      this.navigationIndex++;
      const entity = this.navigationHistory[this.navigationIndex];
      this.selected = entity;
      this.detailOpen = true;
      this.updateRelatedEntities();
    }
  }

  getBreadcrumb(): Entity[] {
    const breadcrumb: Entity[] = [];
    let current = this.selected;

    // Build breadcrumb by following parent chain
    while (current) {
      breadcrumb.unshift(current);

      if (!current.parent) break;

      // Find parent entity
      const allEntities = this.dataService.getAllEntities();
      current = allEntities.find((e: Entity) => e.uri === current!.parent) || null;
    }

    return breadcrumb;
  }

  /**
   * Navigate to the parent category of the current entity
   */
  navigateToParentCategory(): void {
    if (!this.selected || this.selected.isCategory) return;

    // Find the parent category entity
    const parentUri = this.selected.parent;
    if (!parentUri) return;

    // Search for the parent entity across all entity types
    const allEntities = [
      ...this.ecmoData.diseases,
      ...this.ecmoData.symptoms,
      ...this.ecmoData.pathogens,
      ...this.ecmoData.vectors,
      ...this.ecmoData.hosts,
      ...this.ecmoData.hazards
    ];

    const parentEntity = allEntities.find(e => e.uri === parentUri);
    if (parentEntity) {
      this.selectEntity(parentEntity);
    }
  }

  /**
   * Navigate to the OWL Class definition of a given entity type
   */
  navigateToTypeCategory(entityType: EntityType): void {
    // Strategy: Find the ROOT OWL class (parent), not a subclass
    // 1. Look for OWL class whose URI ends exactly with the entityType name (e.g., "Disease" not "InfectiousDisease")
    // 2. Look for OWL class WITHOUT subClassOf (it's the root class)
    // 3. Fallback to any OWL class for this type

    const allCandidates = [
      ...this.ecmoData.owlClasses.filter(c => c.type === entityType && c.isOwlClass),
      ...this.getEntitiesForType(entityType).filter(c => c.isOwlClass && c.type === entityType)
    ];

    if (allCandidates.length === 0) {
      // No OWL class found, fallback to root category
      this.navigateToRootCategory(entityType);
      return;
    }

    // Priority 1: Find class whose URI ends with exactly the entityType
    // Must be an exact match after the last separator (e.g., /Disease not /InfectiousDisease, /Symptom not /SignOrSymptom)
    let owlClass = allCandidates.find(c => {
      // Split URI by common separators (/, #)
      const uriParts = c.uri.split(/[/#]/);
      const lastPart = uriParts[uriParts.length - 1];

      // Exact match required - must be identical to entityType
      return lastPart === entityType;
    });

    // Priority 2: Find class without subClassOf (it's the root/parent class)
    if (!owlClass) {
      owlClass = allCandidates.find(c => !c.subClassOf || c.subClassOf.length === 0);
    }

    // Priority 3: Find class with exact label match
    if (!owlClass) {
      const typeConfig = this.getTypeConfig(entityType);
      const expectedLabel = typeConfig?.label || entityType;
      owlClass = allCandidates.find(c => c.label === expectedLabel);
    }

    // Priority 4: Find class with fewest subClassOf (most "base" class for this type)
    if (!owlClass) {
      const sorted = [...allCandidates].sort((a, b) => {
        const aCount = a.subClassOf?.length || 0;
        const bCount = b.subClassOf?.length || 0;
        return aCount - bCount;
      });
      owlClass = sorted[0];
    }

    // Fallback: Just take the first one (should never reach here)
    if (!owlClass) {
      owlClass = allCandidates[0];
    }

    this.selectEntity(owlClass);
  }

  /**
   * Get entities array for a given type
   */
  private getEntitiesForType(entityType: EntityType): Entity[] {
    const entitiesMap: Record<EntityType, Entity[]> = {
      Disease: this.ecmoData.diseases,
      Symptom: this.ecmoData.symptoms,
      Pathogen: this.ecmoData.pathogens,
      Vector: this.ecmoData.vectors,
      Host: this.ecmoData.hosts,
      Hazard: this.ecmoData.hazards,
      RouteOfTransmission: this.ecmoData.routesOfTransmission,
      PHSMType: this.ecmoData.phsmTypes,
      AnimalType: this.ecmoData.animalTypes,
      TaxonomicRank: this.ecmoData.taxonomicRanks,
      SeverityLevel: this.ecmoData.severityLevels,
      PlantType: this.ecmoData.plantTypes,
      Species: this.ecmoData.species,
      ToxinType: this.ecmoData.toxinTypes,
      PestType: this.ecmoData.pestTypes,
    };
    return entitiesMap[entityType] || [];
  }

  /**
   * Navigate to the root category (all instances) of a given entity type
   */
  navigateToRootCategory(entityType: EntityType): void {
    const entitiesMap: Record<EntityType, Entity[]> = {
      Disease: this.ecmoData.diseases,
      Symptom: this.ecmoData.symptoms,
      Pathogen: this.ecmoData.pathogens,
      Vector: this.ecmoData.vectors,
      Host: this.ecmoData.hosts,
      Hazard: this.ecmoData.hazards,
      RouteOfTransmission: this.ecmoData.routesOfTransmission,
      PHSMType: this.ecmoData.phsmTypes,
      AnimalType: this.ecmoData.animalTypes,
      TaxonomicRank: this.ecmoData.taxonomicRanks,
      SeverityLevel: this.ecmoData.severityLevels,
      PlantType: this.ecmoData.plantTypes,
      Species: this.ecmoData.species,
      ToxinType: this.ecmoData.toxinTypes,
      PestType: this.ecmoData.pestTypes,
    };

    const entities = entitiesMap[entityType];
    if (!entities) return;

    // Find the root category (isCategory = true, no parent)
    const rootCategory = entities.find(e => e.isCategory && !e.parent);
    if (rootCategory) {
      this.selectEntity(rootCategory);
      return;
    }

    // If no root category exists, create a virtual "All instances" view
    const typeConfig = this.getTypeConfig(entityType);
    const virtualAllInstances: Entity = {
      uri: `virtual:AllInstances:${entityType}`,
      label: `All ${typeConfig.plural}`,
      type: entityType,
      isCategory: true,
      description: `View all instances of ${typeConfig.label} in the ontology.`
    };

    this.selectEntity(virtualAllInstances);
  }

  /**
   * Map property names to their target EntityTypes for navigation
   */
  private propertyToEntityTypeMap: Record<string, EntityType> = {
    'hasRouteOfTransmission': 'RouteOfTransmission',
    'hasOutcome': 'SeverityLevel',
    'hasRank': 'TaxonomicRank',
    'producesToxin': 'ToxinType',
    'causesDiseases': 'Disease',
    'isVectorOf': 'Disease',
    'isSusceptibleHostOf': 'Disease',
    'isSignOrSymptomOf': 'Disease',
    'isManifestationIn': 'Hazard',
    // Note: Some properties like 'belongsTo', 'includes', 'hasIncubationPeriod', 'composedOfOrganisms'
    // don't map to a specific entity type or are context-dependent
  };

  /**
   * Get the target EntityType for a property (if it's navigable)
   */
  getPropertyTargetType(property: string): EntityType | null {
    return this.propertyToEntityTypeMap[property] || null;
  }

  /**
   * Check if a property is navigable (maps to an entity type)
   */
  isPropertyNavigable(property: string): boolean {
    return property in this.propertyToEntityTypeMap;
  }

  /**
   * Navigate to the OWL class for a given property
   */
  navigateToPropertyClass(property: string): void {
    const targetType = this.getPropertyTargetType(property);
    if (targetType) {
      this.navigateToTypeCategory(targetType);
    }
  }

  /**
   * Get the OWL Class entity for a property (for adding to query)
   */
  getOwlClassForProperty(property: string): Entity | null {
    const targetType = this.getPropertyTargetType(property);
    if (!targetType) return null;

    return this.ecmoData.owlClasses.find((c: Entity) => c.type === targetType && c.isOwlClass) || null;
  }

  /**
   * Get the model fields/properties for a given entity type
   */
  getModelFieldsForType(entityType: EntityType): { name: string; property: string }[] {
    const fieldsMap: Record<EntityType, { name: string; property: string }[]> = {
      Disease: [
        { name: 'Routes of Transmission', property: 'hasRouteOfTransmission' },
        { name: 'Outcomes', property: 'hasOutcome' },
        { name: 'Incubation Period', property: 'hasIncubationPeriod' }
      ],
      Pathogen: [
        { name: 'Belongs To', property: 'belongsTo' },
        { name: 'Taxonomic Rank', property: 'hasRank' },
        { name: 'Includes', property: 'includes' },
        { name: 'Produces Toxin', property: 'producesToxin' },
        { name: 'Causes Diseases', property: 'causesDiseases' }
      ],
      Vector: [
        { name: 'Belongs To', property: 'belongsTo' },
        { name: 'Taxonomic Rank', property: 'hasRank' },
        { name: 'Includes', property: 'includes' },
        { name: 'Vector of Diseases', property: 'isVectorOf' }
      ],
      Host: [
        { name: 'Belongs To', property: 'belongsTo' },
        { name: 'Taxonomic Rank', property: 'hasRank' },
        { name: 'Includes', property: 'includes' },
        { name: 'Susceptible To Diseases', property: 'isSusceptibleHostOf' },
        { name: 'Composed Of Organisms', property: 'composedOfOrganisms' }
      ],
      Symptom: [
        { name: 'Present in Diseases', property: 'isSignOrSymptomOf' }
      ],
      Hazard: [
        { name: 'Manifested in Events', property: 'isManifestationIn' }
      ],
      AnimalType: [
        { name: 'Belongs To', property: 'belongsTo' },
        { name: 'Taxonomic Rank', property: 'hasRank' },
        { name: 'Includes', property: 'includes' }
      ],
      PlantType: [
        { name: 'Belongs To', property: 'belongsTo' },
        { name: 'Taxonomic Rank', property: 'hasRank' },
        { name: 'Includes', property: 'includes' }
      ],
      Species: [
        { name: 'Belongs To', property: 'belongsTo' },
        { name: 'Taxonomic Rank', property: 'hasRank' },
        { name: 'Includes', property: 'includes' }
      ],
      RouteOfTransmission: [],
      PHSMType: [],
      TaxonomicRank: [],
      SeverityLevel: [],
      ToxinType: [],
      PestType: []
    };

    return fieldsMap[entityType] || [];
  }

  /**
   * Get the count of instances for a given entity type
   */
  getInstanceCountForType(entityType: EntityType): number {
    const entitiesMap: Record<EntityType, Entity[]> = {
      Disease: this.ecmoData.diseases,
      Symptom: this.ecmoData.symptoms,
      Pathogen: this.ecmoData.pathogens,
      Vector: this.ecmoData.vectors,
      Host: this.ecmoData.hosts,
      Hazard: this.ecmoData.hazards,
      RouteOfTransmission: this.ecmoData.routesOfTransmission,
      PHSMType: this.ecmoData.phsmTypes,
      AnimalType: this.ecmoData.animalTypes,
      TaxonomicRank: this.ecmoData.taxonomicRanks,
      SeverityLevel: this.ecmoData.severityLevels,
      PlantType: this.ecmoData.plantTypes,
      Species: this.ecmoData.species,
      ToxinType: this.ecmoData.toxinTypes,
      PestType: this.ecmoData.pestTypes,
    };

    const entities = entitiesMap[entityType];
    if (!entities) return 0;

    // Count non-category entities
    return entities.filter(e => !e.isCategory && !e.isOwlClass).length;
  }

  /**
   * Get all instances for a given entity type (sorted: categories first, then instances)
   */
  getInstancesForType(entityType: EntityType): Entity[] {
    const entitiesMap: Record<EntityType, Entity[]> = {
      Disease: this.ecmoData.diseases,
      Symptom: this.ecmoData.symptoms,
      Pathogen: this.ecmoData.pathogens,
      Vector: this.ecmoData.vectors,
      Host: this.ecmoData.hosts,
      Hazard: this.ecmoData.hazards,
      RouteOfTransmission: this.ecmoData.routesOfTransmission,
      PHSMType: this.ecmoData.phsmTypes,
      AnimalType: this.ecmoData.animalTypes,
      TaxonomicRank: this.ecmoData.taxonomicRanks,
      SeverityLevel: this.ecmoData.severityLevels,
      PlantType: this.ecmoData.plantTypes,
      Species: this.ecmoData.species,
      ToxinType: this.ecmoData.toxinTypes,
      PestType: this.ecmoData.pestTypes,
    };

    const entities = entitiesMap[entityType];
    if (!entities) return [];

    // Filter out OWL classes, then sort: categories first, then instances alphabetically
    return entities
      .filter(e => !e.isOwlClass)
      .sort((a, b) => {
        // Categories first
        if (a.isCategory && !b.isCategory) return -1;
        if (!a.isCategory && b.isCategory) return 1;
        // Then alphabetically
        return a.label.localeCompare(b.label);
      });
  }

  // Results - MODIFICATO per supportare match con categorie (anche multi-livello)
  updateQueryResults(): void {
    if (this.query.length === 0) {
      this.queryResults = [];
      return;
    }

    this.queryResults = this.dataService.articles.filter(article => {
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
      const descendants = this.dataService.getAllDescendants(entity.uri, dataKey);
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

    const allEntities = this.dataService.getAllEntities();

    // If selected is a CATEGORY/CLASS
    if (this.selected.isCategory) {
      if (this.selected.type === 'Disease') {
        // Get all descendant diseases
        const dataKey = this.getDataKeyForEntity(this.selected);
        const descendantDiseases = this.dataService.getAllDescendants(this.selected.uri, dataKey);

        // Aggregate all related entities from descendant diseases
        const aggregatedUris = new Set<string>();

        descendantDiseases.forEach(disease => {
          const rels = this.ecmoData.relations[disease.uri] || {};
          this.dataService.relationKeys.forEach(key => {
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
          const allItems: Entity[] = (this.ecmoData as any)[dataKey] || [];
          categoryEntities = allItems.filter(i => !i.uri?.startsWith('virtual:'));
        } else {
          // For regular categories, get all descendants recursively
          categoryEntities = this.dataService.getAllDescendants(this.selected.uri, dataKey);
        }
        
        // Calculate inverse relations: find diseases that reference these entities
        const relatedDiseaseUris = new Set<string>();
        const categoryEntityUris = new Set(categoryEntities.map(e => e.uri));

        this.ecmoData.diseases.forEach(disease => {
          const rels = this.ecmoData.relations[disease.uri];
          if (rels) {
            this.dataService.relationKeys.forEach(key => {
              const values = rels[key] || [];
              if (values.some(uri => categoryEntityUris.has(uri))) {
                relatedDiseaseUris.add(disease.uri);
              }
            });
          }
        });
        
        // Store both: the related diseases and the category entities
        const diseases = Array.from(relatedDiseaseUris)
          .map(uri => this.ecmoData.diseases.find(d => d.uri === uri))
          .filter(Boolean) as Entity[];
        
        // Put diseases first, then category entities
        this.relatedEntities = [...diseases, ...categoryEntities];
      }
      return;
    }

    // If selected is an INSTANCE (existing logic)
    if (this.selected.type === 'Disease') {
      const rels = this.ecmoData.relations[this.selected.uri] || {};
      const results: Entity[] = [];
      this.dataService.relationKeys.forEach(key => {
        (rels[key] || []).forEach((uri: string) => {
          const found = allEntities.find(e => e.uri === uri);
          if (found) results.push(found);
        });
      });
      this.relatedEntities = results;
    } else {
      // Find diseases that have this entity
      const diseases = this.ecmoData.diseases.filter(d => {
        if (d.isCategory) return false;
        const rels = this.ecmoData.relations[d.uri] || {};
        return this.dataService.relationKeys.some(k => (rels[k] || []).includes(this.selected!.uri));
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
    const items: Entity[] = (this.ecmoData as any)[key] || [];
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
    // Get the entity type from the first item in this category
    const items: Entity[] = (this.ecmoData as any)[key] || [];
    if (items.length === 0) return false;

    const entityType = items[0].type;

    // Check if the OWL Class for this type is in the query
    const owlClass = this.ecmoData.owlClasses.find((c: Entity) => c.type === entityType && c.isOwlClass);
    if (!owlClass) return false;

    return this.query.some(q => q.entity.uri === owlClass.uri);
  }

  // Toggle "All [Category]" selection
  toggleAllCategory(key: string): void {
    const items: Entity[] = (this.ecmoData as any)[key] || [];
    if (items.length === 0) return;

    const entityType = items[0].type;

    // Find the OWL Class for this type
    const owlClass = this.ecmoData.owlClasses.find((c: Entity) => c.type === entityType && c.isOwlClass);
    if (!owlClass) return;

    if (this.isAllCategorySelected(key)) {
      // Remove the OWL Class entity
      this.query = this.query.filter(q => q.entity.uri !== owlClass.uri);
    } else {
      // Add the OWL Class entity
      const defaultOperator = this.getDefaultOperator(owlClass.type);
      this.query = [...this.query, { entity: owlClass, operator: defaultOperator }];

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
    // Get the entity type from the first item in this category
    const items: Entity[] = (this.ecmoData as any)[key] || [];
    if (items.length === 0) return;

    const entityType = items[0].type;

    // Navigate to the OWL Class or root category for this type
    this.navigateToTypeCategory(entityType);
  }

  // Select "All [Category]" from dropdown header
  selectAllFromDropdown(headerItem: any): void {
    if (!headerItem.key) return;

    // Get the entity type from the first item in this category
    const items: Entity[] = (this.ecmoData as any)[headerItem.key] || [];
    if (items.length === 0) return;

    const entityType = items[0].type;

    // Find the OWL Class for this type
    const owlClass = this.ecmoData.owlClasses.find((c: Entity) => c.type === entityType && c.isOwlClass);

    if (owlClass) {
      // Add OWL Class to query
      if (!this.query.find(q => q.entity.uri === owlClass.uri)) {
        const defaultOperator = this.getDefaultOperator(owlClass.type);
        this.query = [...this.query, { entity: owlClass, operator: defaultOperator }];
      }

      // Select for details panel
      this.selected = owlClass;

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
    return this.typeConfig[type];
  }

  getCategoryTypeConfig(key: string): TypeConfig | null {
    const items = this.getCategoryItems(key);
    return items.length > 0 ? this.typeConfig[items[0].type] : null;
  }

  getSelectedConfig(): TypeConfig | null {
    return this.selected ? this.typeConfig[this.selected.type] : null;
  }

  isInQuery(uri: string): boolean {
    return !!this.query.find(q => q.entity.uri === uri);
  }

  getChildren(parentUri: string, dataKey: string): Entity[] {
    const items: Entity[] = (this.ecmoData as any)[dataKey] || [];
    return items.filter(i => i.parent === parentUri);
  }

  getCategoryItems(key: string): Entity[] {
    const items: Entity[] = (this.ecmoData as any)[key] || [];
    // Return only top-level items (no parent) and exclude virtual "All" entities
    return items.filter(i => !i.parent && !i.uri?.startsWith('virtual:'));
  }

  getSelectableCount(key: string): number {
    const items: Entity[] = (this.ecmoData as any)[key] || [];
    return items.filter(i => !i.isCategory).length;
  }

  getDataKeyForEntity(entity: Entity): string {
    for (const cat of this.categories) {
      const items: Entity[] = (this.ecmoData as any)[cat.key] || [];
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
    const cfg = this.typeConfig[type];
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

  removeFromQueryWithoutNavigation(uri: string, event: Event): void {
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
    
    // Set flag to prevent any navigation that might be triggered
    this.preventNavigation = true;
    
    // Remove from query WITHOUT changing selected entity (no navigation)
    this.removeFromQuery(uri);
    
    // Reset flag after a short delay to ensure any queued events are processed
    setTimeout(() => {
      this.preventNavigation = false;
    }, 100);
    
    // Do NOT change selected entity (this would trigger navigation)
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
    const entities = this.relatedEntities.filter(e => e.type !== 'Disease');
    // Sort: categories first, then instances
    return entities.sort((a, b) => {
      if (a.isCategory && !b.isCategory) return -1;
      if (!a.isCategory && b.isCategory) return 1;
      return a.label.localeCompare(b.label);
    });
  }

  // Get diseases in a Disease category (for showing in "Diseases in this category" section)
  getDiseaseInstances(): Entity[] {
    if (!this.selected || this.selected.type !== 'Disease' || !this.selected.isCategory) {
      return [];
    }

    const dataKey = this.getDataKeyForEntity(this.selected);

    let entities: Entity[];
    if (this.selected.uri?.startsWith('virtual:All')) {
      // For "All Diseases", get all diseases (including categories and instances)
      entities = this.ecmoData.diseases.filter(d => !d.isOwlClass);
    } else {
      // For specific disease categories, get descendants
      entities = this.dataService.getAllDescendants(this.selected.uri, dataKey);
    }

    // Sort: categories first, then instances
    return entities.sort((a, b) => {
      if (a.isCategory && !b.isCategory) return -1;
      if (!a.isCategory && b.isCategory) return 1;
      return a.label.localeCompare(b.label);
    });
  }

  getRelationLabel(type: string): string {
    return (this.dataService.relationLabels as any)[type]?.plural || type;
  }

  getReverseRelationLabel(type: EntityType): string {
    return this.dataService.reverseRelationLabels[type] || 'is related to';
  }

  // NUOVO: Descrizione entità per natural language
  getEntityDescription(entity: Entity): string {
    if (entity.isCategory) {
      const dataKey = this.getDataKeyForEntity(entity);
      const descendants = this.dataService.getAllDescendants(entity.uri, dataKey);

      // For virtual "All" entities, don't add the type suffix
      if (entity.uri?.startsWith('virtual:All')) {
        return `any ${entity.label.toLowerCase()} (${descendants.length} types)`;
      }

      return `any ${entity.label.toLowerCase()} (${descendants.length} types)`;
    }
    return entity.label;
  }

  /**
   * Format property value by removing URI prefixes and converting to readable text
   */
  formatPropertyValue(value: any): string {
    if (Array.isArray(value)) {
      return value.map(v => this.formatSingleValue(v)).join(', ');
    }
    return this.formatSingleValue(value);
  }

  private formatSingleValue(value: any): string {
    if (typeof value !== 'string') {
      return String(value);
    }

    // Remove URI prefixes (ph:, bio:, core:)
    let formatted = value;
    if (formatted.startsWith('ph:')) {
      formatted = formatted.substring(3);
    } else if (formatted.startsWith('bio:')) {
      formatted = formatted.substring(4);
    } else if (formatted.startsWith('core:')) {
      formatted = formatted.substring(5);
    }

    // Convert CamelCase to Title Case with spaces
    formatted = formatted.replace(/([A-Z])/g, ' $1').trim();

    return formatted;
  }

  /**
   * Get entities from property URIs (for clickable tags)
   */
  getEntitiesFromProperty(propertyValues: string[] | string): Entity[] {
    if (!propertyValues) return [];

    const values = Array.isArray(propertyValues) ? propertyValues : [propertyValues];
    const entities: Entity[] = [];
    const allEntities = this.dataService.getAllEntities();

    values.forEach(uri => {
      const entity = allEntities.find(e => e.uri === uri);
      if (entity) {
        entities.push(entity);
      }
    });

    return entities;
  }

  /**
   * Check if a property value is a list of entity URIs (vs plain text values)
   */
  isPropertyValueEntityList(value: any): boolean {
    if (!value) return false;

    // If it's not an array or string, it's not an entity URI
    if (!Array.isArray(value) && typeof value !== 'string') return false;

    // Get the values as an array
    const values = Array.isArray(value) ? value : [value];
    if (values.length === 0) return false;

    // Check if at least one value is an entity URI (has prefix ph:, bio:, or core:)
    return values.some((v: any) => {
      if (typeof v !== 'string') return false;
      return v.startsWith('ph:') || v.startsWith('bio:') || v.startsWith('core:');
    });
  }

  /**
   * Format property name from camelCase to human-readable
   */
  formatPropertyName(propName: string): string {
    // Special cases for better readability
    const specialCases: Record<string, string> = {
      'taxonomicRank': 'Taxonomic Rank',
      'belongsTo': 'Belongs To',
      'includes': 'Includes',
      'producesToxin': 'Produces Toxin',
      'causedDiseases': 'Causes Diseases',
      'vectorOfDiseases': 'Vector of Diseases',
      'susceptibleToDiseases': 'Susceptible to Diseases',
      'composedOfOrganisms': 'Composed of Organisms',
      'presentInDiseases': 'Present in Diseases',
      'manifestedInEvents': 'Manifested in Events',
      'routesOfTransmission': 'Routes of Transmission',
      'incubationPeriod': 'Incubation Period',
      'outcomes': 'Outcomes'
    };

    if (specialCases[propName]) {
      return specialCases[propName];
    }

    // Convert camelCase to Title Case
    return propName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Check if a property has a value (not empty)
   */
  hasPropertyValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  /**
   * Get URI values from a property (for displaying as widgets even if entity doesn't exist)
   */
  getUriValuesFromProperty(propertyValues: string[] | string): string[] {
    if (!propertyValues) return [];
    return Array.isArray(propertyValues) ? propertyValues : [propertyValues];
  }

  /**
   * Find entity by URI (returns null if not found)
   */
  findEntityByUri(uri: string): Entity | null {
    const allEntities = this.dataService.getAllEntities();
    return allEntities.find(e => e.uri === uri) || null;
  }

  /**
   * Find all entities that reference the current entity in their properties (inverse relationships)
   * Returns grouped by property name
   */
  getInverseRelationships(): { propertyName: string; entities: Entity[] }[] {
    if (!this.selected) return [];

    const allEntities = this.dataService.getAllEntitiesIncludingVirtual();
    const inverseMap = new Map<string, Entity[]>();

    // Scan all entities to find those that reference the current entity
    allEntities.forEach(entity => {
      if (!entity.properties || entity.uri === this.selected?.uri) return;

      // Check each property
      Object.entries(entity.properties).forEach(([propName, propValue]) => {
        if (!propValue) return;

        const values = Array.isArray(propValue) ? propValue : [propValue];

        // Check if any value references the current entity
        values.forEach((val: any) => {
          if (typeof val === 'string' && val === this.selected?.uri) {
            if (!inverseMap.has(propName)) {
              inverseMap.set(propName, []);
            }
            inverseMap.get(propName)!.push(entity);
          }
        });
      });
    });

    // Convert to array and sort by property name
    return Array.from(inverseMap.entries())
      .map(([propertyName, entities]) => ({ propertyName, entities }))
      .sort((a, b) => a.propertyName.localeCompare(b.propertyName));
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
    return this.dataService.getEntityByUri(uri);
  }

  trackByUri(index: number, item: Entity): string {
    return item.uri;
  }

  trackById(index: number, item: Article): number {
    return item.id;
  }
}
