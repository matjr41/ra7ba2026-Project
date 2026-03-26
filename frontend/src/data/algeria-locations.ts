import algeriaData from './algeria-full.json';

export interface Wilaya {
  id: number;
  name: string;
  nameAr: string;
  communes: Commune[];
}

export interface Commune {
  id: number;
  name: string;
  nameAr: string;
  postalCode: string;
  daira?: string;
}

export const ALGERIA_LOCATIONS: Wilaya[] = algeriaData as Wilaya[];

export const getWilayaById = (id: number): Wilaya | undefined => {
  return ALGERIA_LOCATIONS.find(w => w.id === id);
};

export const getCommunesByWilaya = (wilayaId: number): Commune[] => {
  const wilaya = getWilayaById(wilayaId);
  return wilaya ? wilaya.communes : [];
};

export const searchWilayas = (query: string): Wilaya[] => {
  const lowerQuery = query.toLowerCase();
  return ALGERIA_LOCATIONS.filter(w => 
    w.name.toLowerCase().includes(lowerQuery) || 
    w.nameAr.includes(query)
  );
};
