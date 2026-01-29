import { Injectable } from '@angular/core';
import * as jsonld from 'jsonld';
import { Entity, EntityType } from '../query-builder/query-builder.data';

interface JsonLdNode {
  '@id': string;
  '@type'?: string[];
  [key: string]: any;
}

interface ParsedData {
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
  owlClasses: Entity[]; // OWL Class definitions
  relations: Record<string, Record<string, string[]>>;
}

interface OwlClassInfo {
  uri: string;
  label: string;
  description?: string;
  subClassOf: string[];
  types: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EcmoDataLoaderService {

  private readonly PH_PREFIX = 'http://ec.europa.eu/ecmo/public-health#';
  private readonly CORE_PREFIX = 'http://ec.europa.eu/ecmo/core#';
  private readonly BIO_PREFIX = 'http://ec.europa.eu/ecmo/biology#';
  private readonly RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
  private readonly RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';

  constructor() {}

  /**
   * Load and parse the JSON-LD file
   */
  async loadEcmoData(jsonLdUrl: string): Promise<ParsedData> {
    try {
      // Fetch the JSON-LD file
      const response = await fetch(jsonLdUrl);
      const jsonLdData = await response.json();

      // Expand the JSON-LD to make it easier to work with
      const expanded = await jsonld.expand(jsonLdData);

      // Parse the expanded data
      return this.parseExpandedData(expanded);
    } catch (error) {
      console.error('Error loading ECMO data:', error);
      throw error;
    }
  }

  /**
   * Parse expanded JSON-LD data into our application format
   */
  private parseExpandedData(expanded: any[]): ParsedData {
    console.log('\n🚀 AUTOMATIC OWL HIERARCHY CONSTRUCTION MODE');
    console.log('━'.repeat(80));

    // Use automatic hierarchy construction
    const autoData = this.autoConstructHierarchy(expanded);

    const diseases: Entity[] = autoData.diseases || [];
    const symptoms: Entity[] = autoData.symptoms || [];
    const pathogens: Entity[] = autoData.pathogens || [];
    const vectors: Entity[] = autoData.vectors || [];
    const hosts: Entity[] = autoData.hosts || [];
    const hazards: Entity[] = autoData.hazards || [];
    const routesOfTransmission: Entity[] = autoData.routesOfTransmission || [];
    const phsmTypes: Entity[] = autoData.phsmTypes || [];
    const animalTypes: Entity[] = autoData.animalTypes || [];
    const taxonomicRanks: Entity[] = autoData.taxonomicRanks || [];
    const severityLevels: Entity[] = autoData.severityLevels || [];
    const plantTypes: Entity[] = autoData.plantTypes || [];
    const species: Entity[] = autoData.species || [];
    const toxinTypes: Entity[] = autoData.toxinTypes || [];
    const pestTypes: Entity[] = autoData.pestTypes || [];
    const owlClasses: Entity[] = autoData.owlClasses || [];
    const relations: Record<string, Record<string, string[]>> = {};

    // Extract relations for disease entities
    console.log('\n📊 Extracting relations for disease entities...');
    for (const node of expanded) {
      const id = node['@id'];
      if (!id) continue;

      const types = node['@type'] || [];

      // Extract relations only for disease instances
      if (this.isDisease(types)) {
        const diseaseUri = this.convertToShortUri(id);
        const diseaseRelations = this.extractRelations(node);
        if (Object.keys(diseaseRelations).length > 0) {
          relations[diseaseUri] = diseaseRelations;
        }
      }
    }

    console.log(`  → Extracted relations for ${Object.keys(relations).length} diseases`);
    console.log('━'.repeat(80));

    // Second pass: mark entities that are referenced as parents
    this.markParentEntitiesAsCategories(diseases);
    this.markParentEntitiesAsCategories(symptoms);
    this.markParentEntitiesAsCategories(pathogens);
    this.markParentEntitiesAsCategories(vectors);
    this.markParentEntitiesAsCategories(hosts);
    this.markParentEntitiesAsCategories(hazards);
    this.markParentEntitiesAsCategories(routesOfTransmission);
    this.markParentEntitiesAsCategories(phsmTypes);
    this.markParentEntitiesAsCategories(animalTypes);
    this.markParentEntitiesAsCategories(taxonomicRanks);
    this.markParentEntitiesAsCategories(severityLevels);
    this.markParentEntitiesAsCategories(plantTypes);
    this.markParentEntitiesAsCategories(species);
    this.markParentEntitiesAsCategories(toxinTypes);
    this.markParentEntitiesAsCategories(pestTypes);

    // Create missing parent entities (e.g., type classes like PathogenicVirusType)
    this.createMissingParentEntities(diseases, 'Disease', expanded);
    this.createMissingParentEntities(symptoms, 'Symptom', expanded);
    this.createMissingParentEntities(pathogens, 'Pathogen', expanded);
    this.createMissingParentEntities(vectors, 'Vector', expanded);
    this.createMissingParentEntities(hosts, 'Host', expanded);
    this.createMissingParentEntities(hazards, 'Hazard', expanded);
    this.createMissingParentEntities(routesOfTransmission, 'RouteOfTransmission', expanded);
    this.createMissingParentEntities(phsmTypes, 'PHSMType', expanded);
    this.createMissingParentEntities(animalTypes, 'AnimalType', expanded);
    this.createMissingParentEntities(taxonomicRanks, 'TaxonomicRank', expanded);
    this.createMissingParentEntities(severityLevels, 'SeverityLevel', expanded);
    this.createMissingParentEntities(plantTypes, 'PlantType', expanded);
    this.createMissingParentEntities(species, 'Species', expanded);
    this.createMissingParentEntities(toxinTypes, 'ToxinType', expanded);
    this.createMissingParentEntities(pestTypes, 'PestType', expanded);

    // Third pass: create symptom entities from relations (symptoms don't exist as standalone entities in RDF)
    const extractedSymptoms = this.extractSymptomsFromRelations(relations, expanded);
    symptoms.push(...extractedSymptoms);

    console.log(`  → Extracted ${extractedSymptoms.length} symptoms from relations`);

    // Fourth pass: create placeholder entities for all referenced but missing entities
    const parsedData = {
      diseases,
      symptoms,
      pathogens,
      vectors,
      hosts,
      hazards,
      routesOfTransmission,
      phsmTypes,
      animalTypes,
      taxonomicRanks,
      severityLevels,
      plantTypes,
      species,
      toxinTypes,
      pestTypes,
      owlClasses,
      relations
    };

    this.createMissingReferencedEntities(parsedData, expanded);

    return parsedData;
  }

  /**
   * Extract symptom entities from disease relations
   * (Symptoms don't exist as standalone entities in the RDF, only as references)
   */
  private extractSymptomsFromRelations(relations: Record<string, Record<string, string[]>>, expanded: any[]): Entity[] {
    const symptomUris = new Set<string>();
    const symptomLabels = new Map<string, string>();

    // Collect all symptom URIs from relations
    Object.values(relations).forEach(rel => {
      (rel['symptoms'] || []).forEach(uri => {
        symptomUris.add(uri);
      });
    });

    // Try to find labels in the expanded data (they might be referenced but not defined)
    expanded.forEach(node => {
      const id = node['@id'];
      if (id && symptomUris.has(this.convertToShortUri(id))) {
        const label = this.extractLabel(node);
        if (label) {
          symptomLabels.set(this.convertToShortUri(id), label);
        }
      }
    });

    // Create symptom entities
    const symptoms: Entity[] = [];
    symptomUris.forEach(uri => {
      const label = symptomLabels.get(uri) || this.generateLabelFromUri(uri);
      symptoms.push({
        uri,
        label,
        type: 'Symptom',
        isCategory: false
      });
    });

    return symptoms;
  }

  /**
   * Identify and log all referenced entities that don't exist in the data
   */
  private createMissingReferencedEntities(parsedData: ParsedData, expanded: any[]): void {
    const existingUris = new Set<string>();
    const referencedUris = new Map<string, { label: string; referencedBy: string[] }>();

    // Collect all existing entity URIs
    const allEntities = [
      ...parsedData.diseases,
      ...parsedData.symptoms,
      ...parsedData.pathogens,
      ...parsedData.vectors,
      ...parsedData.hosts,
      ...parsedData.hazards,
      ...parsedData.routesOfTransmission,
      ...parsedData.phsmTypes,
      ...parsedData.animalTypes,
      ...parsedData.taxonomicRanks,
      ...parsedData.severityLevels,
      ...parsedData.plantTypes,
      ...parsedData.species,
      ...parsedData.toxinTypes,
      ...parsedData.pestTypes
    ];

    allEntities.forEach(e => existingUris.add(e.uri));

    // Collect all referenced URIs from properties
    allEntities.forEach(entity => {
      if (!entity.properties) return;

      Object.entries(entity.properties).forEach(([_, propValue]) => {
        if (!propValue) return;

        const values = Array.isArray(propValue) ? propValue : [propValue];
        values.forEach((val: any) => {
          if (typeof val !== 'string') return;
          // Check if it's a URI reference (starts with ph:, bio:, core:)
          if (val.startsWith('ph:') || val.startsWith('bio:') || val.startsWith('core:')) {
            if (!existingUris.has(val)) {
              // Try to find label in expanded data
              const fullUri = this.convertToFullUri(val);
              const node = expanded.find((n: any) => n['@id'] === fullUri);
              const label = node ? this.extractLabel(node) : null;

              if (!referencedUris.has(val)) {
                referencedUris.set(val, {
                  label: label || this.generateLabelFromUri(val),
                  referencedBy: []
                });
              }
              referencedUris.get(val)!.referencedBy.push(`${entity.label} (${entity.type})`);
            }
          }
        });
      });
    });

    // Also check relations
    Object.entries(parsedData.relations).forEach(([entityUri, relations]) => {
      Object.entries(relations).forEach(([_, uris]) => {
        uris.forEach(uri => {
          if (!existingUris.has(uri)) {
            const fullUri = this.convertToFullUri(uri);
            const node = expanded.find((n: any) => n['@id'] === fullUri);
            const label = node ? this.extractLabel(node) : null;

            if (!referencedUris.has(uri)) {
              referencedUris.set(uri, {
                label: label || this.generateLabelFromUri(uri),
                referencedBy: []
              });
            }
            const refByEntity = allEntities.find(e => e.uri === entityUri);
            if (refByEntity) {
              referencedUris.get(uri)!.referencedBy.push(`${refByEntity.label} (${refByEntity.type})`);
            }
          }
        });
      });
    });

    // Log missing referenced entities
    if (referencedUris.size > 0) {
      console.warn('⚠️  MISSING REFERENCED ENTITIES:');
      console.warn('These entities are referenced but not defined in the data file:');
      console.warn('═'.repeat(80));

      const byPrefix = new Map<string, Array<{ uri: string; info: { label: string; referencedBy: string[] } }>>();

      referencedUris.forEach((info, uri) => {
        const prefix = uri.split(':')[0];
        if (!byPrefix.has(prefix)) {
          byPrefix.set(prefix, []);
        }
        byPrefix.get(prefix)!.push({ uri, info });
      });

      byPrefix.forEach((entities, prefix) => {
        console.warn(`\n${prefix.toUpperCase()} Namespace (${entities.length} missing):`);
        entities.forEach(({ uri, info }) => {
          console.warn(`  ❌ ${uri} → "${info.label}"`);
          console.warn(`     Referenced by: ${info.referencedBy.slice(0, 3).join(', ')}${info.referencedBy.length > 3 ? ` +${info.referencedBy.length - 3} more` : ''}`);
        });
      });

      console.warn('\n' + '═'.repeat(80));
      console.warn(`Total missing entities: ${referencedUris.size}`);
    } else {
      console.log('✅ No missing referenced entities - all references are valid!');
    }
  }

  /**
   * Generate a readable label from URI (fallback)
   */
  private generateLabelFromUri(uri: string): string {
    let lastPart: string;

    // Check if it's a short-form URI (ph:, bio:, core:)
    if (uri.includes(':') && !uri.startsWith('http://') && !uri.startsWith('https://')) {
      // Short form like "ph:Fever" - extract after the colon
      const colonIndex = uri.indexOf(':');
      lastPart = uri.substring(colonIndex + 1);
    } else {
      // Full URI - extract the last part after # or /
      const parts = uri.split(/[#/]/);
      lastPart = parts[parts.length - 1];
    }

    // Convert CamelCase to Title Case
    return lastPart.replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Mark entities that are referenced as parents as categories
   */
  private markParentEntitiesAsCategories(entities: Entity[]): void {
    const parentUris = new Set<string>();

    // Collect all parent URIs
    entities.forEach(e => {
      if (e.parent) {
        parentUris.add(e.parent);
      }
    });

    // Mark entities that are parents as categories
    entities.forEach(e => {
      if (parentUris.has(e.uri) && !e.isCategory) {
        e.isCategory = true;
      }
    });
  }

  /**
   * Create missing parent entities (e.g., type classes that are referenced as parents but don't exist as individuals)
   */
  private createMissingParentEntities(entities: Entity[], type: EntityType, expanded: any[]): void {
    const parentUris = new Set<string>();
    const existingUris = new Set<string>();

    // Collect all parent URIs and existing entity URIs
    entities.forEach(e => {
      existingUris.add(e.uri);
      if (e.parent) {
        parentUris.add(e.parent);
      }
    });

    // Find parent URIs that don't exist as entities
    const missingParents = Array.from(parentUris).filter(uri => !existingUris.has(uri));

    // Create entities for missing parents
    missingParents.forEach(parentUri => {
      // Convert short URI back to full URI to find in expanded data
      const fullUri = this.convertToFullUri(parentUri);

      // Try to find the class definition in expanded data
      const classNode = expanded.find((n: any) => n['@id'] === fullUri);

      let label = parentUri; // Default to URI if no label found
      let description: string | undefined;

      if (classNode) {
        // Extract label from class definition
        const extractedLabel = this.extractLabel(classNode);
        if (extractedLabel) {
          label = extractedLabel;
        }

        // Extract description if available
        description = this.extractDescription(classNode);
      } else {
        // Generate a human-readable label from the URI
        label = this.generateLabelFromUri(parentUri);
      }

      // Create the parent entity
      entities.push({
        uri: parentUri,
        label,
        type,
        isCategory: true,
        parent: undefined,
        description,
        properties: {}
      });
    });
  }

  /**
   * Create an Entity from JSON-LD node
   */
  private createEntity(id: string, label: string, type: EntityType, node: any): Entity {
    // Convert full URI to short form (e.g., http://...#Ebola -> ph:Ebola)
    const uri = this.convertToShortUri(id);

    // Extract parent relationship
    const parent = this.extractParent(node);

    // Check if it's a category (usually classes, not individuals)
    const isCategory = this.isCategory(node);

    // Extract description
    const description = this.extractDescription(node);

    // Extract additional properties (passing entity type for type-specific extraction)
    const properties = this.extractProperties(node, type);

    return {
      uri,
      label,
      type,
      isCategory,
      parent: parent ? this.convertToShortUri(parent) : undefined,
      altLabels: this.extractAltLabels(node),
      description,
      properties
    };
  }

  /**
   * Extract relations from a disease node
   */
  private extractRelations(node: any): Record<string, string[]> {
    const relations: Record<string, string[]> = {};

    // Extract symptoms
    const symptoms = this.extractPropertyValues(node, `${this.PH_PREFIX}hasSignOrSymptom`);
    if (symptoms.length > 0) {
      relations['symptoms'] = symptoms.map(s => this.convertToShortUri(s));
    }

    // Extract pathogens (causative agents)
    const pathogens = this.extractPropertyValues(node, `${this.PH_PREFIX}hasCausativeAgent`);
    if (pathogens.length > 0) {
      relations['pathogens'] = pathogens.map(p => this.convertToShortUri(p));
    }

    // Extract hosts
    const hosts = this.extractPropertyValues(node, `${this.PH_PREFIX}hasSusceptibleHost`);
    if (hosts.length > 0) {
      relations['hosts'] = hosts.map(h => this.convertToShortUri(h));
    }

    // Extract vectors (transmission routes that are organisms)
    const vectors = this.extractPropertyValues(node, `${this.PH_PREFIX}hasVector`);
    if (vectors.length > 0) {
      relations['vectors'] = vectors.map(v => this.convertToShortUri(v));
    }

    // Note: Hazard relations are not directly encoded in the ECMO ontology
    // They would need to be inferred or added separately
    // For now, we don't extract hazard relations from the RDF

    return relations;
  }

  /**
   * Extract label from node
   */
  private extractLabel(node: any): string | null {
    const labels = node[this.RDFS_LABEL];
    if (!labels || labels.length === 0) return null;

    // Prefer English label
    const enLabel = labels.find((l: any) => l['@language'] === 'en');
    if (enLabel) return enLabel['@value'];

    // Fallback to first label
    return labels[0]['@value'] || null;
  }

  /**
   * Extract alternative labels
   */
  private extractAltLabels(node: any): string[] | undefined {
    // JSON-LD might have skos:altLabel or similar
    const altLabelProps = [
      'http://www.w3.org/2004/02/skos/core#altLabel',
      `${this.PH_PREFIX}alternativeLabel`
    ];

    for (const prop of altLabelProps) {
      const altLabels = node[prop];
      if (altLabels && altLabels.length > 0) {
        return altLabels.map((l: any) => l['@value']).filter(Boolean);
      }
    }
    return undefined;
  }

  /**
   * Extract description from rdfs:comment
   */
  private extractDescription(node: any): string | undefined {
    const comments = node[this.RDFS_COMMENT];
    if (!comments || comments.length === 0) return undefined;

    // Prefer English comment
    const enComment = comments.find((c: any) => c['@language'] === 'en');
    if (enComment) return enComment['@value'];

    // Fallback to first comment
    return comments[0]['@value'] || undefined;
  }

  /**
   * Extract additional properties specific to each entity type
   */
  private extractProperties(node: any, entityType: EntityType): Record<string, any> | undefined {
    const properties: Record<string, any> = {};

    // Common properties for all biological entities (Pathogen, Vector, Host, AnimalType, PlantType, Species)
    const BIO_PREFIX = 'http://ec.europa.eu/ecmo/biology#';

    // Extract taxonomic rank (for biological entities)
    if (entityType === 'Pathogen' || entityType === 'Vector' || entityType === 'Host' ||
        entityType === 'AnimalType' || entityType === 'PlantType' || entityType === 'Species') {
      const rank = this.extractPropertyValues(node, `${BIO_PREFIX}hasRank`);
      if (rank.length > 0) {
        properties['taxonomicRank'] = rank.map(r => this.convertToShortUri(r));
      }

      const belongsTo = this.extractPropertyValues(node, `${BIO_PREFIX}belongsTo`);
      if (belongsTo.length > 0) {
        properties['belongsTo'] = belongsTo.map(b => this.convertToShortUri(b));
      }

      const includes = this.extractPropertyValues(node, `${BIO_PREFIX}includes`);
      if (includes.length > 0) {
        properties['includes'] = includes.map(i => this.convertToShortUri(i));
      }
    }

    // Disease-specific properties
    if (entityType === 'Disease') {
      // Route of transmission
      const routes = this.extractPropertyValues(node, `${this.PH_PREFIX}hasRouteOfTransmission`);
      if (routes.length > 0) {
        properties['routesOfTransmission'] = routes.map(r => this.convertToShortUri(r));
      }

      // Disease outcomes
      const outcomes = this.extractPropertyValues(node, `${this.PH_PREFIX}hasOutcome`);
      if (outcomes.length > 0) {
        properties['outcomes'] = outcomes.map(o => this.convertToShortUri(o));
      }

      // Incubation period
      const incubation = node[`${this.PH_PREFIX}hasIncubationPeriod`];
      if (incubation && incubation.length > 0) {
        properties['incubationPeriod'] = incubation[0]['@value'];
      }
    }

    // Pathogen-specific properties
    if (entityType === 'Pathogen') {
      // Toxins produced
      const toxins = this.extractPropertyValues(node, `${this.PH_PREFIX}producesToxin`);
      if (toxins.length > 0) {
        properties['producesToxin'] = toxins.map(t => this.convertToShortUri(t));
      }

      // Diseases this pathogen causes (inverse relation)
      const causedDiseases = this.extractPropertyValues(node, `${this.PH_PREFIX}isCausativeAgentOf`);
      if (causedDiseases.length > 0) {
        properties['causedDiseases'] = causedDiseases.map(d => this.convertToShortUri(d));
      }
    }

    // Vector-specific properties
    if (entityType === 'Vector') {
      // Diseases this vector transmits
      const vectorOf = this.extractPropertyValues(node, `${this.PH_PREFIX}isVectorOf`);
      if (vectorOf.length > 0) {
        properties['vectorOfDiseases'] = vectorOf.map(v => this.convertToShortUri(v));
      }
    }

    // Host-specific properties
    if (entityType === 'Host') {
      // Diseases this host is susceptible to
      const susceptibleTo = this.extractPropertyValues(node, `${this.PH_PREFIX}isSusceptibleHostOf`);
      if (susceptibleTo.length > 0) {
        properties['susceptibleToDiseases'] = susceptibleTo.map(d => this.convertToShortUri(d));
      }

      // Population composition
      const composedOf = this.extractPropertyValues(node, `${this.PH_PREFIX}composedOfOrganisms`);
      if (composedOf.length > 0) {
        properties['composedOfOrganisms'] = composedOf.map(o => this.convertToShortUri(o));
      }
    }

    // Symptom-specific properties
    if (entityType === 'Symptom') {
      // Diseases this symptom is present in
      const symptomOf = this.extractPropertyValues(node, `${this.PH_PREFIX}isSignOrSymptomOf`);
      if (symptomOf.length > 0) {
        properties['presentInDiseases'] = symptomOf.map(d => this.convertToShortUri(d));
      }
    }

    // Hazard-specific properties
    if (entityType === 'Hazard') {
      // Events involving this hazard
      const manifestedIn = this.extractPropertyValues(node, `http://ec.europa.eu/ecmo/core#isManifestationIn`);
      if (manifestedIn.length > 0) {
        properties['manifestedInEvents'] = manifestedIn.map(e => this.convertToShortUri(e));
      }
    }

    return Object.keys(properties).length > 0 ? properties : undefined;
  }

  /**
   * Extract parent relationship
   */
  private extractParent(node: any): string | null {
    // Look for specialization relationship
    const specialization = node[`${this.PH_PREFIX}isSpecializationOfCondition`];
    if (specialization && specialization.length > 0) {
      return specialization[0]['@id'];
    }

    // Look for subclass relationship
    const subClassOf = node['http://www.w3.org/2000/01/rdf-schema#subClassOf'];
    if (subClassOf && subClassOf.length > 0) {
      const parentId = subClassOf[0]['@id'];
      // Only use as parent if it's in our namespace
      if (parentId.startsWith(this.PH_PREFIX) || parentId.startsWith(this.BIO_PREFIX) || parentId.startsWith(this.CORE_PREFIX)) {
        // Don't use "Hazard" as a parent - it's the base class, not a meaningful hierarchy level
        // Hazard categories like "Hydrometeorological Hazard" should appear as top-level items
        if (parentId === `${this.CORE_PREFIX}Hazard`) {
          // Skip this parent, continue to check other options
        } else {
          return parentId;
        }
      }
    }

    // General handling for all entity types: check if @type includes a specific type category
    // This creates internal subgroup hierarchies within categories
    // For example:
    // - PathogenicVirusType creates a "Virus" subgroup within Pathogen
    // - HydroMeteorologicalHazard creates a "Hydrometeorological Hazard" subgroup within Hazard
    const types = node['@type'] || [];
    const typeArray = Array.isArray(types) ? types : [types];

    // Define base types that represent the top-level categories (should NOT be used as parents)
    const baseTypesToSkip = [
      // These are the main category types - they define the category itself, not a subgroup
      `${this.CORE_PREFIX}Hazard`,
      `${this.CORE_PREFIX}PathogenType`,
      `${this.PH_PREFIX}Disease`,
      `${this.PH_PREFIX}InfectiousDisease`,
      `${this.PH_PREFIX}DiseaseHostType`,
      `${this.PH_PREFIX}DiseaseVectorType`,
      `${this.BIO_PREFIX}AnimalType`,
      `${this.BIO_PREFIX}TaxonomicRank`,
      `${this.PH_PREFIX}RouteOfTransmission`,
      `${this.PH_PREFIX}PHSMType`,
      `${this.CORE_PREFIX}SeverityLevelValue`,
      `${this.CORE_PREFIX}SeverityLevelScale`,
      `${this.BIO_PREFIX}PlantType`,
      `${this.BIO_PREFIX}Species`,
      `${this.PH_PREFIX}ToxinType`,
      `${this.PH_PREFIX}PestType`
    ];

    for (const type of typeArray) {
      // Skip OWL infrastructure types
      if (type.includes('owl#')) continue;

      // Only consider types in our namespaces
      if (!type.startsWith(this.PH_PREFIX) && !type.startsWith(this.CORE_PREFIX) && !type.startsWith(this.BIO_PREFIX)) {
        continue;
      }

      // Skip base category types
      if (baseTypesToSkip.includes(type)) {
        continue;
      }

      // ANY other type in our namespace becomes a parent (creates a subgroup)
      // This automatically reflects the ontological hierarchy from the data file
      return type;
    }

    return null;
  }

  /**
   * Extract values from a property
   */
  private extractPropertyValues(node: any, property: string): string[] {
    const values = node[property];
    if (!values || values.length === 0) return [];

    return values
      .map((v: any) => v['@id'])
      .filter(Boolean);
  }

  /**
   * Check if node is a category (class definition or parent entity)
   */
  private isCategory(node: any): boolean {
    const types = node['@type'] || [];

    // Check if it's an OWL Class
    if (types.includes('http://www.w3.org/2002/07/owl#Class')) {
      return true;
    }

    // Check if it has isGeneralizationOfCondition (is parent of other entities)
    const isGeneralization = node[`${this.PH_PREFIX}isGeneralizationOfCondition`];
    if (isGeneralization && isGeneralization.length > 0) {
      return true;
    }

    // Check if it has isGeneralisationOFHazard (is parent of other hazards)
    const isHazardGeneralization = node[`${this.CORE_PREFIX}isGeneralisationOFHazard`];
    if (isHazardGeneralization && isHazardGeneralization.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Convert full URI to short form
   */
  private convertToShortUri(uri: string): string {
    if (uri.startsWith(this.PH_PREFIX)) {
      return 'ph:' + uri.substring(this.PH_PREFIX.length);
    }
    if (uri.startsWith(this.CORE_PREFIX)) {
      return 'core:' + uri.substring(this.CORE_PREFIX.length);
    }
    if (uri.startsWith(this.BIO_PREFIX)) {
      return 'bio:' + uri.substring(this.BIO_PREFIX.length);
    }
    return uri;
  }

  /**
   * Convert short URI to full URI
   */
  private convertToFullUri(shortUri: string): string {
    if (shortUri.startsWith('ph:')) {
      return this.PH_PREFIX + shortUri.substring(3);
    }
    if (shortUri.startsWith('core:')) {
      return this.CORE_PREFIX + shortUri.substring(5);
    }
    if (shortUri.startsWith('bio:')) {
      return this.BIO_PREFIX + shortUri.substring(4);
    }
    return shortUri;
  }

  /**
   * Type checking methods
   */
  private isDisease(types: string[]): boolean {
    return types.some(t => {
      // Exact matches for disease types
      if (t === `${this.PH_PREFIX}InfectiousDisease` || t === `${this.PH_PREFIX}Disease`) {
        return true;
      }

      // Check if contains 'Disease' but exclude DiseaseHostType and DiseaseVectorType
      // which are Host and Vector types, not Disease types
      if (t.includes('Disease') && !t.includes('DiseaseHost') && !t.includes('DiseaseVector')) {
        return true;
      }

      return false;
    });
  }

  private isSymptom(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}SignOrSymptom` ||
      t.includes('Symptom') ||
      t.includes('Sign')
    );
  }

  private isPathogen(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}PathogenicVirusType` ||
      t === `${this.PH_PREFIX}PathogenicBacteriumType` ||
      t === `${this.PH_PREFIX}PathogenicParasiteType` ||
      t === `${this.BIO_PREFIX}Virus` ||
      t === `${this.BIO_PREFIX}Bacterium` ||
      t === `${this.BIO_PREFIX}Parasite` ||
      t.includes('Pathogen') ||
      t.includes('Virus') ||
      t.includes('Bacter')
    );
  }

  private isVector(types: string[]): boolean {
    return types.some(t =>
      t === `${this.BIO_PREFIX}Vector` ||
      t === `${this.PH_PREFIX}DiseaseVectorType` ||
      t.includes('Vector')
    );
  }

  private isHost(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}DiseaseHostType` ||
      t === `${this.BIO_PREFIX}Organism` ||
      t === `${this.BIO_PREFIX}AnimalType` || // Added: biology#AnimalType
      t.includes('Host') ||
      t.includes('AnimalType')
    );
  }

  private isHazard(types: string[]): boolean {
    return types.some(t =>
      t === `${this.CORE_PREFIX}Hazard` ||
      t.includes('Hazard')
    );
  }

  private isRouteOfTransmission(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}RouteOfTransmission`
    );
  }

  private isPHSMType(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}PHSMType`
    );
  }

  private isAnimalType(types: string[]): boolean {
    return types.some(t =>
      t === `${this.BIO_PREFIX}AnimalType`
    );
  }

  private isTaxonomicRank(types: string[]): boolean {
    return types.some(t =>
      t === `${this.BIO_PREFIX}TaxonomicRank`
    );
  }

  private isSeverityLevel(types: string[]): boolean {
    return types.some(t =>
      t === `${this.CORE_PREFIX}SeverityLevelValue` ||
      t === `${this.CORE_PREFIX}SeverityLevelScale`
    );
  }

  private isPlantType(types: string[]): boolean {
    return types.some(t =>
      t === `${this.BIO_PREFIX}PlantType`
    );
  }

  private isSpecies(types: string[]): boolean {
    return types.some(t =>
      t === `${this.BIO_PREFIX}Species`
    );
  }

  private isToxinType(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}ToxinType`
    );
  }

