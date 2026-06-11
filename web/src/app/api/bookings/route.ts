import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface BookingPayload {
  tourSlug: string;
  departureId: string;
  adults: number;
  children: number;
  contactName: string;
  contactPhone: string;
  note?: string;
  totalPrice: number;
}

// Простая валидация телефона КР/СНГ
function validPhone(p: string) {
  return /^\+?[0-9\s\-()]{9,18}$/.test(p);
}

export async function POST(req: Request) {
  let body: BookingPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  if (!body.contactName?.trim() || !validPhone(body.contactPhone ?? '')) {
    return NextResponse.json({ error: 'Укажите имя и корректный телефон' }, { status: 422 });
  }
  if (body.adults < 1) {
    return NextResponse.json({ error: 'Минимум 1 взрослый' }, { status: 422 });
  }

  // Без Supabase — MVP-режим: подтверждаем заявку без записи в БД.
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      ok: true,
      mode: 'mock',
      bookingId: `mock-${Date.now()}`,
      status: 'pending',
      message: 'Заявка принята (демо-режим без БД).',
    });
  }

  // Боевой режим: гость может бронировать без регистрации —
  // аккаунт создаётся автоматически по телефону (ТЗ 4.1).
  const { data: user } = await supabase
    .from('users')
    .upsert(
      { phone: body.contactPhone, name: body.contactName, role: 'tourist' },
      { onConflict: 'phone' }
    )
    .select('id')
    .single();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      departure_id: body.departureId,
      user_id: user?.id ?? null,
      adults: body.adults,
      children: body.children,
      total_price: body.totalPrice,
      status: 'pending',
      contact_name: body.contactName,
      contact_phone: body.contactPhone,
      note: body.note ?? null,
    })
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO(bot): здесь Supabase trigger / Edge Function уведомит компанию в Telegram.
  // Реализовано на стороне бота (bot/) через таблицу bookings.

  return NextResponse.json({ ok: true, mode: 'live', bookingId: booking.id, status: booking.status });
}
