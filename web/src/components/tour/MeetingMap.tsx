'use client';

import dynamic from 'next/dynamic';

// Leaflet работает только в браузере — отключаем SSR.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-100" />,
});

export function MeetingMap(props: { lat: number; lng: number; label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <LeafletMap {...props} />
    </div>
  );
}