  private isPestType(types: string[]): boolean {
    return types.some(t =>
      t === `${this.PH_PREFIX}PestType`
    );
  }

  private isOwlClass(types: string[]): boolean {
    return types.includes('http://www.w3.org/2002/07/owl#Class');
  }

  /**
   * AUTOMATIC OWL HIERARCHY CONSTRUCTION
   * This section implements automatic hierarchy construction that reflects the exact file structure
   */

  /**
   * Extract ALL OWL classes from the expanded JSON-LD data
   * No manual filtering - extract everything marked as owl:Class
   */
  private extractAllOwlClasses(expanded: any[]): Map<string, OwlClassInfo> {
    const classMap = new Map<string, OwlClassInfo>();

    for (const node of expanded) {
      const id = node['@id'];
      if (!id) continue;

      const types = node['@type'] || [];

      // Check if it's an OWL Class
      if (!this.isOwlClass(types)) continue;

      // Extract label
      const label = this.extractLabel(node);
      if (!label) continue; // Skip classes without labels

      // Extract description
      const description = this.extractDescription(node);

      // Extract subClassOf relationships
      const subClassOf: string[] = [];
      const subClassOfProp = node['http://www.w3.org/2000/01/rdf-schema#subClassOf'];
      if (subClassOfProp && Array.isArray(subClassOfProp)) {
        subClassOfProp.forEach((parent: any) => {
          if (parent['@id']) {
            subClassOf.push(parent['@id']);
          }
        });
      }

      classMap.set(id, {
        uri: id,
        label,
        description,
        subClassOf,
        types
      });
    }

    console.log(`  → Extracted ${classMap.size} OWL classes from file`);
    return classMap;
  }

