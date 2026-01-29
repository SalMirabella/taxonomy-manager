import { Injectable } from '@angular/core';
import { EcmoDataLoaderService } from './ecmo-data-loader.service';
import {
  Entity,
  CategoryDef,
  TypeConfig,
  EntityType,
  CATEGORIES,
  TYPE_CONFIG,
  RELATION_KEYS,
  RELATION_LABELS,
  REVERSE_RELATION_LABELS,
  ECMO_DATA as MOCKUP_DATA,
  EIOS_ARTICLES,
  Article
} from '../query-builder/query-builder.data';

/**
 * Service that manages ECMO data.
 * Loads real data from JSON-LD files or falls back to mockup data.
 */
@Injectable({
  providedIn: 'root'
})
export class EcmoDataService {
  private _ecmoData: {
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
  } = MOCKUP_DATA;

  private _articles: Article[] = EIOS_ARTICLES;
  private _isRealDataLoaded = false;

  // Expose constant data
  readonly categories = CATEGORIES;
  readonly typeConfig = TYPE_CONFIG;
  readonly relationKeys = RELATION_KEYS;
  readonly relationLabels = RELATION_LABELS;
  readonly reverseRelationLabels = REVERSE_RELATION_LABELS;

  constructor(private dataLoader: EcmoDataLoaderService) {}

  /**
   * Initialize the service by loading real data
   */
  async initialize(): Promise<void> {
    try {
      console.log('Loading ECMO data from JSON-LD...');
      const data = await this.dataLoader.loadEcmoData('/assets/statements.jsonld');

      // Add virtual "All" entities to each category
      this.addVirtualAllEntities(data);

      this._ecmoData = data;
      this._isRealDataLoaded = true;

      console.log('✓ ECMO data loaded successfully:', {
        diseases: data.diseases.length,
        symptoms: data.symptoms.length,
        pathogens: data.pathogens.length,
        vectors: data.vectors.length,
        hosts: data.hosts.length,
        hazards: data.hazards.length,
        routesOfTransmission: data.routesOfTransmission.length,
        phsmTypes: data.phsmTypes.length,
        animalTypes: data.animalTypes.length,
        taxonomicRanks: data.taxonomicRanks.length,
        severityLevels: data.severityLevels.length,
        plantTypes: data.plantTypes.length,
        species: data.species.length,
        toxinTypes: data.toxinTypes.length,
        pestTypes: data.pestTypes.length,
        owlClasses: data.owlClasses.length,
        relations: Object.keys(data.relations).length
      });

      // Log categories vs instances
      const diseaseCategories = data.diseases.filter(d => d.isCategory);
      const diseaseInstances = data.diseases.filter(d => !d.isCategory);
      console.log('  → Disease categories:', diseaseCategories.length, diseaseCategories.map(d => d.label));
      console.log('  → Disease instances:', diseaseInstances.length);

      // Log sample relations
      const diseasesWithRelations = Object.keys(data.relations).length;
      console.log('  → Diseases with relations:', diseasesWithRelations);
      if (diseasesWithRelations > 0) {
        const sampleDisease = Object.keys(data.relations)[0];
        console.log('  → Sample relation:', sampleDisease, data.relations[sampleDisease]);
      }
    } catch (error) {
      console.error('Failed to load ECMO data from JSON-LD, using mockup data:', error);
      // Keep using mockup data (already initialized)
    }
  }

  /**
   * Add virtual "All [Type]" entities to each category
   */
  private addVirtualAllEntities(data: any): void {
    data.diseases.unshift({
      uri: 'virtual:AllDiseases',
      label: 'All Diseases',
      type: 'Disease' as EntityType,
      isCategory: true
    });

    data.symptoms.unshift({
      uri: 'virtual:AllSymptoms',
      label: 'All Symptoms',
      type: 'Symptom' as EntityType,
      isCategory: true
    });

    data.pathogens.unshift({
      uri: 'virtual:AllPathogens',
      label: 'All Pathogens',
      type: 'Pathogen' as EntityType,
      isCategory: true
    });

    data.vectors.unshift({
      uri: 'virtual:AllVectors',
      label: 'All Vectors',
      type: 'Vector' as EntityType,
      isCategory: true
    });

    data.hosts.unshift({
      uri: 'virtual:AllHosts',
      label: 'All Hosts',
      type: 'Host' as EntityType,
      isCategory: true
    });

    data.hazards.unshift({
      uri: 'virtual:AllHazards',
      label: 'All Hazards',
      type: 'Hazard' as EntityType,
      isCategory: true
    });

    data.routesOfTransmission.unshift({
      uri: 'virtual:AllRoutesOfTransmission',
      label: 'All Routes of Transmission',
      type: 'RouteOfTransmission' as EntityType,
      isCategory: true
    });

    data.phsmTypes.unshift({
      uri: 'virtual:AllPHSMTypes',
      label: 'All PHSM Types',
      type: 'PHSMType' as EntityType,
      isCategory: true
    });

    data.animalTypes.unshift({
      uri: 'virtual:AllAnimalTypes',
      label: 'All Animal Types',
      type: 'AnimalType' as EntityType,
      isCategory: true
    });

    data.taxonomicRanks.unshift({
      uri: 'virtual:AllTaxonomicRanks',
      label: 'All Taxonomic Ranks',
      type: 'TaxonomicRank' as EntityType,
      isCategory: true
    });

    data.severityLevels.unshift({
      uri: 'virtual:AllSeverityLevels',
      label: 'All Severity Levels',
      type: 'SeverityLevel' as EntityType,
      isCategory: true
    });

    data.plantTypes.unshift({
      uri: 'virtual:AllPlantTypes',
      label: 'All Plant Types',
      type: 'PlantType' as EntityType,
      isCategory: true
    });

    data.species.unshift({
      uri: 'virtual:AllSpecies',
      label: 'All Species',
      type: 'Species' as EntityType,
      isCategory: true
    });

    data.toxinTypes.unshift({
      uri: 'virtual:AllToxinTypes',
      label: 'All Toxin Types',
      type: 'ToxinType' as EntityType,
      isCategory: true
    });

    data.pestTypes.unshift({
      uri: 'virtual:AllPestTypes',
      label: 'All Pest Types',
      type: 'PestType' as EntityType,
      isCategory: true
    });
  }

