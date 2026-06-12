'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import {
  getThread, sendMessage, markRead, type ChatThread, type ChatSender,
} from '@/lib/chatStore';

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({
  viewer,
  load,
}: {
  viewer: ChatSender;
  load: () => ChatThread[];
}) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = () => setThreads(load());

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('jolu-chat', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('jolu-chat', onChange);
      window.removeEventListener('storage', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // выбрать первый тред по умолчанию
  useEffect(() => {
    if (!activeId && threads.length) setActiveId(threads[0].id);
  }, [threads, activeId]);

  const active = useMemo(
    () => (activeId ? threads.find((t) => t.id === activeId) ?? null : null),
    [threads, activeId]
  );

  useEffect(() => {
    if (activeId) markRead(activeId, viewer);
  }, [activeId, viewer, active?.messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages.length, activeId]);

  function send() {
    if (!activeId || !draft.trim()) return;
    sendMessage(activeId, viewer, draft);
    setDraft('');
    setThreads(load());
  }

  const otherName = (t: ChatThread) => (viewer === 'company' ? t.touristName : t.companyName);
  const unread = (t: ChatThread) => t.messages.filter((m) => m.from !== viewer && !m.read).length;

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 py-20 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <MessageSquare size={26} className="text-slate-300" />
        </span>
        <h3 className="font-display text-lg font-bold text-slate-800">Сообщений пока нет</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          {viewer === 'company'
            ? 'Здесь появятся диалоги с туристами по вашим турам.'
            : 'Напишите туркомпании со страницы тура — переписка появится здесь.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[560px] overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm sm:grid-cols-[280px_1fr]">
      {/* Список диалогов */}
      <div className={`flex-col border-r border-slate-100 ${active ? 'hidden sm:flex' : 'flex'}`}>
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="font-display text-sm font-bold text-slate-900">Диалоги</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => {
            const u = unread(t);
            const last = t.messages[t.messages.length - 1];
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors ${
                  activeId === t.id ? 'bg-lake-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lake-500 to-lake-700 text-xs font-bold text-white">
                  {otherName(t).slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{otherName(t)}</span>
                    {u > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sunset-500 px-1.5 text-[11px] font-bold text-white">{u}</span>}
                  </span>
                  {t.tourTitle && <span className="block truncate text-[11px] text-lake-600">{t.tourTitle}</span>}
                  <span className="block truncate text-xs text-slate-400">{last?.text ?? 'Нет сообщений'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Переписка */}
      {active ? (
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <button onClick={() => setActiveId(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 sm:hidden">
              <ArrowLeft size={18} />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-lake-500 to-lake-700 text-xs font-bold text-white">
              {otherName(active).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{otherName(active)}</p>
              {active.tourTitle && <p className="truncate text-xs text-slate-400">{active.tourTitle}</p>}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-4 py-4">
            {active.messages.map((m) => {
              const mine = m.from === viewer;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    mine ? 'rounded-br-md bg-gradient-to-br from-lake-600 to-lake-700 text-white' : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-100'
                  }`}>
                    <p className="leading-relaxed">{m.text}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-slate-400'}`}>{timeLabel(m.at)}</p>
                  </div>
                </div>
              );
            })}
            {active.messages.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-400">Начните диалог — напишите первое сообщение.</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Напишите сообщение…"
              className="h-11 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-lake-400/30 transition focus:border-lake-300 focus:bg-white focus:ring-4"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sunset-500 to-sunset-600 text-white shadow-md transition hover:shadow-lg disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden items-center justify-center text-sm text-slate-400 sm:flex">
          Выберите диалог
        </div>
      )}
    </div>
  );
}