  /**
   * Build class hierarchy tree (parent -> children mapping)
   */
  private buildClassHierarchyTree(classMap: Map<string, OwlClassInfo>): Map<string, string[]> {
    const hierarchyTree = new Map<string, string[]>();

    // For each class, register it as a child of its parents
    classMap.forEach((classInfo, classUri) => {
      classInfo.subClassOf.forEach(parentUri => {
        // Only register if parent is also in our class map (i.e., it's a relevant class)
        if (classMap.has(parentUri)) {
          if (!hierarchyTree.has(parentUri)) {
            hierarchyTree.set(parentUri, []);
          }
          hierarchyTree.get(parentUri)!.push(classUri);
        }
      });
    });

    return hierarchyTree;
  }

  /**
   * Identify ALL root classes automatically
   * Root classes are those without parents OR with only generic/irrelevant parents
   * This must reflect the exact file structure - NO manual decisions
   */
  private identifyRootClasses(classMap: Map<string, OwlClassInfo>): string[] {
    const genericParents = [
      'http://www.w3.org/2002/07/owl#Thing',
      'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#SocialObject',
      'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Object',
      'http://www.w3.org/2000/01/rdf-schema#Resource'
    ];

    const rootClasses: string[] = [];

    classMap.forEach((classInfo, classUri) => {
      // Check if this class has any relevant parents
      const relevantParents = classInfo.subClassOf.filter(parentUri => {
        // Exclude generic OWL/RDFS parents
        if (genericParents.includes(parentUri)) {
          return false;
        }
        // Include only if parent exists in our class map
        return classMap.has(parentUri);
      });

      // If no relevant parents, it's a root class
      if (relevantParents.length === 0) {
        rootClasses.push(classUri);
      }
    });

    console.log(`  → Identified ${rootClasses.length} root classes:`);
    rootClasses.forEach(uri => {
      const classInfo = classMap.get(uri)!;
      console.log(`    • ${classInfo.label} (${uri})`);
    });

    return rootClasses;
  }

