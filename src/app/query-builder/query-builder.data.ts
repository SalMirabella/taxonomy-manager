// Types
export interface Entity {
  uri: string;
  label: string;
  type: EntityType;
  isCategory?: boolean;
  parent?: string;
  altLabels?: string[];
  taxonomicRank?: string; // Species, Genus, Family, etc.
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
  Disease: { color: '#dc2626', bg: '#fef2f2', icon: '🦠', label: 'Disease', singular: 'as disease', plural: 'as diseases' },
  Symptom: { color: '#f59e0b', bg: '#fffbeb', icon: '🤒', label: 'Symptom', singular: 'as symptom', plural: 'as symptoms' },
  Pathogen: { color: '#10b981', bg: '#ecfdf5', icon: '🔬', label: 'Pathogen', singular: 'as pathogen', plural: 'as pathogens' },
  Vector: { color: '#f97316', bg: '#fff7ed', icon: '🦟', label: 'Vector', singular: 'as vector', plural: 'as vectors' },
  Host: { color: '#6b7280', bg: '#f3f4f6', icon: '🐾', label: 'Host', singular: 'as host', plural: 'as hosts' },
  Hazard: { color: '#ef4444', bg: '#fef2f2', icon: '⚠️', label: 'Hazard', singular: 'as associated hazard', plural: 'as associated hazards' },
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

// ECMO Data - Based on real ECMO ontology from TTL files
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
    // ==================== VIRTUAL "ALL" ENTITY ====================
    { uri: 'virtual:AllDiseases', label: 'All Diseases', type: 'Disease', isCategory: true },
    
    // ==================== MAIN DISEASE CATEGORIES ====================
    { uri: 'ph:ViralDiseaseOrSyndrome', label: 'Viral Disease', type: 'Disease', isCategory: true },
    { uri: 'ph:BacterialDiseaseOrSyndrome', label: 'Bacterial Disease', type: 'Disease', isCategory: true },
    { uri: 'ph:ParasiticDiseaseOrSyndrome', label: 'Parasitic Disease', type: 'Disease', isCategory: true },
    { uri: 'ph:FungalDiseaseOrSyndrome', label: 'Fungal Disease', type: 'Disease', isCategory: true },
    
    // ==================== VIRAL DISEASE SUBCATEGORIES ====================
    { uri: 'ph:VHF', label: 'Viral Hemorrhagic Fever', type: 'Disease', isCategory: true, parent: 'ph:ViralDiseaseOrSyndrome' },
    
    // Viral Hemorrhagic Fevers
    { uri: 'ph:Ebola', label: 'Ebola Virus Disease', type: 'Disease', parent: 'ph:VHF', altLabels: ['EVD', 'Ebola'] },
    { uri: 'ph:MVD', label: 'Marburg Virus Disease', type: 'Disease', parent: 'ph:VHF', altLabels: ['Marburg'] },
    { uri: 'ph:LassaFever', label: 'Lassa Fever', type: 'Disease', parent: 'ph:VHF' },
    
