// Гео-данные для 3D-глобуса: регионы/точки Кыргызстана.
// lat/lng — реальные координаты; используются и для маркеров на сфере,
// и для «полёта» камеры к точке.

export type SceneMode = 'all' | 'mountains' | 'camping' | 'horse' | 'lakes' | 'video360';

export const MODES: { id: SceneMode; label: string; emoji: string }[] = [
  { id: 'all', label: 'Все', emoji: '🌍' },
  { id: 'mountains', label: 'Горы', emoji: '🏔️' },
  { id: 'lakes', label: 'Озёра', emoji: '🏞️' },
  { id: 'camping', label: 'Кемпинги', emoji: '🏕️' },
  { id: 'horse', label: 'Конные туры', emoji: '🐎' },
  { id: 'video360', label: 'Видео 360°', emoji: '🎥' },
];

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface Hotel {
  name: string;
  priceFrom: number; // сом/ночь
}

export interface Region {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  modes: SceneMode[];
  blurb: string;
  photos: string[];
  video360?: string; // ссылка на 360°-видео (плейсхолдер в MVP)
  tourSlugs: string[]; // маршруты — связь с каталогом
  hotels: Hotel[];
  /** Координата для подписи на глобусе — главный город/въезд */
  isCapital?: boolean;
}

export const KYRGYZSTAN = { lat: 41.4, lng: 74.6 }; // центр страны для фокуса камеры

export const regions: Region[] = [
  {
    id: 'issyk-kul',
    name: 'Иссык-Куль',
    nameEn: 'Issyk-Kul',
    lat: 42.45,
    lng: 77.1,
    modes: ['lakes', 'camping', 'video360'],
    blurb:
      'Второе по величине горное озеро мира на высоте 1607 м. Тёплая вода, пляжи и панорама Тянь-Шаня. Сердце летнего туризма Кыргызстана.',
    photos: [img('photo-1432405972618-c60b0225b8f9'), img('photo-1504280390367-361c6d9f38f4'), img('photo-1506905925346-21bda4d32df4')],
    video360: 'https://www.youtube.com/embed/your-360-id',
    tourSlugs: ['issyk-kul-weekend', 'skazka-day'],
    hotels: [
      { name: 'Raduga Resort', priceFrom: 4500 },
      { name: 'Karven Four Seasons', priceFrom: 7800 },
      { name: 'Гостевой дом «Чайка»', priceFrom: 1800 },
    ],
  },
  {
    id: 'son-kul',
    name: 'Сон-Куль',
    nameEn: 'Son-Kul',
    lat: 41.83,
    lng: 75.12,
    modes: ['lakes', 'horse', 'camping'],
    blurb:
      'Высокогорное озеро на 3016 м. Бескрайние джайлоо, юрточные лагеря, табуны лошадей и одно из самых звёздных небес планеты.',
    photos: [img('photo-1506905925346-21bda4d32df4'), img('photo-1519681393784-d120267933ba'), img('photo-1444930694458-01babf71870c')],
    tourSlugs: ['son-kul-yurts-3d'],
    hotels: [
      { name: 'Юрточный лагерь «Кочевник»', priceFrom: 2500 },
      { name: 'CBT Son-Kul yurt camp', priceFrom: 2000 },
    ],
  },
  {
    id: 'altyn-arashan',
    name: 'Алтын-Арашан',
    nameEn: 'Altyn-Arashan',
    lat: 42.37,
    lng: 78.63,
    modes: ['mountains', 'camping'],
    blurb:
      'Горная долина с термальными источниками на 2600 м. Классика лёгкого треккинга: ели, река, снежные пики и горячие ванны под открытым небом.',
    photos: [img('photo-1454942901704-3c44c11b2ad1'), img('photo-1551632811-561732d1e306')],
    tourSlugs: ['altyn-arashan-2d', 'ala-kul-trek-4d'],
    hotels: [
      { name: 'Arashan Guesthouse', priceFrom: 1500 },
      { name: 'Eco-camp «Altyn»', priceFrom: 2200 },
    ],
  },
  {
    id: 'ala-kul',
    name: 'Ала-Куль',
    nameEn: 'Ala-Kul',
    lat: 42.23,
    lng: 78.95,
    modes: ['mountains', 'lakes'],
    blurb:
      'Бирюзовое ледниковое озеро на 3560 м. Один из самых эффектных треков Тянь-Шаня с перевалом почти 4000 м.',
    photos: [img('photo-1551632811-561732d1e306'), img('photo-1454942901704-3c44c11b2ad1')],
    tourSlugs: ['ala-kul-trek-4d'],
    hotels: [{ name: 'Базовый палаточный лагерь', priceFrom: 1200 }],
  },
  {
    id: 'karakol',
    name: 'Каракол',
    nameEn: 'Karakol',
    lat: 42.49,
    lng: 78.39,
    modes: ['mountains', 'horse', 'video360'],
    blurb:
      'Город-база для приключений: летом — треккинг и конные туры, зимой — горнолыжный курорт. Дунганская мечеть и деревянный православный собор.',
    photos: [img('photo-1518602164578-cd0074062767'), img('photo-1533473359331-0135ef1b58bf')],
    video360: 'https://www.youtube.com/embed/your-360-id',
    tourSlugs: ['engilchek-jeep-5d', 'altyn-arashan-2d'],
    hotels: [
      { name: 'Green Yard Hotel', priceFrom: 3200 },
      { name: 'Matsunoki Hotel', priceFrom: 2800 },
    ],
  },
  {
    id: 'skazka',
    name: 'Каньон Сказка',
    nameEn: 'Skazka Canyon',
    lat: 42.15,
    lng: 77.34,
    modes: ['mountains'],
    blurb:
      'Красно-оранжевые скалы причудливых форм у южного берега Иссык-Куля. Идеальное место для прогулки одного дня и закатных фото.',
    photos: [img('photo-1469474968028-56623f02e42e'), img('photo-1470071459604-3b5ec3a7fe05')],
    tourSlugs: ['skazka-day'],
    hotels: [{ name: 'Гостевые дома Тосора', priceFrom: 1500 }],
  },
  {
    id: 'bishkek',
    name: 'Бишкек',
    nameEn: 'Bishkek',
    lat: 42.87,
    lng: 74.6,
    modes: ['all'],
    isCapital: true,
    blurb:
      'Столица и главные ворота страны. Отсюда стартует большинство туров — аэропорт Манас, прокат снаряжения и встречи групп.',
    photos: [img('photo-1602940659805-770d1b3b9911'), img('photo-1599661046289-e31897846e41')],
    tourSlugs: ['son-kul-yurts-3d', 'issyk-kul-weekend'],
    hotels: [
      { name: 'Plaza Hotel Bishkek', priceFrom: 4200 },
      { name: 'Hostel «Apple»', priceFrom: 900 },
    ],
  },
];

export function regionsForMode(mode: SceneMode): Region[] {
  if (mode === 'all') return regions;
  return regions.filter((r) => r.modes.includes(mode));
}