  /**
   * Build flat hierarchy for a class tree (recursively)
   * Outputs flat arrays with parent references (compatible with existing UI)
   * Structure: Base Class → Instances → Subclass → Instances → Sub-subclass → Instances (recursive)
   */
  private buildFlatHierarchy(
    classUri: string,
    classMap: Map<string, OwlClassInfo>,
    hierarchyTree: Map<string, string[]>,
    allInstances: Map<string, Entity[]>,
    entityType: EntityType,
    parentUri?: string
  ): Entity[] {
    const results: Entity[] = [];
    const classInfo = classMap.get(classUri)!;

    // Create the OWL Class entity
    const classEntity: Entity = {
      uri: this.convertToShortUri(classUri),
      label: classInfo.label,
      type: entityType,
      isOwlClass: true,
      isCategory: true,
      description: classInfo.description,
      subClassOf: classInfo.subClassOf.length > 0 ? classInfo.subClassOf : undefined,
      parent: parentUri ? this.convertToShortUri(parentUri) : undefined
    };

    results.push(classEntity);

    // Get direct instances of this class - set their parent to this class
    const instances = allInstances.get(classUri) || [];
    instances.forEach(instance => {
      instance.type = entityType; // Set correct entity type
      instance.parent = this.convertToShortUri(classUri); // Set parent to this OWL class
      results.push(instance);
    });

    // Get direct subclasses and recursively process them
    const subclasses = hierarchyTree.get(classUri) || [];
    subclasses.forEach(subclassUri => {
      const subclassEntities = this.buildFlatHierarchy(
        subclassUri,
        classMap,
        hierarchyTree,
        allInstances,
        entityType,
        classUri // Pass current class as parent
      );
      results.push(...subclassEntities);
    });

    return results;
  }

