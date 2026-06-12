'use client';

// Локальное хранилище данных компании (прототип). В проде — таблицы tours/companies.

export type TourTypeId = 'trekking' | 'horse' | 'jeep' | 'camping' | 'cultural' | 'gastro' | 'ski';

export interface AgencyTour {
  id: string;
  title: string;
  type: TourTypeId;
  destination: string;
  durationDays: number;
  price: number;
  currency: 'KGS' | 'USD';
  seatsTotal: number;
  dateStart: string; // ISO date
  description: string;
  status: 'published' | 'draft';
  createdAt: string;
}

export interface CompanySocials {
  instagram: string;
  telegram: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  website: string;
}

export const EMPTY_SOCIALS: CompanySocials = {
  instagram: '', telegram: '', whatsapp: '', facebook: '', youtube: '', tiktok: '', website: '',
};

export interface CompanyProfile {
  companyName: string;
  description: string;
  phone: string;
  socials: CompanySocials;
}

const toursKey = (companyId: string) => `jolu.company.${companyId}.tours`;
const profileKey = (companyId: string) => `jolu.company.${companyId}.profile`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export function getTours(companyId: string): AgencyTour[] {
  return read<AgencyTour[]>(toursKey(companyId), []);
}
export function saveTours(companyId: string, tours: AgencyTour[]) {
  write(toursKey(companyId), tours);
}
export function addTour(companyId: string, tour: Omit<AgencyTour, 'id' | 'createdAt'>): AgencyTour {
  const full: AgencyTour = { ...tour, id: `t-${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
  const next = [full, ...getTours(companyId)];
  saveTours(companyId, next);
  return full;
}
export function removeTour(companyId: string, id: string) {
  saveTours(companyId, getTours(companyId).filter((t) => t.id !== id));
}
export function setTourStatus(companyId: string, id: string, status: AgencyTour['status']) {
  saveTours(companyId, getTours(companyId).map((t) => (t.id === id ? { ...t, status } : t)));
}

export function getProfile(companyId: string, fallbackName = ''): CompanyProfile {
  const raw = read<Partial<CompanyProfile> & { instagram?: string }>(profileKey(companyId), {});
  return {
    companyName: raw.companyName || fallbackName,
    description: raw.description || '',
    phone: raw.phone || '',
    // миграция старого поля instagram → socials
    socials: { ...EMPTY_SOCIALS, ...(raw.socials ?? {}), instagram: raw.socials?.instagram ?? raw.instagram ?? '' },
  };
}
export function saveProfile(companyId: string, profile: CompanyProfile) {
  write(profileKey(companyId), profile);
}
