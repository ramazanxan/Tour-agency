import type { Company, Departure, Destination, Tour } from './types';

// Unsplash используется только для демо-визуала. В проде — Supabase Storage.
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const destinations: Destination[] = [
  {
    id: 'd-altyn-arashan',
    name: 'Алтын-Арашан',
    nameEn: 'Altyn-Arashan',
    slug: 'altyn-arashan',
    region: 'Иссык-Кульская обл.',
    lat: 42.3686,
    lng: 78.6322,
    coverUrl: img('photo-1454942901704-3c44c11b2ad1'),
    seasonFrom: 6,
    seasonTo: 9,
    description:
      'Горная долина с термальными источниками на высоте 2600 м. Классика лёгкого треккинга у Каракола.',
    toursCount: 6,
  },
  {
    id: 'd-son-kul',
    name: 'Сон-Куль',
    nameEn: 'Son-Kul',
    slug: 'son-kul',
    region: 'Нарынская обл.',
    lat: 41.8333,
    lng: 75.1167,
    coverUrl: img('photo-1506905925346-21bda4d32df4'),
    seasonFrom: 6,
    seasonTo: 9,
    description:
      'Высокогорное озеро на 3016 м, юрточные лагеря, бескрайние джайлоо и звёздное небо.',
    toursCount: 9,
  },
  {
    id: 'd-skazka',
    name: 'Сказка (каньон)',
    nameEn: 'Skazka Canyon',
    slug: 'skazka',
    region: 'Иссык-Кульская обл.',
    lat: 42.1525,
    lng: 77.3392,
    coverUrl: img('photo-1469474968028-56623f02e42e'),
    seasonFrom: 4,
    seasonTo: 10,
    description:
      'Красно-оранжевые скалы у южного берега Иссык-Куля. Идеально на один день.',
    toursCount: 4,
  },
  {
    id: 'd-issyk-kul',
    name: 'Иссык-Куль',
    nameEn: 'Issyk-Kul',
    slug: 'issyk-kul',
    region: 'Иссык-Кульская обл.',
    lat: 42.45,
    lng: 77.1,
    coverUrl: img('photo-1432405972618-c60b0225b8f9'),
    seasonFrom: 5,
    seasonTo: 9,
    description:
      'Второе по величине горное озеро мира. Пляжи, базы отдыха и виды на Тянь-Шань.',
    toursCount: 12,
  },
  {
    id: 'd-ala-kul',
    name: 'Ала-Куль',
    nameEn: 'Ala-Kul',
    slug: 'ala-kul',
    region: 'Иссык-Кульская обл.',
    lat: 42.2333,
    lng: 78.95,
    coverUrl: img('photo-1551632811-561732d1e306'),
    seasonFrom: 7,
    seasonTo: 9,
    description:
      'Бирюзовое ледниковое озеро на 3560 м. Один из самых эффектных треков Кыргызстана.',
    toursCount: 5,
  },
  {
    id: 'd-karakol',
    name: 'Каракол',
    nameEn: 'Karakol',
    slug: 'karakol',
    region: 'Иссык-Кульская обл.',
    lat: 42.4907,
    lng: 78.3936,
    coverUrl: img('photo-1518602164578-cd0074062767'),
    seasonFrom: 1,
    seasonTo: 12,
    description:
      'Город-база для треккинга летом и горнолыжный курорт зимой.',
    toursCount: 8,
  },
];

export const companies: Company[] = [
  {
    id: 'c-jolu-travel',
    name: 'Jol Travel',
    slug: 'jol-travel',
    logoUrl: img('photo-1502920917128-1aa500764cbd', 200),
    description:
      'Команда гидов из Каракола. 7 лет водим группы по Тянь-Шаню. Маленькие группы, акцент на безопасности.',
    phone: '+996 700 123 456',
    instagram: 'jol.travel.kg',
    isVerified: true,
    rating: 4.9,
    toursDone: 312,
  },
  {
    id: 'c-nomad-trek',
    name: 'Nomad Trek',
    slug: 'nomad-trek',
    logoUrl: img('photo-1519681393784-d120267933ba', 200),
    description:
      'Этно- и конные туры с ночёвками в юртах. Работаем с местными чабанами.',
    phone: '+996 555 987 654',
    instagram: 'nomad.trek',
    isVerified: true,
    rating: 4.8,
    toursDone: 198,
  },
  {
    id: 'c-tianshan-jeep',
    name: 'TianShan Jeep',
    slug: 'tianshan-jeep',
    logoUrl: img('photo-1533473359331-0135ef1b58bf', 200),
    description:
      'Внедорожные туры на подготовленных 4x4. Сложные перевалы и труднодоступные озёра.',
    phone: '+996 770 222 333',
    instagram: 'tianshan.jeep',
    isVerified: false,
    rating: 4.6,
    toursDone: 74,
  },
];