  /**
   * Get all instances (NamedIndividuals) for each class
   * Returns a map of classUri -> instances[]
   */
  private getAllInstancesByClass(expanded: any[]): Map<string, Entity[]> {
    const instancesByClass = new Map<string, Entity[]>();

    for (const node of expanded) {
      const id = node['@id'];
      if (!id) continue;

      const types = node['@type'] || [];

      // Skip OWL Classes themselves
      if (this.isOwlClass(types)) continue;

      // Extract label
      const label = this.extractLabel(node);
      if (!label) continue;

      // This is an instance - find its type classes
      types.forEach((typeUri: string) => {
        // Only consider types in our namespaces
        if (!typeUri.startsWith(this.PH_PREFIX) &&
            !typeUri.startsWith(this.CORE_PREFIX) &&
            !typeUri.startsWith(this.BIO_PREFIX)) {
          return;
        }

        // Extract parent if any
        const parent = this.extractParent(node);
        const description = this.extractDescription(node);
        const properties = this.extractProperties(node, 'Disease'); // Will be updated later with correct type

        // Create instance entity
        const instance: Entity = {
          uri: this.convertToShortUri(id),
          label,
          type: 'Disease', // Will be set properly later
          isCategory: false,
          parent: parent ? this.convertToShortUri(parent) : undefined,
          description,
          properties
        };

        // Add to the map
        if (!instancesByClass.has(typeUri)) {
          instancesByClass.set(typeUri, []);
        }
        instancesByClass.get(typeUri)!.push(instance);
      });
    }

    return instancesByClass;
  }

