// Гео-данные для 3D-глобуса: страны → места.
// lat/lng — реальные координаты (для маркеров и «полёта» камеры).

export type SceneMode = 'all' | 'mountains' | 'camping' | 'horse' | 'lakes' | 'video360';

export const MODES: { id: SceneMode; label: string; emoji: string }[] = [
  { id: 'all', label: 'Все', emoji: '🌍' },
  { id: 'mountains', label: 'Горы', emoji: '🏔️' },
  { id: 'lakes', label: 'Озёра', emoji: '🏞️' },
  { id: 'camping', label: 'Кемпинги', emoji: '🏕️' },
  { id: 'horse', label: 'Конные', emoji: '🐎' },
  { id: 'video360', label: '360°', emoji: '🎥' },
];

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Проверенный пул изображений (гарантированно грузятся). Демо — заменяется реальными фото.
const P = {
  mtn: img('photo-1454942901704-3c44c11b2ad1'),
  lake: img('photo-1506905925346-21bda4d32df4'),
  lake2: img('photo-1432405972618-c60b0225b8f9'),
  turq: img('photo-1551632811-561732d1e306'),
  canyon: img('photo-1469474968028-56623f02e42e'),
  snow: img('photo-1518602164578-cd0074062767'),
  night: img('photo-1519681393784-d120267933ba'),
  forest: img('photo-1470071459604-3b5ec3a7fe05'),
  camp: img('photo-1504280390367-361c6d9f38f4'),
  offroad: img('photo-1533473359331-0135ef1b58bf'),
  horse: img('photo-1444930694458-01babf71870c'),
  city: img('photo-1602940659805-770d1b3b9911'),
};

export interface Hotel {
  name: string;
  priceFrom: number;
  currency: 'KGS' | 'USD';
}

export interface Place {
  id: string;
  countryId: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  modes: SceneMode[];
  blurb: string;
  photos: string[];
  video360?: string;
  tourSlugs: string[];
  hotels: Hotel[];
}

export interface Country {
  id: string;
  name: string;
  nameEn: string;
  flag: string;
  lat: number; // центр для фокуса камеры
  lng: number;
  accent: string; // hex акцент маркера
  tagline: string;
  regions: Place[];
}

