/**
 * supabase-data.ts — Data-access layer.
 * Tries Supabase first; silently falls back to mock data when unconfigured.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import {
  tours as mockTours,
  destinations as mockDestinations,
  companies as mockCompanies,
  getTourBySlug as getMockTourBySlug,
} from './mock-data';
import type {
  Tour,
  Destination,
  Company,
  Departure,
  DepartureStatus,
  TourType,
  Difficulty,
  GuideLang,
  Currency,
} from './types';

/** Tour with company + destination embedded from a DB join. */
export type TourFull = Tour & {
  _company: Company | null;
  _destination: Destination | null;
};

// ── Mappers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeparture(d: any): Departure {
  return {
    id: d.id,
    tourId: d.tour_id,
    dateStart: d.date_start,
    dateEnd: d.date_end ?? d.date_start,
    seatsTotal: d.seats_total,
    seatsTaken: d.seats_taken,
    minGroupSize: d.min_group_size,
    status: d.status as DepartureStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompany(c: any): Company {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    logoUrl: c.logo_url ?? '',
    description: c.description ?? '',
    phone: c.phone ?? '',
    instagram: c.instagram ?? undefined,
    isVerified: c.is_verified ?? false,
    rating: Number(c.rating ?? 0),
    toursDone: 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDestination(d: any): Destination {
  return {
    id: d.id,
    name: d.name,
    nameEn: d.name_en ?? '',
    slug: d.slug,
    region: d.region ?? '',
    lat: d.lat ?? 0,
    lng: d.lng ?? 0,
    coverUrl: d.cover_url ?? '',
    seasonFrom: d.season_from ?? 1,
    seasonTo: d.season_to ?? 12,
    description: d.description ?? '',
    toursCount: 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTour(row: any): TourFull {
  const media: { url: string; type: 'image' | 'video' }[] = (
    (row.tour_media ?? []) as { url: string; type: string; sort_order: number }[]
  )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((m) => ({ url: m.url, type: (m.type ?? 'image') as 'image' | 'video' }));

  return {
    id: row.id,
    companyId: row.company_id,
    destinationId: row.destination_id,
    title: row.title,
    slug: row.slug,
    type: row.type as TourType,
    difficulty: row.difficulty as Difficulty,
    durationDays: row.duration_days,
    price: Number(row.price),
    priceChild: row.price_child != null ? Number(row.price_child) : undefined,
    currency: (row.currency ?? 'KGS') as Currency,
    guideLangs: (row.guide_langs ?? []) as GuideLang[],
    smallGroup: row.small_group ?? false,
    kidsFriendly: row.kids_friendly ?? false,
    allInclusive: row.all_inclusive ?? false,
    included: (row.included ?? []) as string[],
    excluded: (row.excluded ?? []) as string[],
    program: row.program ?? [],
    packingList: (row.packing_list ?? []) as string[],
    meetingPoint: row.meeting_point ?? '',
    meetingLat: row.meeting_lat ?? 0,
    meetingLng: row.meeting_lng ?? 0,
    gallery: media.length > 0 ? media : [],
    rating: Number(row.rating ?? 0),
    reviewsCount: 0,
    viewsCount: row.views_count ?? 0,
    departures: ((row.departures ?? []) as unknown[]).map(mapDeparture),
    _company: row.companies ? mapCompany(row.companies) : null,
    _destination: row.destinations ? mapDestination(row.destinations) : null,
  };
}

/** Supabase select string — joins company, destination, media, departures. */
const TOUR_SELECT = `
  *,
  companies ( id, name, slug, logo_url, description, phone, instagram, is_verified, rating ),
  destinations ( id, name, name_en, slug, region, lat, lng, cover_url, season_from, season_to, description ),
  tour_media ( id, url, type, sort_order ),
  departures ( id, tour_id, date_start, date_end, seats_total, seats_taken, min_group_size, status )
` as const;

// ── Mock helpers ───────────────────────────────────────────────────────────

function wrapMockTour(t: Tour): TourFull {
  const co = mockCompanies.find((c) => c.id === t.companyId) ?? null;
  const dest = mockDestinations.find((d) => d.id === t.destinationId) ?? null;
  return { ...t, _company: co, _destination: dest };
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Fetch all published tours (Supabase → mock fallback). */
export async function fetchTours(): Promise<TourFull[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockTours.map(wrapMockTour);
  }

  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_SELECT)
    .eq('status', 'published')
    .order('views_count', { ascending: false });

  if (error || !data?.length) {
    if (error) console.warn('[jolu] Supabase fetchTours →', error.message);
    return mockTours.map(wrapMockTour);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(mapTour);
}

/** Fetch a single tour by slug (Supabase → mock fallback). */
export async function fetchTourBySlug(slug: string): Promise<TourFull | null> {
  if (!isSupabaseConfigured || !supabase) {
    const t = getMockTourBySlug(slug);
    return t ? wrapMockTour(t) : null;
  }

  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('[jolu] Supabase fetchTourBySlug →', error.message);
    const t = getMockTourBySlug(slug);
    return t ? wrapMockTour(t) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapTour(data as any);
}

/** Fetch all destinations (Supabase → mock fallback). */
export async function fetchDestinations(): Promise<Destination[]> {
  if (!isSupabaseConfigured || !supabase) return mockDestinations;

  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .order('name');

  if (error || !data?.length) return mockDestinations;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(mapDestination);
}