  /**
   * Automatically construct hierarchy from OWL classes
   * This is the main orchestrator that uses all the helper methods
   */
  private autoConstructHierarchy(expanded: any[]): Partial<ParsedData> {
    console.log('🤖 Starting automatic OWL hierarchy construction...');

    // Step 1: Extract ALL OWL classes
    const classMap = this.extractAllOwlClasses(expanded);

    // Step 2: Build hierarchy tree (parent -> children relationships)
    const hierarchyTree = this.buildClassHierarchyTree(classMap);

    // Step 3: Identify root classes automatically
    const rootClasses = this.identifyRootClasses(classMap);

    // Step 4: Get all instances by class
    const instancesByClass = this.getAllInstancesByClass(expanded);

    // Step 5: For each root class, determine EntityType and build flat hierarchy
    const result: Partial<ParsedData> = {
      diseases: [],
      symptoms: [],
      pathogens: [],
      vectors: [],
      hosts: [],
      hazards: [],
      routesOfTransmission: [],
      phsmTypes: [],
      animalTypes: [],
      taxonomicRanks: [],
      severityLevels: [],
      plantTypes: [],
      species: [],
      toxinTypes: [],
      pestTypes: [],
      owlClasses: []
    };

    rootClasses.forEach(rootUri => {
      const classInfo = classMap.get(rootUri)!;

      // Try to determine EntityType using hierarchy-based inference
      let entityType = this.inferEntityTypeFromHierarchy(rootUri, classMap);

      if (entityType) {
        console.log(`  → Processing root class: ${classInfo.label} → ${entityType}`);

        // Build flat hierarchy for this root class
        const entities = this.buildFlatHierarchy(
          rootUri,
          classMap,
          hierarchyTree,
          instancesByClass,
          entityType
        );

        // Add to the appropriate array based on entity type
        const key = this.getDataKeyForEntityType(entityType);
        if (key && result[key]) {
          (result[key] as Entity[]).push(...entities);
        }

        // Also add root class to owlClasses array
        const rootClassEntity = entities.find(e => e.uri === this.convertToShortUri(rootUri));
        if (rootClassEntity) {
          result.owlClasses!.push(rootClassEntity);
        }
      } else {
        // No EntityType mapping found - add to owlClasses only
        console.log(`  ⚠️  No mapping found for root class: ${classInfo.label} - adding to OWL classes only`);

        const unmappedClass: Entity = {
          uri: this.convertToShortUri(rootUri),
          label: classInfo.label,
          type: 'Hazard', // Use Hazard as fallback type for unmapped classes
          isOwlClass: true,
          isCategory: true,
          description: classInfo.description,
          subClassOf: classInfo.subClassOf.length > 0 ? classInfo.subClassOf : undefined
        };

        result.owlClasses!.push(unmappedClass);
      }
    });

    console.log('✅ Automatic hierarchy construction complete');
    return result;
  }

