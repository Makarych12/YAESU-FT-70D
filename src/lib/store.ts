import type { Repeater } from './types';

/** Настройки и данные пользователя. Хранятся в localStorage (фото — в IndexedDB). */
export interface Settings {
  fontScale: 1 | 1.3 | 1.6;
  theme: 'dark' | 'light';
  lang: 'ru' | 'uk';
  stepMode: 'step' | 'list';
  voice: boolean;
}

const KEY = 'ft70d:v1';

interface Data {
  settings: Settings;
  favorites: string[];
  repeaters: Repeater[];
  hiddenBuiltins: string[];
  heroPhoto?: string;
}

const defaults: Data = {
  settings: { fontScale: 1, theme: 'dark', lang: 'ru', stepMode: 'step', voice: true },
  favorites: [],
  repeaters: [],
  hiddenBuiltins: [],
};

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const d = JSON.parse(raw) as Partial<Data>;
    return {
      ...structuredClone(defaults),
      ...d,
      settings: { ...defaults.settings, ...(d.settings ?? {}) },
    };
  } catch {
    return structuredClone(defaults);
  }
}

let data = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* хранилище недоступно — работаем без сохранения */
  }
  listeners.forEach((l) => l());
}

export const store = {
  get settings(): Settings {
    return data.settings;
  },
  setSetting<K extends keyof Settings>(k: K, v: Settings[K]) {
    data.settings[k] = v;
    save();
  },
  onChange(fn: () => void) {
    listeners.add(fn);
  },

  isFav: (id: string) => data.favorites.includes(id),
  toggleFav(id: string) {
    data.favorites = data.favorites.includes(id)
      ? data.favorites.filter((f) => f !== id)
      : [...data.favorites, id];
    save();
    return data.favorites.includes(id);
  },
  get favorites() {
    return data.favorites;
  },

  get userRepeaters() {
    return data.repeaters;
  },
  get hiddenBuiltins() {
    return data.hiddenBuiltins;
  },
  saveRepeater(r: Repeater) {
    const i = data.repeaters.findIndex((x) => x.id === r.id);
    if (i >= 0) data.repeaters[i] = r;
    else data.repeaters.push(r);
    save();
  },
  deleteRepeater(id: string) {
    data.repeaters = data.repeaters.filter((r) => r.id !== id);
    if (!data.hiddenBuiltins.includes(id) && id.match(/^(rb|orl)-/)) data.hiddenBuiltins.push(id);
    save();
  },
  restoreBuiltins() {
    data.hiddenBuiltins = [];
    save();
  },

  get heroPhoto() {
    return data.heroPhoto;
  },
  setHeroPhoto(id: string | undefined) {
    data.heroPhoto = id;
    save();
  },

  exportJson(photos: StoredPhoto[] | null) {
    return JSON.stringify(
      { app: 'ft70d-prosto', version: 1, exported: new Date().toISOString(), ...data, photos: photos ?? undefined },
      null,
      1
    );
  },
  async importJson(text: string) {
    const d = JSON.parse(text);
    if (d.app !== 'ft70d-prosto') throw new Error('Это не файл этого приложения');
    if (d.version !== 1 || !d.settings || typeof d.settings !== 'object' ||
      !Array.isArray(d.favorites) || !d.favorites.every((v: unknown) => typeof v === 'string') ||
      !Array.isArray(d.repeaters) || !d.repeaters.every((r: Repeater) =>
        r && typeof r.id === 'string' && typeof r.name === 'string' &&
        typeof r.freq === 'number' && Number.isFinite(r.freq) &&
        ['-', '+', 'simplex'].includes(r.shiftDir) &&
        typeof r.shift === 'number' && Number.isFinite(r.shift) &&
        ['FM', 'C4FM'].includes(r.mode)) ||
      !Array.isArray(d.hiddenBuiltins) || !d.hiddenBuiltins.every((v: unknown) => typeof v === 'string') ||
      (d.photos !== undefined && (!Array.isArray(d.photos) || !d.photos.every((p: StoredPhoto) =>
        p && typeof p.id === 'string' && typeof p.caption === 'string' &&
        typeof p.data === 'string' && p.data.startsWith('data:image/') && typeof p.added === 'string')))) {
      throw new Error('Файл повреждён или имеет неподдерживаемую версию');
    }
    const imported: Data = {
      settings: { ...defaults.settings, ...(d.settings ?? {}) },
      favorites: d.favorites,
      repeaters: d.repeaters,
      hiddenBuiltins: d.hiddenBuiltins,
      heroPhoto: d.heroPhoto,
    };
    if (Array.isArray(d.photos)) for (const p of d.photos) await photos.put(p);
    data = imported;
    save();
  },
  resetAll() {
    data = structuredClone(defaults);
    save();
  },
};

/* ---------- Фото рации (IndexedDB) ---------- */

export interface StoredPhoto {
  id: string;
  caption: string;
  /** data:image/jpeg;base64,... — уже уменьшенное */
  data: string;
  added: string;
}

const DB = 'ft70d-photos';
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('photos', { keyPath: 'id' });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((res, rej) => {
        const r = fn(d.transaction('photos', mode).objectStore('photos'));
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      })
  );
}

export const photos = {
  all: () => tx<StoredPhoto[]>('readonly', (s) => s.getAll() as IDBRequest<StoredPhoto[]>).catch(() => [] as StoredPhoto[]),
  get: (id: string) => tx<StoredPhoto | undefined>('readonly', (s) => s.get(id) as IDBRequest<StoredPhoto | undefined>).catch(() => undefined),
  put: (p: StoredPhoto) => tx('readwrite', (s) => s.put(p)),
  remove: (id: string) => tx('readwrite', (s) => s.delete(id)),
};

/** Уменьшает фото с камеры до 1600 px, чтобы не забить память телефона */
export function shrinkImage(file: File, max = 1600): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error('Не удалось открыть картинку'));
    };
    img.src = url;
  });
}