  /**
   * Get the ECMO data
   */
  get ecmoData() {
    return this._ecmoData;
  }

  /**
   * Get the articles
   */
  get articles() {
    return this._articles;
  }

  /**
   * Check if real data was loaded successfully
   */
  get isRealDataLoaded(): boolean {
    return this._isRealDataLoaded;
  }

  /**
   * Get all entities (excluding virtual and categories)
   */
  getAllEntities(): Entity[] {
    return [
      ...this._ecmoData.diseases.filter(e => !e.isCategory),
      ...this._ecmoData.symptoms.filter(e => !e.isCategory),
      ...this._ecmoData.pathogens.filter(e => !e.isCategory),
      ...this._ecmoData.vectors.filter(e => !e.isCategory),
      ...this._ecmoData.hosts.filter(e => !e.isCategory),
      ...this._ecmoData.hazards.filter(e => !e.isCategory),
      ...this._ecmoData.routesOfTransmission.filter(e => !e.isCategory),
      ...this._ecmoData.phsmTypes.filter(e => !e.isCategory),
      ...this._ecmoData.animalTypes.filter(e => !e.isCategory),
      ...this._ecmoData.taxonomicRanks.filter(e => !e.isCategory),
      ...this._ecmoData.severityLevels.filter(e => !e.isCategory),
      ...this._ecmoData.plantTypes.filter(e => !e.isCategory),
      ...this._ecmoData.species.filter(e => !e.isCategory),
      ...this._ecmoData.toxinTypes.filter(e => !e.isCategory),
      ...this._ecmoData.pestTypes.filter(e => !e.isCategory),
    ];
  }

  /**
   * Get all entities including virtual and categories
   */
  getAllEntitiesIncludingVirtual(): Entity[] {
    return [
      ...this._ecmoData.diseases,
      ...this._ecmoData.symptoms,
      ...this._ecmoData.pathogens,
      ...this._ecmoData.vectors,
      ...this._ecmoData.hosts,
      ...this._ecmoData.hazards,
      ...this._ecmoData.routesOfTransmission,
      ...this._ecmoData.phsmTypes,
      ...this._ecmoData.animalTypes,
      ...this._ecmoData.taxonomicRanks,
      ...this._ecmoData.severityLevels,
      ...this._ecmoData.plantTypes,
      ...this._ecmoData.species,
      ...this._ecmoData.toxinTypes,
      ...this._ecmoData.pestTypes,
    ];
  }

  /**
   * Get entity by URI
   */
  getEntityByUri(uri: string): Entity | undefined {
    const all = this.getAllEntitiesIncludingVirtual();
    return all.find(e => e.uri === uri);
  }

  /**
   * Get all descendants of a category
   */
  getAllDescendants(categoryUri: string, dataKey: string): Entity[] {
    // Special handling for virtual "All" entities
    if (categoryUri.startsWith('virtual:All')) {
      const items: Entity[] = (this._ecmoData as any)[dataKey] || [];
      // Return ALL non-category entities in this data key
      return items.filter(i => !i.isCategory || !i.uri?.startsWith('virtual:'));
    }

    const items: Entity[] = (this._ecmoData as any)[dataKey] || [];
    const directChildren = items.filter(i => i.parent === categoryUri);
    let allDescendants: Entity[] = [];
    for (const child of directChildren) {
      if (child.isCategory) {
        allDescendants = [...allDescendants, ...this.getAllDescendants(child.uri, dataKey)];
      } else {
        allDescendants.push(child);
      }
    }
    return allDescendants;
  }
}