  /**
   * Map EntityType to ParsedData key
   */
  private getDataKeyForEntityType(entityType: EntityType): keyof ParsedData | null {
    const mapping: Record<EntityType, keyof ParsedData> = {
      'Disease': 'diseases',
      'Symptom': 'symptoms',
      'Pathogen': 'pathogens',
      'Vector': 'vectors',
      'Host': 'hosts',
      'Hazard': 'hazards',
      'RouteOfTransmission': 'routesOfTransmission',
      'PHSMType': 'phsmTypes',
      'AnimalType': 'animalTypes',
      'TaxonomicRank': 'taxonomicRanks',
      'SeverityLevel': 'severityLevels',
      'PlantType': 'plantTypes',
      'Species': 'species',
      'ToxinType': 'toxinTypes',
      'PestType': 'pestTypes'
    };
    return mapping[entityType] || null;
  }

  /**
   * Create an OWL Class entity
   */
  private createOwlClassEntity(uri: string, label: string, node: any): Entity | null {
    // Determine which EntityType this class represents
    const entityType = this.getEntityTypeForOwlClass(uri);
    if (!entityType) {
      return null; // Skip classes that don't map to our entity types
    }

    // Extract subClassOf relationships
    const subClassOf: string[] = [];
    const subClassOfProp = node['http://www.w3.org/2000/01/rdf-schema#subClassOf'];
    if (subClassOfProp && Array.isArray(subClassOfProp)) {
      subClassOfProp.forEach((parent: any) => {
        if (parent['@id']) {
          subClassOf.push(parent['@id']);
        }
      });
    }

    // Extract description from rdfs:comment
    const description = this.extractDescription(node);

    return {
      uri,
      label,
      type: entityType,
      isOwlClass: true,
      description,
      subClassOf: subClassOf.length > 0 ? subClassOf : undefined
    };
  }

