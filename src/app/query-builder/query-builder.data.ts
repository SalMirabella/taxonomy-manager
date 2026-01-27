// Types
export interface Entity {
  uri: string;
  label: string;
  type: EntityType;
  isCategory?: boolean;
  parent?: string;
  altLabels?: string[];
}

export interface Article {
  id: number;
  title: string;
  source: string;
  date: string;
  entities: string[];
}

export interface TypeConfig {
  color: string;
  bg: string;
  icon: string;
  label: string;
  singular: string;
  plural: string;
}

export type EntityType = 'Disease' | 'Symptom' | 'Pathogen' | 'Vector' | 'Host' | 'Hazard';

export interface CategoryDef {
  key: string;
  label: string;
  altLabels?: string[];
}

// Type Configuration
export const TYPE_CONFIG: Record<EntityType, TypeConfig> = {
  Disease: { color: '#dc2626', bg: '#fef2f2', icon: '', label: 'Disease', singular: 'as disease', plural: 'as diseases' },
  Symptom: { color: '#f59e0b', bg: '#fffbeb', icon: '', label: 'Symptom', singular: 'as symptom', plural: 'as symptoms' },
  Pathogen: { color: '#10b981', bg: '#ecfdf5', icon: '', label: 'Pathogen', singular: 'as pathogen', plural: 'as pathogens' },
  Vector: { color: '#f97316', bg: '#fff7ed', icon: '', label: 'Vector', singular: 'as vector', plural: 'as vectors' },
  Host: { color: '#6b7280', bg: '#f3f4f6', icon: '', label: 'Host', singular: 'as host', plural: 'as hosts' },
  Hazard: { color: '#ef4444', bg: '#fef2f2', icon: '', label: 'Hazard', singular: 'as associated hazard', plural: 'as associated hazards' },
};

// Categories
export const CATEGORIES: CategoryDef[] = [
  { key: 'diseases', label: 'Diseases' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'pathogens', label: 'Pathogens' },
  { key: 'vectors', label: 'Vectors' },
  { key: 'hosts', label: 'Hosts' },
  { key: 'hazards', label: 'Hazards' },
];

export const RELATION_KEYS = ['symptoms', 'pathogens', 'vectors', 'hosts', 'hazard'];

