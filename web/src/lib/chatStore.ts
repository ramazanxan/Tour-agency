'use client';

// Локальное хранилище чата турист ↔ компания (прототип; в проде — таблица messages + realtime).

export type ChatSender = 'tourist' | 'company';

export interface ChatMessage {
  id: string;
  from: ChatSender;
  text: string;
  at: string; // ISO
  read?: boolean;
}

export interface ChatThread {
  id: string;            // `${companyId}__${touristLogin}`
  companyId: string;
  companyName: string;
  touristLogin: string;
  touristName: string;
  tourTitle?: string;    // контекст: о каком туре
  messages: ChatMessage[];
  updatedAt: string;
}

const KEY = 'jolu.chat.threads';

function read(): ChatThread[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChatThread[]) : [];
  } catch {
    return [];
  }
}
function write(threads: ChatThread[]) {
  try { localStorage.setItem(KEY, JSON.stringify(threads)); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event('jolu-chat')); } catch { /* ignore */ }
}

const threadId = (companyId: string, touristLogin: string) => `${companyId}__${touristLogin}`;
const uid = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function getThreads(): ChatThread[] {
  return read().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}
export function getThreadsForCompany(companyId: string) {
  return getThreads().filter((t) => t.companyId === companyId);
}
export function getThreadsForTourist(login: string) {
  return getThreads().filter((t) => t.touristLogin === login);
}
export function getThread(id: string) {
  return read().find((t) => t.id === id) ?? null;
}

export function ensureThread(meta: {
  companyId: string; companyName: string; touristLogin: string; touristName: string; tourTitle?: string;
}): ChatThread {
  const id = threadId(meta.companyId, meta.touristLogin);
  const all = read();
  let t = all.find((x) => x.id === id);
  if (!t) {
    t = {
      id, companyId: meta.companyId, companyName: meta.companyName,
      touristLogin: meta.touristLogin, touristName: meta.touristName,
      tourTitle: meta.tourTitle, messages: [], updatedAt: new Date().toISOString(),
    };
    all.push(t);
    write(all);
  } else if (meta.tourTitle && !t.tourTitle) {
    t.tourTitle = meta.tourTitle;
    write(all);
  }
  return t;
}

export function sendMessage(id: string, from: ChatSender, text: string) {
  const body = text.trim();
  if (!body) return;
  const all = read();
  const t = all.find((x) => x.id === id);
  if (!t) return;
  t.messages.push({ id: uid(), from, text: body, at: new Date().toISOString(), read: false });
  t.updatedAt = new Date().toISOString();
  write(all);
}

export function markRead(id: string, viewer: ChatSender) {
  const all = read();
  const t = all.find((x) => x.id === id);
  if (!t) return;
  let changed = false;
  t.messages.forEach((m) => { if (m.from !== viewer && !m.read) { m.read = true; changed = true; } });
  if (changed) write(all);
}

export function unreadFor(threadList: ChatThread[], viewer: ChatSender) {
  return threadList.reduce(
    (n, t) => n + t.messages.filter((m) => m.from !== viewer && !m.read).length,
    0
  );
}

// Демо-диалог, чтобы кабинеты не были пустыми при первом заходе.
export function seedDemoChat(companyId: string, companyName: string) {
  const all = read();
  if (all.some((t) => t.companyId === companyId)) return;
  const now = Date.now();
  const id = threadId(companyId, 'aibek');
  all.push({
    id, companyId, companyName,
    touristLogin: 'aibek', touristName: 'Айбек',
    tourTitle: 'Сон-Куль: 3 дня в юрте',
    updatedAt: new Date(now - 6 * 60000).toISOString(),
    messages: [
      { id: uid(), from: 'tourist', text: 'Здравствуйте! Есть ли места на выезд в эти выходные?', at: new Date(now - 20 * 60000).toISOString(), read: true },
      { id: uid(), from: 'company', text: 'Добрый день! Да, осталось 4 места. Бронируем?', at: new Date(now - 12 * 60000).toISOString(), read: true },
      { id: uid(), from: 'tourist', text: 'Отлично, а питание входит?', at: new Date(now - 6 * 60000).toISOString(), read: false },
    ],
  });
  write(all);
}
