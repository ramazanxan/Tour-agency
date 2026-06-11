// Доменные типы платформы Jolu. Зеркалят схему БД (supabase/schema.sql).

export type Currency = 'KGS' | 'USD';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TourType =
  | 'trekking'
  | 'horse'
  | 'jeep'
  | 'camping'
  | 'cultural'
  | 'gastro'
  | 'ski';
export type GuideLang = 'KG' | 'RU' | 'EN';

export type DepartureStatus = 'gathering' | 'confirmed' | 'cancelled';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'prepaid'
  | 'completed'
  | 'cancelled';

export interface Destination {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  region: string;
  lat: number;
  lng: number;
  coverUrl: string;
  seasonFrom: number; // месяц 1-12
  seasonTo: number;
  description: string;
  toursCount: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  phone: string;
  instagram?: string;
  isVerified: boolean;
  rating: number;
  toursDone: number;
}

export interface Departure {
  id: string;
  tourId: string;
  dateStart: string; // ISO
  dateEnd: string;
  seatsTotal: number;
  seatsTaken: number;
  minGroupSize: number;
  status: DepartureStatus;
}

export interface ProgramDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  companyId: string;
  destinationId: string;
  title: string;
  slug: string;
  type: TourType;
  difficulty: Difficulty;
  durationDays: number;
  price: number;
  priceChild?: number;
  currency: Currency;
  guideLangs: GuideLang[];
  smallGroup: boolean;
  kidsFriendly: boolean;
  allInclusive: boolean;
  included: string[];
  excluded: string[];
  program: ProgramDay[];
  packingList: string[];
  meetingPoint: string;
  meetingLat: number;
  meetingLng: number;
  gallery: { url: string; type: 'image' | 'video' }[];
  rating: number;
  reviewsCount: number;
  viewsCount: number;
  departures: Departure[];
}

export const TOUR_TYPE_LABELS: Record<TourType, string> = {
  trekking: '🏔 Треккинг',
  horse: '🐎 Конный',
  jeep: '🚙 Джип-тур',
  camping: '⛺ Кемпинг',
  cultural: '🌍 Культурный',
  gastro: '🍲 Гастро',
  ski: '🎿 Горнолыжный',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};