// ECMO Data
export const ECMO_DATA: {
  diseases: Entity[];
  symptoms: Entity[];
  pathogens: Entity[];
  vectors: Entity[];
  hosts: Entity[];
  hazards: Entity[];
  relations: Record<string, Record<string, string[]>>;
} = {
  diseases: [
    // Categories
    { uri: 'ph:ViralDisease', label: 'Viral Disease', type: 'Disease', isCategory: true },
    { uri: 'ph:BacterialDisease', label: 'Bacterial Disease', type: 'Disease', isCategory: true },
    { uri: 'ph:ParasiticDisease', label: 'Parasitic Disease', type: 'Disease', isCategory: true },
    // Viral Diseases
    { uri: 'ph:COVID19', label: 'COVID-19', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:EVD', label: 'Ebola', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:MVD', label: 'Marburg', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:DengueFever', label: 'Dengue', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:WestNileFever', label: 'West Nile', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:YellowFever', label: 'Yellow Fever', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:Influenza', label: 'Influenza', type: 'Disease', parent: 'ph:ViralDisease' },
    { uri: 'ph:Measles', label: 'Measles', type: 'Disease', parent: 'ph:ViralDisease' },
    // Bacterial Diseases
    { uri: 'ph:Cholera', label: 'Cholera', type: 'Disease', parent: 'ph:BacterialDisease' },
    { uri: 'ph:Leptospirosis', label: 'Leptospirosis', type: 'Disease', parent: 'ph:BacterialDisease' },
    { uri: 'ph:Tuberculosis', label: 'Tuberculosis', type: 'Disease', parent: 'ph:BacterialDisease' },
    { uri: 'ph:Plague', label: 'Plague', type: 'Disease', parent: 'ph:BacterialDisease' },
    // Parasitic Diseases
    { uri: 'ph:Malaria', label: 'Malaria', type: 'Disease', parent: 'ph:ParasiticDisease' },
  ],

  symptoms: [
    { uri: 'ph:Fever', label: 'Fever', type: 'Symptom' },
    { uri: 'ph:Cough', label: 'Cough', type: 'Symptom' },
    { uri: 'ph:Headache', label: 'Headache', type: 'Symptom' },
    { uri: 'ph:Hemorrhage', label: 'Hemorrhage', type: 'Symptom' },
    { uri: 'ph:Rash', label: 'Rash', type: 'Symptom' },
    { uri: 'ph:Diarrhea', label: 'Diarrhea', type: 'Symptom' },
    { uri: 'ph:Jaundice', label: 'Jaundice', type: 'Symptom' },
    { uri: 'ph:Chills', label: 'Chills', type: 'Symptom' },
  ],

  pathogens: [
    // Categories
    { uri: 'ph:VirusType', label: 'Virus', type: 'Pathogen', isCategory: true },
    { uri: 'ph:BacteriumType', label: 'Bacterium', type: 'Pathogen', isCategory: true },
    { uri: 'ph:ParasiteType', label: 'Parasite', type: 'Pathogen', isCategory: true },
    // Viruses
    { uri: 'ph:SARS_CoV_2', label: 'SARS-CoV-2', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:Ebolavirus', label: 'Ebolavirus', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:Marburgvirus', label: 'Marburgvirus', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:DengueVirus', label: 'Dengue virus', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:WestNileVirus', label: 'West Nile virus', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:YellowFeverVirus', label: 'Yellow fever virus', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:InfluenzaVirus', label: 'Influenza virus', type: 'Pathogen', parent: 'ph:VirusType' },
    { uri: 'ph:MeaslesVirus', label: 'Measles virus', type: 'Pathogen', parent: 'ph:VirusType' },
    // Bacteria
    { uri: 'ph:VibrioCholerae', label: 'Vibrio cholerae', type: 'Pathogen', parent: 'ph:BacteriumType' },
    { uri: 'ph:Leptospira', label: 'Leptospira', type: 'Pathogen', parent: 'ph:BacteriumType' },
    { uri: 'ph:MycobacteriumTB', label: 'M. tuberculosis', type: 'Pathogen', parent: 'ph:BacteriumType' },
    { uri: 'ph:YersiniaPestis', label: 'Yersinia pestis', type: 'Pathogen', parent: 'ph:BacteriumType' },
    // Parasites
    { uri: 'ph:Plasmodium', label: 'Plasmodium', type: 'Pathogen', parent: 'ph:ParasiteType' },
  ],

  vectors: [
    // Categories
    { uri: 'ph:MosquitoType', label: 'Mosquito', type: 'Vector', isCategory: true },
    { uri: 'ph:OtherVector', label: 'Other Vector', type: 'Vector', isCategory: true },
    // Mosquitoes
    { uri: 'ph:AedesAegypti', label: 'Aedes aegypti', type: 'Vector', parent: 'ph:MosquitoType' },
    { uri: 'ph:AedesAlbopictus', label: 'Aedes albopictus', type: 'Vector', parent: 'ph:MosquitoType' },
    { uri: 'ph:AnophelesMosquito', label: 'Anopheles', type: 'Vector', parent: 'ph:MosquitoType' },
    { uri: 'ph:CulexMosquito', label: 'Culex', type: 'Vector', parent: 'ph:MosquitoType' },
    // Other
    { uri: 'ph:Fleas', label: 'Fleas', type: 'Vector', parent: 'ph:OtherVector' },
    { uri: 'ph:Ticks', label: 'Ticks', type: 'Vector', parent: 'ph:OtherVector' },
  ],

  hosts: [
    // Categories
    { uri: 'ph:MammalHost', label: 'Mammal', type: 'Host', isCategory: true },
    { uri: 'ph:BirdHost', label: 'Bird', type: 'Host', isCategory: true },
    // Mammals
    { uri: 'ph:Humans', label: 'Humans', type: 'Host', parent: 'ph:MammalHost' },
    { uri: 'ph:BatHost', label: 'Bats', type: 'Host', parent: 'ph:MammalHost' },
    { uri: 'ph:Swine', label: 'Swine', type: 'Host', parent: 'ph:MammalHost' },
    { uri: 'ph:Rodents', label: 'Rodents', type: 'Host', parent: 'ph:MammalHost' },
    // Birds
    { uri: 'ph:Birds', label: 'Birds', type: 'Host', parent: 'ph:BirdHost' },
    { uri: 'ph:Poultry', label: 'Poultry', type: 'Host', parent: 'ph:BirdHost' },
  ],

  hazards: [
    // Biological Hazard
    { uri: 'core:BiologicalHazard', label: 'Biological Hazard', type: 'Hazard', isCategory: true },
    { uri: 'ph:InfectiousDisease', label: 'Infectious Disease', type: 'Hazard', parent: 'core:BiologicalHazard' },
    { uri: 'ph:PathogenType', label: 'Pathogen', type: 'Hazard', parent: 'core:BiologicalHazard' },
    { uri: 'ph:DiseaseVectorType', label: 'Disease Vector', type: 'Hazard', parent: 'core:BiologicalHazard' },
    { uri: 'ph:ToxinType', label: 'Toxin', type: 'Hazard', parent: 'core:BiologicalHazard' },
    // Hydrometeorological Hazard
    { uri: 'core:HydroMeteorologicalHazard', label: 'Hydrometeorological Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:Flooding', label: 'Flooding', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard' },
    { uri: 'core:Drought', label: 'Drought', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard' },
    { uri: 'core:Heatwave', label: 'Heatwave', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard' },
    { uri: 'core:TropicalCyclone', label: 'Tropical Cyclone', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard' },
    // Societal Hazard
    { uri: 'core:SocietalHazard', label: 'Societal Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:MassDisplacement', label: 'Mass Displacement', type: 'Hazard', parent: 'core:SocietalHazard' },
    { uri: 'core:ArmedConflict', label: 'Armed Conflict', type: 'Hazard', parent: 'core:SocietalHazard' },
    // Environmental Hazard
    { uri: 'core:EnvironmentalHazard', label: 'Environmental Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:WaterContamination', label: 'Water Contamination', type: 'Hazard', parent: 'core:EnvironmentalHazard' },
  ],

  relations: {
    'ph:COVID19': { symptoms: ['ph:Fever', 'ph:Cough'], pathogens: ['ph:SARS_CoV_2'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease'] },
    'ph:EVD': { symptoms: ['ph:Fever', 'ph:Hemorrhage'], pathogens: ['ph:Ebolavirus'], hosts: ['ph:Humans', 'ph:BatHost'], hazard: ['ph:InfectiousDisease'] },
    'ph:MVD': { symptoms: ['ph:Fever', 'ph:Hemorrhage'], pathogens: ['ph:Marburgvirus'], hosts: ['ph:Humans', 'ph:BatHost'], hazard: ['ph:InfectiousDisease'] },
    'ph:DengueFever': { symptoms: ['ph:Fever', 'ph:Headache', 'ph:Rash'], pathogens: ['ph:DengueVirus'], vectors: ['ph:AedesAegypti', 'ph:AedesAlbopictus'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease', 'ph:DiseaseVectorType'] },
    'ph:WestNileFever': { symptoms: ['ph:Fever', 'ph:Headache'], pathogens: ['ph:WestNileVirus'], vectors: ['ph:CulexMosquito'], hosts: ['ph:Birds', 'ph:Humans'], hazard: ['ph:InfectiousDisease', 'ph:DiseaseVectorType'] },
    'ph:YellowFever': { symptoms: ['ph:Fever', 'ph:Jaundice', 'ph:Hemorrhage'], pathogens: ['ph:YellowFeverVirus'], vectors: ['ph:AedesAegypti'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease', 'ph:DiseaseVectorType'] },
    'ph:Influenza': { symptoms: ['ph:Fever', 'ph:Cough'], pathogens: ['ph:InfluenzaVirus'], hosts: ['ph:Humans', 'ph:Birds', 'ph:Swine'], hazard: ['ph:InfectiousDisease'] },
    'ph:Measles': { symptoms: ['ph:Fever', 'ph:Rash', 'ph:Cough'], pathogens: ['ph:MeaslesVirus'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease', 'core:MassDisplacement'] },
    'ph:Cholera': { symptoms: ['ph:Diarrhea'], pathogens: ['ph:VibrioCholerae'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease', 'core:Flooding', 'core:MassDisplacement', 'core:WaterContamination'] },
    'ph:Leptospirosis': { symptoms: ['ph:Fever', 'ph:Jaundice'], pathogens: ['ph:Leptospira'], hosts: ['ph:Humans', 'ph:Rodents'], hazard: ['ph:InfectiousDisease', 'core:Flooding', 'core:WaterContamination'] },
    'ph:Tuberculosis': { symptoms: ['ph:Fever', 'ph:Cough'], pathogens: ['ph:MycobacteriumTB'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease'] },
    'ph:Plague': { symptoms: ['ph:Fever', 'ph:Chills'], pathogens: ['ph:YersiniaPestis'], vectors: ['ph:Fleas'], hosts: ['ph:Humans', 'ph:Rodents'], hazard: ['ph:InfectiousDisease', 'ph:DiseaseVectorType'] },
    'ph:Malaria': { symptoms: ['ph:Fever', 'ph:Chills', 'ph:Headache'], pathogens: ['ph:Plasmodium'], vectors: ['ph:AnophelesMosquito'], hosts: ['ph:Humans'], hazard: ['ph:InfectiousDisease', 'ph:DiseaseVectorType'] },
  }
};

// Simulated EIOS Articles
export const EIOS_ARTICLES: Article[] = [
  {
    id: 1,
    title: "Dengue outbreak reported in flooded regions of Bangladesh",
    source: "WHO",
    date: "2024-01-15",
    entities: ['ph:DengueFever', 'ph:Fever', 'ph:AedesAegypti', 'core:Flooding', 'ph:Humans']
  },
  {
    id: 2,
    title: "COVID-19 cases surge in European countries amid winter wave",
    source: "ECDC",
    date: "2024-01-14",
    entities: ['ph:COVID19', 'ph:Fever', 'ph:Cough', 'ph:SARS_CoV_2', 'ph:Humans']
  },
  {
    id: 3,
    title: "Ebola response teams deployed to affected communities",
    source: "MSF",
    date: "2024-01-13",
    entities: ['ph:EVD', 'ph:Fever', 'ph:Hemorrhage', 'ph:Ebolavirus', 'ph:BatHost']
  },
  {
    id: 4,
    title: "West Nile virus detected in migratory birds in Southern Europe",
    source: "EFSA",
    date: "2024-01-12",
    entities: ['ph:WestNileFever', 'ph:Fever', 'ph:CulexMosquito', 'ph:Birds', 'ph:WestNileVirus']
  },
  {
    id: 5,
    title: "Cholera cases rise in refugee camps following water contamination",
    source: "UNHCR",
    date: "2024-01-11",
    entities: ['ph:Cholera', 'ph:Diarrhea', 'ph:VibrioCholerae', 'core:MassDisplacement', 'core:WaterContamination']
  },
  {
    id: 6,
    title: "Malaria prevention campaign launched ahead of rainy season",
    source: "WHO Africa",
    date: "2024-01-10",
    entities: ['ph:Malaria', 'ph:Fever', 'ph:Chills', 'ph:AnophelesMosquito', 'ph:Plasmodium']
  },
  {
    id: 7,
    title: "Influenza activity increasing in swine populations",
    source: "FAO",
    date: "2024-01-09",
    entities: ['ph:Influenza', 'ph:Fever', 'ph:Cough', 'ph:Swine', 'ph:InfluenzaVirus']
  },
  {
    id: 8,
    title: "Yellow Fever vaccination campaign in endemic areas",
    source: "PAHO",
    date: "2024-01-08",
    entities: ['ph:YellowFever', 'ph:Fever', 'ph:Jaundice', 'ph:AedesAegypti', 'ph:YellowFeverVirus']
  },
  {
    id: 9,
    title: "Measles outbreak among displaced populations",
    source: "UNICEF",
    date: "2024-01-07",
    entities: ['ph:Measles', 'ph:Fever', 'ph:Rash', 'core:MassDisplacement', 'ph:MeaslesVirus']
  },
  {
    id: 10,
    title: "Leptospirosis cases reported after severe flooding events",
    source: "Philippines DOH",
    date: "2024-01-06",
    entities: ['ph:Leptospirosis', 'ph:Fever', 'ph:Jaundice', 'core:Flooding', 'ph:Leptospira']
  },
  {
    id: 11,
    title: "Tuberculosis screening programs expanded in urban areas",
    source: "WHO",
    date: "2024-01-05",
    entities: ['ph:Tuberculosis', 'ph:Fever', 'ph:Cough', 'ph:MycobacteriumTB', 'ph:Humans']
  },
  {
    id: 12,
    title: "Plague surveillance enhanced in rodent populations",
    source: "CDC",
    date: "2024-01-04",
    entities: ['ph:Plague', 'ph:Fever', 'ph:Chills', 'ph:Fleas', 'ph:Rodents', 'ph:YersiniaPestis']
  },
  {
    id: 13,
    title: "Dengue and Chikungunya co-circulation reported in tropical regions",
    source: "ProMED",
    date: "2024-01-03",
    entities: ['ph:DengueFever', 'ph:Fever', 'ph:Rash', 'ph:AedesAegypti', 'ph:AedesAlbopictus']
  },
  {
    id: 14,
    title: "Avian influenza outbreak detected in poultry farms",
    source: "OIE",
    date: "2024-01-02",
    entities: ['ph:Influenza', 'ph:Fever', 'ph:Birds', 'ph:Poultry', 'ph:InfluenzaVirus']
  },
  {
    id: 15,
    title: "Marburg virus case confirmed in traveler returning from Africa",
    source: "ECDC",
    date: "2024-01-01",
    entities: ['ph:MVD', 'ph:Fever', 'ph:Hemorrhage', 'ph:Marburgvirus', 'ph:BatHost']
  },
];

// Helper function to get all selectable entities
export function getAllEntities(): Entity[] {
  return [
    ...ECMO_DATA.diseases.filter(e => !e.isCategory),
    ...ECMO_DATA.symptoms,
    ...ECMO_DATA.pathogens.filter(e => !e.isCategory),
    ...ECMO_DATA.vectors.filter(e => !e.isCategory),
    ...ECMO_DATA.hosts.filter(e => !e.isCategory),
    ...ECMO_DATA.hazards.filter(e => !e.isCategory),
  ];
}

// Helper to get entity by URI
export function getEntityByUri(uri: string): Entity | undefined {
  return getAllEntities().find(e => e.uri === uri);
}

// Relation labels for natural language
export const RELATION_LABELS: Record<string, { singular: string; plural: string }> = {
  Symptom: { singular: 'has as symptom', plural: 'has as symptoms' },
  Pathogen: { singular: 'is caused by', plural: 'is caused by' },
  Vector: { singular: 'is transmitted via', plural: 'is transmitted via' },
  Host: { singular: 'has as host', plural: 'has as hosts' },
  Hazard: { singular: 'is associated with', plural: 'is associated with' },
};

// Reverse relation labels
export const REVERSE_RELATION_LABELS: Record<string, string> = {
  Symptom: 'is a symptom present in',
  Pathogen: 'is the pathogenic agent of',
  Vector: 'is a transmission vector for',
  Host: 'is a host for',
  Hazard: 'is associated with',
};