  /**
   * Map OWL Class URI to EntityType using ONLY exact mappings
   * Returns null for unmapped classes - they will be processed based on subClassOf structure
   */
  private getEntityTypeForOwlClass(uri: string): EntityType | null {
    // ONLY exact URI matches - no pattern matching, no guessing
    const exactMappings: Record<string, EntityType> = {
      [`${this.PH_PREFIX}Disease`]: 'Disease',
      [`${this.PH_PREFIX}SignOrSymptom`]: 'Symptom',
      [`${this.PH_PREFIX}SignOrSyptom`]: 'Symptom',
      [`${this.CORE_PREFIX}PathogenType`]: 'Pathogen',
      [`${this.PH_PREFIX}DiseaseVectorType`]: 'Vector',
      [`${this.PH_PREFIX}DiseaseHostType`]: 'Host',
      [`${this.CORE_PREFIX}Hazard`]: 'Hazard',
      [`${this.PH_PREFIX}RouteOfTransmission`]: 'RouteOfTransmission',
      [`${this.PH_PREFIX}PHSMType`]: 'PHSMType',
      [`${this.BIO_PREFIX}AnimalType`]: 'AnimalType',
      [`${this.BIO_PREFIX}TaxonomicRank`]: 'TaxonomicRank',
      [`${this.CORE_PREFIX}SeverityLevelValue`]: 'SeverityLevel',
      [`${this.CORE_PREFIX}SeverityLevelScale`]: 'SeverityLevel',
      [`${this.BIO_PREFIX}PlantType`]: 'PlantType',
      [`${this.BIO_PREFIX}Species`]: 'Species',
      [`${this.PH_PREFIX}ToxinType`]: 'ToxinType',
      [`${this.PH_PREFIX}PestType`]: 'PestType'
    };

    return exactMappings[uri] || null;
  }

  /**
   * Infer EntityType from subClassOf structure
   * Walks up the hierarchy to find a mapped parent class
   */
  private inferEntityTypeFromHierarchy(
    classUri: string,
    classMap: Map<string, OwlClassInfo>
  ): EntityType | null {
    const classInfo = classMap.get(classUri);
    if (!classInfo) return null;

    // Check direct mapping first
    const directMapping = this.getEntityTypeForOwlClass(classUri);
    if (directMapping) return directMapping;

    // Walk up the subClassOf chain to find a mapped ancestor
    for (const parentUri of classInfo.subClassOf) {
      // Skip generic OWL parents
      if (parentUri.includes('owl#') || parentUri.includes('dul/DUL')) {
        continue;
      }

      // Try to get mapping for parent
      const parentMapping = this.getEntityTypeForOwlClass(parentUri);
      if (parentMapping) {
        console.log(`  📍 Inferred type for "${classInfo.label}" from parent → ${parentMapping}`);
        return parentMapping;
      }

      // Recursively check parent's parents
      const inheritedType = this.inferEntityTypeFromHierarchy(parentUri, classMap);
      if (inheritedType) {
        console.log(`  📍 Inferred type for "${classInfo.label}" from ancestor → ${inheritedType}`);
        return inheritedType;
      }
    }

    return null;
  }
}