    // Other Viral
    { uri: 'ph:COVID19', label: 'Coronavirus Disease 2019', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome', altLabels: ['COVID-19'] },
    { uri: 'ph:Influenza', label: 'Influenza', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome', altLabels: ['Flu'] },
    { uri: 'ph:Measles', label: 'Measles', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome' },
    { uri: 'ph:YellowFever', label: 'Yellow Fever', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome' },
    { uri: 'ph:DengueFever', label: 'Dengue Fever', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome', altLabels: ['Dengue'] },
    { uri: 'ph:WestNileFever', label: 'West Nile Fever', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome' },
    { uri: 'ph:ZikaVirusDisease', label: 'Zika Virus Disease', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome', altLabels: ['Zika'] },
    { uri: 'ph:Chikungunya', label: 'Chikungunya', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome' },
    { uri: 'ph:Mpox', label: 'Mpox', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome', altLabels: ['Monkeypox'] },
    { uri: 'ph:Rabies', label: 'Rabies', type: 'Disease', parent: 'ph:ViralDiseaseOrSyndrome' },
    
    // Bacterial
    { uri: 'ph:Cholera', label: 'Cholera', type: 'Disease', parent: 'ph:BacterialDiseaseOrSyndrome' },
    { uri: 'ph:Tuberculosis', label: 'Tuberculosis', type: 'Disease', parent: 'ph:BacterialDiseaseOrSyndrome', altLabels: ['TB'] },
    { uri: 'ph:Plague', label: 'Plague', type: 'Disease', parent: 'ph:BacterialDiseaseOrSyndrome' },
    { uri: 'ph:Leptospirosis', label: 'Leptospirosis', type: 'Disease', parent: 'ph:BacterialDiseaseOrSyndrome' },
    
    // Parasitic
    { uri: 'ph:Malaria', label: 'Malaria', type: 'Disease', parent: 'ph:ParasiticDiseaseOrSyndrome' },
    
    // Other
    { uri: 'ph:Pneumonia', label: 'Pneumonia', type: 'Disease', parent: 'ph:InfectiousDisease' },
  ],

  symptoms: [
    // ==================== VIRTUAL "ALL" ENTITY ====================
    { uri: 'virtual:AllSymptoms', label: 'All Symptoms', type: 'Symptom', isCategory: true },
    
    // ==================== SYMPTOMS ====================
    { uri: 'ph:Fever', label: 'Fever', type: 'Symptom', altLabels: ['Febbre'] },
    { uri: 'ph:Cough', label: 'Cough', type: 'Symptom' },
    { uri: 'ph:Fatigue', label: 'Fatigue', type: 'Symptom' },
    { uri: 'ph:Headache', label: 'Headache', type: 'Symptom' },
    { uri: 'ph:Hemorrhage', label: 'Hemorrhage', type: 'Symptom' },
    { uri: 'ph:Rash', label: 'Rash', type: 'Symptom' },
    { uri: 'ph:JointPain', label: 'Joint Pain', type: 'Symptom' },
    { uri: 'ph:Vomiting', label: 'Vomiting', type: 'Symptom' },
    { uri: 'ph:Diarrhea', label: 'Diarrhea', type: 'Symptom' },
    { uri: 'ph:Jaundice', label: 'Jaundice', type: 'Symptom' },
    { uri: 'ph:Chills', label: 'Chills', type: 'Symptom' },
    { uri: 'ph:Paralysis', label: 'Paralysis', type: 'Symptom' },
  ],

  pathogens: [
    // ==================== VIRTUAL "ALL" ENTITY ====================
    { uri: 'virtual:AllPathogens', label: 'All Pathogens', type: 'Pathogen', isCategory: true },
    
    // ==================== MAIN PATHOGEN CATEGORIES ====================
    { uri: 'ph:PathogenicVirusType', label: 'Virus', type: 'Pathogen', isCategory: true },
    { uri: 'ph:PathogenicBacteriumType', label: 'Bacterium', type: 'Pathogen', isCategory: true },
    { uri: 'ph:PathogenicParasiteType', label: 'Parasite', type: 'Pathogen', isCategory: true },
    
    // ==================== VIRUS FAMILIES ====================
    { uri: 'ph:Filoviridae', label: 'Filoviridae', type: 'Pathogen', isCategory: true, parent: 'ph:PathogenicVirusType', taxonomicRank: 'Family' },
    { uri: 'ph:Ebolavirus', label: 'Ebolavirus', type: 'Pathogen', isCategory: true, parent: 'ph:Filoviridae', taxonomicRank: 'Genus' },
    { uri: 'ph:Marburgvirus', label: 'Marburgvirus', type: 'Pathogen', isCategory: true, parent: 'ph:Filoviridae', taxonomicRank: 'Genus' },
    { uri: 'ph:MARV', label: 'Marburg virus', type: 'Pathogen', parent: 'ph:Marburgvirus', taxonomicRank: 'Species' },
    
    // Coronaviridae Family
    { uri: 'ph:Coronaviridae', label: 'Coronaviridae', type: 'Pathogen', isCategory: true, parent: 'ph:PathogenicVirusType', taxonomicRank: 'Family' },
    { uri: 'ph:Betacoronavirus', label: 'Betacoronavirus', type: 'Pathogen', isCategory: true, parent: 'ph:Coronaviridae', taxonomicRank: 'Genus' },
    { uri: 'ph:SARS_CoV_2', label: 'SARS-CoV-2', type: 'Pathogen', parent: 'ph:Betacoronavirus', taxonomicRank: 'Strain' },
    { uri: 'ph:SARS_CoV_2_Omicron', label: 'Omicron', type: 'Pathogen', parent: 'ph:SARS_CoV_2', taxonomicRank: 'Variant' },
    { uri: 'ph:SARS_CoV_2_BA2', label: 'BA.2', type: 'Pathogen', parent: 'ph:SARS_CoV_2_Omicron', taxonomicRank: 'Variant' },
    
    // Poxviridae
    { uri: 'ph:Poxviridae', label: 'Poxviridae', type: 'Pathogen', isCategory: true, parent: 'ph:PathogenicVirusType', taxonomicRank: 'Family' },
    { uri: 'ph:Orthopoxvirus', label: 'Orthopoxvirus', type: 'Pathogen', isCategory: true, parent: 'ph:Poxviridae', taxonomicRank: 'Genus' },
    { uri: 'ph:MPV', label: 'Monkeypox Virus', type: 'Pathogen', parent: 'ph:Orthopoxvirus', taxonomicRank: 'Species' },
    
    // Bacteria
    { uri: 'ph:EscherichiaColi', label: 'Escherichia coli', type: 'Pathogen', parent: 'ph:PathogenicBacteriumType', altLabels: ['E. coli'] },
    
    // Parasites
    { uri: 'ph:PlasmodiumFalciparum', label: 'Plasmodium falciparum', type: 'Pathogen', parent: 'ph:PathogenicParasiteType' },
    { uri: 'ph:PlasmodiumVivax', label: 'Plasmodium vivax', type: 'Pathogen', parent: 'ph:PathogenicParasiteType' },
  ],

  vectors: [
    // ==================== VIRTUAL "ALL" ENTITY ====================
    { uri: 'virtual:AllVectors', label: 'All Vectors', type: 'Vector', isCategory: true },
    
    // ==================== MAIN VECTOR CATEGORIES ====================
    // ROOT
    
    { uri: 'ph:Insects', label: 'Insects', type: 'Vector', isCategory: true, taxonomicRank: 'Class' },
    { uri: 'ph:Mosquitoes', label: 'Mosquitoes', type: 'Vector', isCategory: true, parent: 'ph:Insects', taxonomicRank: 'Family' },
    
    // Genera
    { uri: 'ph:AnophelesMosquito', label: 'Anopheles', type: 'Vector', isCategory: true, parent: 'ph:Mosquitoes', taxonomicRank: 'Genus' },
    { uri: 'ph:AedesMosquito', label: 'Aedes', type: 'Vector', isCategory: true, parent: 'ph:Mosquitoes', taxonomicRank: 'Genus' },
    { uri: 'ph:CulexMosquito', label: 'Culex', type: 'Vector', isCategory: true, parent: 'ph:Mosquitoes', taxonomicRank: 'Genus' },
    
    // Species
    { uri: 'ph:AedesAegypti', label: 'Aedes aegypti', type: 'Vector', parent: 'ph:AedesMosquito', taxonomicRank: 'Species' },
    { uri: 'ph:AedesAlbopictus', label: 'Aedes albopictus', type: 'Vector', parent: 'ph:AedesMosquito', taxonomicRank: 'Species' },
    
    // Other
    { uri: 'ph:Fleas', label: 'Fleas', type: 'Vector', parent: 'ph:Insects' },
    { uri: 'ph:Ticks', label: 'Ticks', type: 'Vector' },
  ],

  hosts: [
    // ==================== VIRTUAL "ALL" ENTITY ====================
    { uri: 'virtual:AllHosts', label: 'All Hosts', type: 'Host', isCategory: true },
    
    // ==================== MAIN HOST CATEGORIES ====================
    // ROOT
    
    { uri: 'ph:Animals', label: 'Animals', type: 'Host', isCategory: true },
    { uri: 'ph:Mammals', label: 'Mammals', type: 'Host', isCategory: true, parent: 'ph:Animals', taxonomicRank: 'Class' },
    { uri: 'ph:Birds', label: 'Birds', type: 'Host', isCategory: true, parent: 'ph:Animals', taxonomicRank: 'Class', altLabels: ['Uccelli'] },
    { uri: 'ph:Primates', label: 'Primates', type: 'Host', isCategory: true, parent: 'ph:Mammals', taxonomicRank: 'Order' },
    
    // Specific
    { uri: 'ph:Humans', label: 'Humans', type: 'Host', parent: 'ph:Primates', taxonomicRank: 'Species' },
    { uri: 'ph:NonHumanPrimates', label: 'Non-Human Primates', type: 'Host', parent: 'ph:Primates' },
    { uri: 'ph:BatHost', label: 'Bats', type: 'Host', parent: 'ph:Mammals' },
    { uri: 'ph:Swine', label: 'Swine', type: 'Host', parent: 'ph:Mammals' },
    { uri: 'ph:RodentHost', label: 'Rodents', type: 'Host', parent: 'ph:Mammals' },
    { uri: 'ph:Dogs', label: 'Dogs', type: 'Host', parent: 'ph:Mammals' },
    { uri: 'ph:Poultry', label: 'Poultry', type: 'Host', parent: 'ph:Birds' },
  ],

  hazards: [
    // ==================== VIRTUAL "ALL" ENTITY ====================
    { uri: 'virtual:AllHazards', label: 'All Hazards', type: 'Hazard', isCategory: true },
    
    // ==================== MAIN HAZARD CATEGORIES ====================
    // ROOT
    
    
    // Main categories
    { uri: 'core:BiologicalHazard', label: 'Biological Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:NaturalHazard', label: 'Natural Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:HumanitarianHazard', label: 'Humanitarian Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:EnvironmentalHazard', label: 'Environmental Hazard', type: 'Hazard', isCategory: true },
    { uri: 'core:SocietalHazard', label: 'Societal Hazard', type: 'Hazard', isCategory: true },
    
    // Biological
    { uri: 'core:InfectiousDisease', label: 'Infectious Disease', type: 'Hazard', parent: 'core:BiologicalHazard' },
    { uri: 'core:Epidemic', label: 'Epidemic', type: 'Hazard', parent: 'core:BiologicalHazard' },
    { uri: 'core:Pandemic', label: 'Pandemic', type: 'Hazard', parent: 'core:BiologicalHazard' },
    
    // Natural
    { uri: 'core:HydroMeteorologicalHazard', label: 'Hydrometeorological', type: 'Hazard', isCategory: true, parent: 'core:NaturalHazard' },
    { uri: 'core:Flooding', label: 'Flooding', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard', altLabels: ['Flood'] },
    { uri: 'core:Drought', label: 'Drought', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard' },
    { uri: 'core:Heatwave', label: 'Heatwave', type: 'Hazard', parent: 'core:HydroMeteorologicalHazard' },
    { uri: 'core:Earthquake', label: 'Earthquake', type: 'Hazard', parent: 'core:NaturalHazard' },
    
    // Humanitarian/Societal
    { uri: 'core:MassDisplacement', label: 'Mass Displacement', type: 'Hazard', parent: 'core:HumanitarianHazard' },
    { uri: 'core:ArmedConflict', label: 'Armed Conflict', type: 'Hazard', parent: 'core:SocietalHazard' },
    
    // Environmental
    { uri: 'core:WaterContamination', label: 'Water Contamination', type: 'Hazard', parent: 'core:EnvironmentalHazard' },
  ],

  relations: {
    'ph:COVID19': { symptoms: ['ph:Fever', 'ph:Cough', 'ph:Fatigue'], pathogens: ['ph:SARS_CoV_2'], hosts: ['ph:Humans'], hazard: ['core:Pandemic'] },
    'ph:Ebola': { symptoms: ['ph:Fever', 'ph:Hemorrhage', 'ph:Vomiting'], pathogens: ['ph:Ebolavirus'], hosts: ['ph:Humans', 'ph:NonHumanPrimates', 'ph:BatHost'], hazard: ['core:Epidemic'] },
    'ph:MVD': { symptoms: ['ph:Fever', 'ph:Hemorrhage'], pathogens: ['ph:MARV'], hosts: ['ph:Humans', 'ph:BatHost'], hazard: ['core:Epidemic'] },
    'ph:Malaria': { symptoms: ['ph:Fever', 'ph:Chills', 'ph:Headache'], pathogens: ['ph:PlasmodiumFalciparum', 'ph:PlasmodiumVivax'], vectors: ['ph:AnophelesMosquito'], hosts: ['ph:Humans'], hazard: ['core:InfectiousDisease'] },
    'ph:DengueFever': { symptoms: ['ph:Fever', 'ph:Headache', 'ph:JointPain'], vectors: ['ph:AedesAegypti', 'ph:AedesAlbopictus'], hosts: ['ph:Humans'], hazard: ['core:Epidemic'] },
    'ph:YellowFever': { symptoms: ['ph:Fever', 'ph:Jaundice'], vectors: ['ph:AedesAegypti'], hosts: ['ph:Humans', 'ph:NonHumanPrimates'], hazard: ['core:InfectiousDisease'] },
    'ph:WestNileFever': { symptoms: ['ph:Fever', 'ph:Headache'], vectors: ['ph:CulexMosquito'], hosts: ['ph:Birds', 'ph:Humans'], hazard: ['core:InfectiousDisease'] },
    'ph:ZikaVirusDisease': { symptoms: ['ph:Fever', 'ph:Rash'], vectors: ['ph:AedesAegypti'], hosts: ['ph:Humans'], hazard: ['core:InfectiousDisease'] },
    'ph:Chikungunya': { symptoms: ['ph:Fever', 'ph:JointPain'], vectors: ['ph:AedesAegypti', 'ph:AedesAlbopictus'], hosts: ['ph:Humans'], hazard: ['core:InfectiousDisease'] },
    'ph:Cholera': { symptoms: ['ph:Diarrhea', 'ph:Vomiting'], hosts: ['ph:Humans'], hazard: ['core:Flooding', 'core:MassDisplacement', 'core:WaterContamination'] },
    'ph:Influenza': { symptoms: ['ph:Fever', 'ph:Cough'], hosts: ['ph:Humans', 'ph:Birds', 'ph:Swine'], hazard: ['core:Pandemic'] },
    'ph:Measles': { symptoms: ['ph:Fever', 'ph:Rash'], hosts: ['ph:Humans'], hazard: ['core:Epidemic'] },
    'ph:Tuberculosis': { symptoms: ['ph:Cough', 'ph:Fever'], hosts: ['ph:Humans'], hazard: ['core:InfectiousDisease'] },
    'ph:Plague': { symptoms: ['ph:Fever', 'ph:Chills'], vectors: ['ph:Fleas'], hosts: ['ph:RodentHost', 'ph:Humans'], hazard: ['core:Epidemic'] },
    'ph:Leptospirosis': { symptoms: ['ph:Fever', 'ph:Jaundice'], hosts: ['ph:RodentHost', 'ph:Humans'], hazard: ['core:Flooding', 'core:WaterContamination'] },
    'ph:Rabies': { symptoms: ['ph:Fever', 'ph:Paralysis'], hosts: ['ph:Dogs', 'ph:BatHost', 'ph:Humans'], hazard: ['core:InfectiousDisease'] },
    'ph:Mpox': { symptoms: ['ph:Fever', 'ph:Rash'], pathogens: ['ph:MPV'], hosts: ['ph:Humans'], hazard: ['core:InfectiousDisease'] },
  }
};

export const EIOS_ARTICLES: Article[] = [
  { id: 1, title: "Dengue outbreak in Bangladesh", source: "WHO", date: "2024-01-15", entities: ['ph:DengueFever', 'ph:Fever', 'ph:AedesAegypti', 'core:Flooding'] },
  { id: 2, title: "COVID-19 Omicron surge in Europe", source: "ECDC", date: "2024-01-14", entities: ['ph:COVID19', 'ph:SARS_CoV_2_Omicron', 'ph:Cough', 'core:Pandemic'] },
  { id: 3, title: "Ebola response in Central Africa", source: "MSF", date: "2024-01-13", entities: ['ph:Ebola', 'ph:Hemorrhage', 'ph:Ebolavirus', 'core:Epidemic'] },
  { id: 4, title: "West Nile in migratory birds", source: "EFSA", date: "2024-01-12", entities: ['ph:WestNileFever', 'ph:CulexMosquito', 'ph:Birds'] },
  { id: 5, title: "Cholera in refugee camps", source: "UNHCR", date: "2024-01-11", entities: ['ph:Cholera', 'ph:Diarrhea', 'core:MassDisplacement', 'core:WaterContamination'] },
  { id: 6, title: "Malaria prevention campaign", source: "WHO", date: "2024-01-10", entities: ['ph:Malaria', 'ph:Chills', 'ph:AnophelesMosquito', 'ph:PlasmodiumFalciparum'] },
  { id: 7, title: "Influenza in swine populations", source: "FAO", date: "2024-01-09", entities: ['ph:Influenza', 'ph:Swine', 'ph:Cough'] },
  { id: 8, title: "Marburg case confirmed", source: "ECDC", date: "2024-01-08", entities: ['ph:MVD', 'ph:MARV', 'ph:Hemorrhage', 'ph:BatHost'] },
  { id: 9, title: "Mpox cases in European cities", source: "ECDC", date: "2024-01-07", entities: ['ph:Mpox', 'ph:MPV', 'ph:Rash'] },
  { id: 10, title: "Rabies prevention campaign", source: "WHO", date: "2024-01-06", entities: ['ph:Rabies', 'ph:Dogs', 'ph:Paralysis'] },
  { id: 11, title: "BA.2 variant spreading", source: "WHO", date: "2024-01-05", entities: ['ph:COVID19', 'ph:SARS_CoV_2_BA2', 'ph:Humans'] },
  { id: 12, title: "VHF under investigation", source: "CDC", date: "2024-01-04", entities: ['ph:VHF', 'ph:Fever', 'ph:Hemorrhage'] },
  { id: 13, title: "Zika in tropical regions", source: "ProMED", date: "2024-01-03", entities: ['ph:ZikaVirusDisease', 'ph:AedesAegypti'] },
  { id: 14, title: "Chikungunya outbreak", source: "WHO", date: "2024-01-02", entities: ['ph:Chikungunya', 'ph:JointPain', 'ph:AedesAlbopictus'] },
  { id: 15, title: "Drought increases disease risk", source: "UNICEF", date: "2024-01-01", entities: ['core:Drought', 'core:WaterContamination'] },
];

export function getAllEntities(): Entity[] {
  return [
    ...ECMO_DATA.diseases.filter(e => !e.isCategory),
    ...ECMO_DATA.symptoms.filter(e => !e.isCategory),
    ...ECMO_DATA.pathogens.filter(e => !e.isCategory),
    ...ECMO_DATA.vectors.filter(e => !e.isCategory),
    ...ECMO_DATA.hosts.filter(e => !e.isCategory),
    ...ECMO_DATA.hazards.filter(e => !e.isCategory),
  ];
}

export function getAllEntitiesIncludingVirtual(): Entity[] {
  return [
    ...ECMO_DATA.diseases,
    ...ECMO_DATA.symptoms,
    ...ECMO_DATA.pathogens,
    ...ECMO_DATA.vectors,
    ...ECMO_DATA.hosts,
    ...ECMO_DATA.hazards,
  ];
}

export function getEntityByUri(uri: string): Entity | undefined {
  const all = [...ECMO_DATA.diseases, ...ECMO_DATA.symptoms, ...ECMO_DATA.pathogens, ...ECMO_DATA.vectors, ...ECMO_DATA.hosts, ...ECMO_DATA.hazards];
  return all.find(e => e.uri === uri);
}

export function getAllDescendants(categoryUri: string, dataKey: string): Entity[] {
  // Special handling for virtual "All" entities
  if (categoryUri.startsWith('virtual:All')) {
    const items: Entity[] = (ECMO_DATA as any)[dataKey] || [];
    // Return ALL non-category entities in this data key
    return items.filter(i => !i.isCategory || !i.uri?.startsWith('virtual:'));
  }
  
  const items: Entity[] = (ECMO_DATA as any)[dataKey] || [];
  const directChildren = items.filter(i => i.parent === categoryUri);
  let allDescendants: Entity[] = [];
  for (const child of directChildren) {
    if (child.isCategory) {
      allDescendants = [...allDescendants, ...getAllDescendants(child.uri, dataKey)];
    } else {
      allDescendants.push(child);
    }
  }
  return allDescendants;
}

export const RELATION_LABELS: Record<string, { singular: string; plural: string }> = {
  Symptom: { singular: 'has as symptom', plural: 'has as symptoms' },
  Pathogen: { singular: 'is caused by', plural: 'is caused by' },
  Vector: { singular: 'is transmitted via', plural: 'is transmitted via' },
  Host: { singular: 'has as host', plural: 'has as hosts' },
  Hazard: { singular: 'is associated with', plural: 'is associated with' },
};

export const REVERSE_RELATION_LABELS: Record<string, string> = {
  Symptom: 'is a symptom present in',
  Pathogen: 'is the pathogenic agent of',
  Vector: 'is a transmission vector for',
  Host: 'is a host for',
  Hazard: 'is associated with',
};