export const countries: Country[] = [
  {
    id: 'kg',
    name: 'Кыргызстан',
    nameEn: 'Kyrgyzstan',
    flag: '🇰🇬',
    lat: 41.4,
    lng: 74.6,
    accent: '#fc5212',
    tagline: 'Небесные горы и кочевая душа',
    regions: [
      { id: 'issyk-kul', countryId: 'kg', name: 'Иссык-Куль', nameEn: 'Issyk-Kul', lat: 42.45, lng: 77.1, modes: ['lakes', 'camping', 'video360'], blurb: 'Второе по величине горное озеро мира на 1607 м. Тёплая вода, пляжи и панорама Тянь-Шаня — сердце летнего туризма.', photos: [P.lake2, P.camp, P.lake], video360: 'https://www.youtube.com/embed/8lsB-P8nGSM', tourSlugs: ['issyk-kul-weekend', 'skazka-day'], hotels: [{ name: 'Raduga Resort', priceFrom: 4500, currency: 'KGS' }, { name: 'Karven Four Seasons', priceFrom: 7800, currency: 'KGS' }] },
      { id: 'son-kul', countryId: 'kg', name: 'Сон-Куль', nameEn: 'Son-Kul', lat: 41.83, lng: 75.12, modes: ['lakes', 'horse', 'camping'], blurb: 'Высокогорное озеро на 3016 м. Джайлоо, юрты, табуны лошадей и одно из самых звёздных небес планеты.', photos: [P.lake, P.night, P.horse], tourSlugs: ['son-kul-yurts-3d'], hotels: [{ name: 'Юрточный лагерь «Кочевник»', priceFrom: 2500, currency: 'KGS' }] },
      { id: 'altyn-arashan', countryId: 'kg', name: 'Алтын-Арашан', nameEn: 'Altyn-Arashan', lat: 42.37, lng: 78.63, modes: ['mountains', 'camping'], blurb: 'Горная долина с термальными источниками на 2600 м. Ели, река, снежные пики и горячие ванны под открытым небом.', photos: [P.mtn, P.turq], tourSlugs: ['altyn-arashan-2d', 'ala-kul-trek-4d'], hotels: [{ name: 'Arashan Guesthouse', priceFrom: 1500, currency: 'KGS' }] },
      { id: 'ala-kul', countryId: 'kg', name: 'Ала-Куль', nameEn: 'Ala-Kul', lat: 42.23, lng: 78.95, modes: ['mountains', 'lakes'], blurb: 'Бирюзовое ледниковое озеро на 3560 м. Один из самых эффектных треков Тянь-Шаня с перевалом почти 4000 м.', photos: [P.turq, P.mtn], tourSlugs: ['ala-kul-trek-4d'], hotels: [{ name: 'Палаточный лагерь', priceFrom: 1200, currency: 'KGS' }] },
      { id: 'karakol', countryId: 'kg', name: 'Каракол', nameEn: 'Karakol', lat: 42.49, lng: 78.39, modes: ['mountains', 'horse', 'video360'], blurb: 'Город-база: летом треккинг и конные туры, зимой — горнолыжный курорт. Дунганская мечеть и деревянный собор.', photos: [P.snow, P.offroad], video360: 'https://www.youtube.com/embed/8lsB-P8nGSM', tourSlugs: ['engilchek-jeep-5d', 'altyn-arashan-2d'], hotels: [{ name: 'Green Yard Hotel', priceFrom: 3200, currency: 'KGS' }] },
      { id: 'skazka', countryId: 'kg', name: 'Каньон Сказка', nameEn: 'Skazka', lat: 42.15, lng: 77.34, modes: ['mountains'], blurb: 'Красно-оранжевые скалы причудливых форм у южного берега Иссык-Куля. Идеально для прогулки одного дня.', photos: [P.canyon, P.forest], tourSlugs: ['skazka-day'], hotels: [{ name: 'Гостевые дома Тосора', priceFrom: 1500, currency: 'KGS' }] },
    ],
  },
  {
    id: 'kz',
    name: 'Казахстан',
    nameEn: 'Kazakhstan',
    flag: '🇰🇿',
    lat: 48.0,
    lng: 67.0,
    accent: '#00b4d8',
    tagline: 'Степь, каньоны и горные озёра',
    regions: [
      { id: 'kz-almaty', countryId: 'kz', name: 'Алматы', nameEn: 'Almaty', lat: 43.24, lng: 76.92, modes: ['mountains', 'video360'], blurb: 'Южная столица у подножия Заилийского Алатау. Каток Медеу, курорт Шымбулак и зелёные проспекты.', photos: [P.city, P.snow], video360: 'https://www.youtube.com/embed/8lsB-P8nGSM', tourSlugs: [], hotels: [{ name: 'Ritz-Carlton Almaty', priceFrom: 180, currency: 'USD' }, { name: 'Hostel Almaty', priceFrom: 15, currency: 'USD' }] },
      { id: 'kz-charyn', countryId: 'kz', name: 'Каньон Чарын', nameEn: 'Charyn Canyon', lat: 43.35, lng: 79.07, modes: ['mountains', 'camping'], blurb: '«Долина замков» — каньон 150–300 м глубиной, который называют младшим братом Гранд-Каньона.', photos: [P.canyon, P.offroad], tourSlugs: [], hotels: [{ name: 'Эко-лагерь Charyn', priceFrom: 30, currency: 'USD' }] },
      { id: 'kz-bigalmaty', countryId: 'kz', name: 'Большое Алматинское озеро', nameEn: 'Big Almaty Lake', lat: 43.05, lng: 76.98, modes: ['lakes', 'mountains'], blurb: 'Бирюзовое горное озеро на 2511 м в окружении трёхтысячников, в часе езды от Алматы.', photos: [P.turq, P.lake2], tourSlugs: [], hotels: [{ name: 'Горный гестхаус', priceFrom: 25, currency: 'USD' }] },
      { id: 'kz-kolsai', countryId: 'kz', name: 'Кольсайские озёра', nameEn: 'Kolsai Lakes', lat: 42.94, lng: 78.32, modes: ['lakes', 'camping', 'horse'], blurb: 'Каскад из трёх горных озёр в Тянь-Шане. Хвойные леса, конные тропы и кристальная вода.', photos: [P.lake, P.forest, P.horse], tourSlugs: [], hotels: [{ name: 'Гостевой дом Саты', priceFrom: 20, currency: 'USD' }] },
    ],
  },
  {
    id: 'uz',
    name: 'Узбекистан',
    nameEn: 'Uzbekistan',
    flag: '🇺🇿',
    lat: 41.4,
    lng: 64.5,
    accent: '#0ea5a4',
    tagline: 'Голубые купола Великого шёлкового пути',
    regions: [
      { id: 'uz-samarkand', countryId: 'uz', name: 'Самарканд', nameEn: 'Samarkand', lat: 39.65, lng: 66.97, modes: ['all', 'video360'], blurb: 'Жемчужина Шёлкового пути: площадь Регистан, мавзолей Гур-Эмир и бирюзовые купола, которым 600 лет.', photos: [P.city, P.canyon], video360: 'https://www.youtube.com/embed/8lsB-P8nGSM', tourSlugs: [], hotels: [{ name: 'Hotel Registan Plaza', priceFrom: 60, currency: 'USD' }, { name: 'Bibikhanum Hotel', priceFrom: 45, currency: 'USD' }] },
      { id: 'uz-bukhara', countryId: 'uz', name: 'Бухара', nameEn: 'Bukhara', lat: 39.77, lng: 64.42, modes: ['all'], blurb: 'Город-музей под открытым небом: более 140 памятников, минарет Калян и торговые купола.', photos: [P.city, P.forest], tourSlugs: [], hotels: [{ name: 'Lyabi House Hotel', priceFrom: 40, currency: 'USD' }] },
      { id: 'uz-khiva', countryId: 'uz', name: 'Хива', nameEn: 'Khiva', lat: 41.38, lng: 60.36, modes: ['all'], blurb: 'Ичан-Кала — сказочный город в крепостных стенах, будто застывший во времени.', photos: [P.canyon, P.city], tourSlugs: [], hotels: [{ name: 'Orient Star Khiva', priceFrom: 50, currency: 'USD' }] },
      { id: 'uz-tashkent', countryId: 'uz', name: 'Ташкент', nameEn: 'Tashkent', lat: 41.31, lng: 69.28, modes: ['all'], blurb: 'Современная столица с метро-дворцами, базаром Чорсу и зелёными бульварами.', photos: [P.city, P.lake2], tourSlugs: [], hotels: [{ name: 'Hyatt Regency Tashkent', priceFrom: 120, currency: 'USD' }] },
    ],
  },
  {
    id: 'tr',
    name: 'Турция',
    nameEn: 'Turkey',
    flag: '🇹🇷',
    lat: 39.0,
    lng: 35.0,
    accent: '#e63946',
    tagline: 'Два континента, море и воздушные шары',
    regions: [
      { id: 'tr-cappadocia', countryId: 'tr', name: 'Каппадокия', nameEn: 'Cappadocia', lat: 38.64, lng: 34.83, modes: ['camping', 'video360'], blurb: 'Лунные долины, пещерные города и сотни воздушных шаров на рассвете — открытка Турции.', photos: [P.canyon, P.camp], video360: 'https://www.youtube.com/embed/8lsB-P8nGSM', tourSlugs: [], hotels: [{ name: 'Cave Suites Cappadocia', priceFrom: 90, currency: 'USD' }, { name: 'Goreme House', priceFrom: 55, currency: 'USD' }] },
      { id: 'tr-istanbul', countryId: 'tr', name: 'Стамбул', nameEn: 'Istanbul', lat: 41.01, lng: 28.98, modes: ['all', 'video360'], blurb: 'Город на двух континентах: Айя-София, Босфор, Гранд-базар и закаты над минаретами.', photos: [P.city, P.lake2], video360: 'https://www.youtube.com/embed/8lsB-P8nGSM', tourSlugs: [], hotels: [{ name: 'Four Seasons Sultanahmet', priceFrom: 250, currency: 'USD' }, { name: 'Sirkeci Mansion', priceFrom: 110, currency: 'USD' }] },
      { id: 'tr-antalya', countryId: 'tr', name: 'Анталия', nameEn: 'Antalya', lat: 36.9, lng: 30.7, modes: ['lakes', 'camping'], blurb: 'Бирюзовое Средиземноморье, водопады Дюден и древний Ликийский путь вдоль побережья.', photos: [P.lake2, P.turq], tourSlugs: [], hotels: [{ name: 'Rixos Downtown Antalya', priceFrom: 130, currency: 'USD' }] },
      { id: 'tr-pamukkale', countryId: 'tr', name: 'Памуккале', nameEn: 'Pamukkale', lat: 37.92, lng: 29.12, modes: ['mountains'], blurb: '«Хлопковый замок» — белоснежные террасы из травертина с тёплой минеральной водой.', photos: [P.snow, P.turq], tourSlugs: [], hotels: [{ name: 'Doga Thermal Spa', priceFrom: 70, currency: 'USD' }] },
    ],
  },
];

// ── helpers ─────────────────────────────────────────────────
export const allPlaces: Place[] = countries.flatMap((c) => c.regions);

export function getCountry(id: string) {
  return countries.find((c) => c.id === id);
}
export function getPlace(id: string) {
  return allPlaces.find((p) => p.id === id);
}
export function regionsForMode(country: Country, mode: SceneMode): Place[] {
  if (mode === 'all') return country.regions;
  return country.regions.filter((r) => r.modes.includes(mode));
}

/** Сопоставить произвольный текст направления с известным местом (для отметок туров компаний на глобусе). */
export function matchPlaceByName(q: string): Place | undefined {
  const s = q.trim().toLowerCase();
  if (!s) return undefined;
  return (
    allPlaces.find((p) => p.name.toLowerCase() === s || p.nameEn.toLowerCase() === s) ||
    allPlaces.find(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        s.includes(p.name.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(s) ||
        s.includes(p.nameEn.toLowerCase())
    )
  );
}