// Генератор дат выезда от "сегодня" — чтобы демо всегда было актуальным.
function genDepartures(
  tourId: string,
  offsets: { inDays: number; len: number; total: number; taken: number; min: number }[]
): Departure[] {
  return offsets.map((o, i) => {
    const start = new Date();
    start.setDate(start.getDate() + o.inDays);
    const end = new Date(start);
    end.setDate(end.getDate() + o.len);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return {
      id: `${tourId}-dep-${i}`,
      tourId,
      dateStart: iso(start),
      dateEnd: iso(end),
      seatsTotal: o.total,
      seatsTaken: o.taken,
      minGroupSize: o.min,
      status: o.taken >= o.min ? 'confirmed' : 'gathering',
    };
  });
}

export const tours: Tour[] = [
  {
    id: 't-altyn-arashan-2d',
    companyId: 'c-jolu-travel',
    destinationId: 'd-altyn-arashan',
    title: 'Алтын-Арашан: тёплые источники в горах',
    slug: 'altyn-arashan-2d',
    type: 'trekking',
    difficulty: 'easy',
    durationDays: 2,
    price: 4500,
    priceChild: 3000,
    currency: 'KGS',
    guideLangs: ['RU', 'KG', 'EN'],
    smallGroup: true,
    kidsFriendly: true,
    allInclusive: true,
    included: ['Трансфер из Каракола', 'Гид', 'Питание', 'Ночёвка в гестхаусе', 'Купание в источниках'],
    excluded: ['Личная страховка', 'Алкоголь', 'Сувениры'],
    program: [
      { day: 1, title: 'Каракол → Алтын-Арашан', description: 'Заброска на 4x4, лёгкий треккинг по долине, термальные источники под вечер.' },
      { day: 2, title: 'Долина и возвращение', description: 'Утренний выход к смотровой, обед, спуск и трансфер обратно.' },
    ],
    packingList: ['Трекинговая обувь', 'Тёплая куртка', 'Купальник', 'Дождевик', 'Бутылка для воды'],
    meetingPoint: 'Каракол, центральная площадь',
    meetingLat: 42.4907,
    meetingLng: 78.3936,
    gallery: [
      { url: img('photo-1454942901704-3c44c11b2ad1'), type: 'image' },
      { url: img('photo-1551632811-561732d1e306'), type: 'image' },
      { url: img('photo-1506905925346-21bda4d32df4'), type: 'image' },
    ],
    rating: 4.9,
    reviewsCount: 47,
    viewsCount: 1840,
    departures: genDepartures('t-altyn-arashan-2d', [
      { inDays: 4, len: 1, total: 8, taken: 5, min: 6 },
      { inDays: 11, len: 1, total: 8, taken: 2, min: 6 },
      { inDays: 18, len: 1, total: 8, taken: 8, min: 6 },
    ]),
  },
  {
    id: 't-son-kul-yurts-3d',
    companyId: 'c-nomad-trek',
    destinationId: 'd-son-kul',
    title: 'Сон-Куль: 3 дня в юрте на джайлоо',
    slug: 'son-kul-yurts-3d',
    type: 'horse',
    difficulty: 'medium',
    durationDays: 3,
    price: 11500,
    priceChild: 8000,
    currency: 'KGS',
    guideLangs: ['RU', 'KG'],
    smallGroup: true,
    kidsFriendly: true,
    allInclusive: true,
    included: ['Трансфер из Бишкека', 'Конная прогулка', 'Юрта 2 ночи', 'Питание', 'Гид'],
    excluded: ['Перелёт', 'Доп. экскурсии', 'Чаевые'],
    program: [
      { day: 1, title: 'Бишкек → Сон-Куль', description: 'Переезд через перевал Калмак-Ашуу, заселение в юрточный лагерь, закат у озера.' },
      { day: 2, title: 'Конный день', description: 'Конная прогулка по джайлоо, знакомство с бытом чабанов, ужин у костра.' },
      { day: 3, title: 'Озеро и возвращение', description: 'Утро у воды, дорога обратно с остановками на фото.' },
    ],
    packingList: ['Очень тёплые вещи', 'Шапка и перчатки', 'Солнцезащитный крем', 'Налобный фонарь', 'Powerbank'],
    meetingPoint: 'Бишкек, Ала-Тоо площадь',
    meetingLat: 42.8746,
    meetingLng: 74.6122,
    gallery: [
      { url: img('photo-1506905925346-21bda4d32df4'), type: 'image' },
      { url: img('photo-1519681393784-d120267933ba'), type: 'image' },
      { url: img('photo-1444930694458-01babf71870c'), type: 'image' },
    ],
    rating: 4.8,
    reviewsCount: 63,
    viewsCount: 2570,
    departures: genDepartures('t-son-kul-yurts-3d', [
      { inDays: 6, len: 2, total: 10, taken: 7, min: 8 },
      { inDays: 13, len: 2, total: 10, taken: 4, min: 8 },
      { inDays: 27, len: 2, total: 10, taken: 1, min: 8 },
    ]),
  },
  {
    id: 't-skazka-day',
    companyId: 'c-jolu-travel',
    destinationId: 'd-skazka',
    title: 'Каньон Сказка: тур одного дня',
    slug: 'skazka-day',
    type: 'jeep',
    difficulty: 'easy',
    durationDays: 1,
    price: 2500,
    priceChild: 1500,
    currency: 'KGS',
    guideLangs: ['RU', 'KG', 'EN'],
    smallGroup: false,
    kidsFriendly: true,
    allInclusive: false,
    included: ['Трансфер', 'Гид', 'Вода'],
    excluded: ['Обед', 'Входные билеты'],
    program: [
      { day: 1, title: 'Сказочный каньон', description: 'Выезд утром, прогулка по красным скалам, виды на Иссык-Куль, возвращение к вечеру.' },
    ],
    packingList: ['Удобная обувь', 'Кепка', 'Вода', 'Перекус'],
    meetingPoint: 'Бостери, у въезда',
    meetingLat: 42.6411,
    meetingLng: 77.3392,
    gallery: [
      { url: img('photo-1469474968028-56623f02e42e'), type: 'image' },
      { url: img('photo-1470071459604-3b5ec3a7fe05'), type: 'image' },
    ],
    rating: 4.7,
    reviewsCount: 29,
    viewsCount: 980,
    departures: genDepartures('t-skazka-day', [
      { inDays: 2, len: 0, total: 14, taken: 9, min: 4 },
      { inDays: 5, len: 0, total: 14, taken: 3, min: 4 },
      { inDays: 9, len: 0, total: 14, taken: 12, min: 4 },
    ]),
  },
  {
    id: 't-ala-kul-trek-4d',
    companyId: 'c-jolu-travel',
    destinationId: 'd-ala-kul',
    title: 'Ала-Куль: трек к бирюзовому озеру',
    slug: 'ala-kul-trek-4d',
    type: 'trekking',
    difficulty: 'hard',
    durationDays: 4,
    price: 16800,
    currency: 'KGS',
    guideLangs: ['RU', 'EN'],
    smallGroup: true,
    kidsFriendly: false,
    allInclusive: true,
    included: ['Гид', 'Палатки и снаряжение', 'Питание', 'Трансферы', 'Купание в Алтын-Арашан'],
    excluded: ['Спальник (аренда +500 сом)', 'Страховка'],
    program: [
      { day: 1, title: 'Каракол → ущелье Каракол', description: 'Заброска, треккинг до базового лагеря, ночь в палатках.' },
      { day: 2, title: 'Перевал Ала-Куль (3900 м)', description: 'Подъём к озеру Ала-Куль, перевал, спуск к термальным источникам.' },
      { day: 3, title: 'Алтын-Арашан', description: 'Восстановление в источниках, лёгкий день.' },
      { day: 4, title: 'Спуск и возвращение', description: 'Спуск к дороге, трансфер в Каракол.' },
    ],
    packingList: ['Трекинговые ботинки', 'Тёплый спальник', 'Мембранная куртка', 'Трекинговые палки', 'Аптечка'],
    meetingPoint: 'Каракол, офис компании',
    meetingLat: 42.4907,
    meetingLng: 78.3936,
    gallery: [
      { url: img('photo-1551632811-561732d1e306'), type: 'image' },
      { url: img('photo-1454942901704-3c44c11b2ad1'), type: 'image' },
    ],
    rating: 4.95,
    reviewsCount: 38,
    viewsCount: 2100,
    departures: genDepartures('t-ala-kul-trek-4d', [
      { inDays: 9, len: 3, total: 8, taken: 6, min: 4 },
      { inDays: 23, len: 3, total: 8, taken: 2, min: 4 },
    ]),
  },
  {
    id: 't-issyk-kul-weekend',
    companyId: 'c-nomad-trek',
    destinationId: 'd-issyk-kul',
    title: 'Иссык-Куль: выходные на южном берегу',
    slug: 'issyk-kul-weekend',
    type: 'camping',
    difficulty: 'easy',
    durationDays: 2,
    price: 5900,
    priceChild: 3500,
    currency: 'KGS',
    guideLangs: ['RU', 'KG'],
    smallGroup: false,
    kidsFriendly: true,
    allInclusive: true,
    included: ['Трансфер из Бишкека', 'Кемпинг у воды', 'Питание', 'Прогулка к Сказке'],
    excluded: ['Алкоголь', 'Аренда SUP'],
    program: [
      { day: 1, title: 'Бишкек → южный берег', description: 'Переезд, установка лагеря, купание, ужин у костра.' },
      { day: 2, title: 'Сказка и пляж', description: 'Утренний выезд в каньон Сказка, отдых на пляже, возвращение.' },
    ],
    packingList: ['Купальник', 'Полотенце', 'Палатка (или аренда)', 'Крем от солнца'],
    meetingPoint: 'Бишкек, Ала-Тоо площадь',
    meetingLat: 42.8746,
    meetingLng: 74.6122,
    gallery: [
      { url: img('photo-1432405972618-c60b0225b8f9'), type: 'image' },
      { url: img('photo-1504280390367-361c6d9f38f4'), type: 'image' },
    ],
    rating: 4.6,
    reviewsCount: 51,
    viewsCount: 3120,
    departures: genDepartures('t-issyk-kul-weekend', [
      { inDays: 3, len: 1, total: 16, taken: 11, min: 6 },
      { inDays: 10, len: 1, total: 16, taken: 5, min: 6 },
      { inDays: 17, len: 1, total: 16, taken: 2, min: 6 },
    ]),
  },
  {
    id: 't-engilchek-jeep-5d',
    companyId: 'c-tianshan-jeep',
    destinationId: 'd-karakol',
    title: 'Джип-тур к языкам ледника Энгильчек',
    slug: 'engilchek-jeep-5d',
    type: 'jeep',
    difficulty: 'hard',
    durationDays: 5,
    price: 32000,
    currency: 'KGS',
    guideLangs: ['RU', 'EN'],
    smallGroup: true,
    kidsFriendly: false,
    allInclusive: true,
    included: ['4x4 с водителем', 'Гид', 'Питание', 'Палатки', 'Пермиты в погранзону'],
    excluded: ['Личное снаряжение', 'Страховка', 'Вертолёт (опционально)'],
    program: [
      { day: 1, title: 'Каракол → Сары-Джаз', description: 'Длинный переезд через перевалы, ночь в палатках.' },
      { day: 2, title: 'Долина Иныльчек', description: 'Движение к леднику по бездорожью.' },
      { day: 3, title: 'Ледник Энгильчек', description: 'Радиальный выход к языку ледника, виды на пик Хан-Тенгри.' },
      { day: 4, title: 'Озеро Мерцбахера', description: 'Поездка к загадочному исчезающему озеру.' },
      { day: 5, title: 'Возвращение', description: 'Дорога обратно в Каракол.' },
    ],
    packingList: ['Экспедиционная одежда', 'Спальник до -10', 'Солнечные очки', 'Документы для погранзоны'],
    meetingPoint: 'Каракол, офис TianShan Jeep',
    meetingLat: 42.4907,
    meetingLng: 78.3936,
    gallery: [
      { url: img('photo-1533473359331-0135ef1b58bf'), type: 'image' },
      { url: img('photo-1518602164578-cd0074062767'), type: 'image' },
    ],
    rating: 4.85,
    reviewsCount: 17,
    viewsCount: 1320,
    departures: genDepartures('t-engilchek-jeep-5d', [
      { inDays: 14, len: 4, total: 6, taken: 3, min: 4 },
      { inDays: 35, len: 4, total: 6, taken: 1, min: 4 },
    ]),
  },
];

// ── Хелперы доступа (заменяются запросами к Supabase при наличии env) ──

export function getTourBySlug(slug: string) {
  return tours.find((t) => t.slug === slug);
}

export function getCompany(id: string) {
  return companies.find((c) => c.id === id);
}

export function getDestination(id: string) {
  return destinations.find((d) => d.id === id);
}

export function getDestinationBySlug(slug: string) {
  return destinations.find((d) => d.slug === slug);
}

export function getSimilarTours(tour: Tour, limit = 3) {
  return tours
    .filter((t) => t.id !== tour.id && (t.type === tour.type || t.destinationId === tour.destinationId))
    .slice(0, limit);
}

/** Ближайший выезд тура (для бейджей и сортировки) */
export function nextDeparture(tour: Tour): Departure | undefined {
  const future = tour.departures
    .filter((d) => new Date(d.dateStart).getTime() >= Date.now() && d.status !== 'cancelled')
    .sort((a, b) => +new Date(a.dateStart) - +new Date(b.dateStart));
  return future[0];
}
