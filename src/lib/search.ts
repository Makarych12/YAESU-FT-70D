import { glossary, instructions, menuItems, tips } from './content';

/**
 * Поиск с синонимами. «тон» находит и «субтон», и CTCSS, и TSQL.
 * Русские окончания срезаются грубо: сравниваем основы по первым 5 буквам.
 */
const SYNONYMS: string[][] = [
  ['тон', 'субтон', 'ctcss', 'tone', 'tsql', 'sqtyp', 'sql', 'код', 'code', 'dcs', 'подтон', 'тональный'],
  ['репитер', 'ретранслятор', 'repeater', 'ретранс', 'рептер', 'релейка', 'релейник'],
  ['сдвиг', 'shift', 'offset', 'разнос', 'дуплекс', 'rpt', 'смещение'],
  ['громкость', 'vol', 'volume', 'звук', 'тихо', 'громко'],
  ['шумодав', 'sql', 'squelch', 'шипит', 'шипение', 'шум', 'шумоподавитель'],
  ['блокировка', 'lock', 'замок', 'замочек', 'заблокирован'],
  ['память', 'канал', 'каналы', 'memory', 'ячейка'],
  ['цифра', 'c4fm', 'fusion', 'dn', 'ysf', 'цифровой', 'цифровая', 'фьюжн'],
  ['wires', 'вайрс', 'хотспот', 'hotspot', 'pistar', 'комната', 'узел', 'нода', 'интернет'],
  ['батарея', 'аккумулятор', 'заряд', 'зарядка', 'battery', 'акб', 'питание'],
  ['сброс', 'reset', 'обнулить', 'заводские'],
  ['прошивка', 'firmware', 'обновление', 'обновить', 'версия'],
  ['мощность', 'power', 'ватт', 'txpo', 'дальность'],
  ['позывной', 'callsign', 'mycall', 'позывной'],
  ['скан', 'сканирование', 'поиск', 'scan', 'сканер'],
  ['компьютер', 'пк', 'pc', 'adms', 'chirp', 'usb', 'кабель', 'программирование'],
  ['меню', 'set', 'настройка', 'настройки', 'setup'],
  ['dgid', 'dg-id', 'группа', 'dpid'],
  ['включить', 'включение', 'выключить', 'power', 'питание'],
];

const STOP = new Set(['не', 'на', 'и', 'в', 'с', 'как', 'что', 'а', 'по', 'у', 'я', 'к', 'до', 'за', 'из', 'от', 'или', 'the', 'мне', 'мой', 'моя']);

export function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-яіїєґ0-9.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function stem(w: string) {
  return w.length > 5 ? w.slice(0, Math.max(5, w.length - 3)) : w;
}
function tokens(q: string) {
  return norm(q).split(' ').filter((w) => w && !STOP.has(w));
}
function expand(w: string): string[] {
  const s = new Set([w]);
  const ws = stem(w);
  for (const g of SYNONYMS) if (g.some((x) => x === w || stem(x) === ws || (w.length >= 4 && x.startsWith(w)))) g.forEach((x) => s.add(x));
  return [...s];
}

export interface Hit {
  kind: 'instruction' | 'menu' | 'glossary' | 'tip';
  id: string;
  title: string;
  sub: string;
  href: string;
  score: number;
}

interface Doc {
  hit: Omit<Hit, 'score'>;
  title: string;
  keys: string;
  body: string;
}

let docs: Doc[] | null = null;
function index(): Doc[] {
  if (docs) return docs;
  docs = [
    ...instructions.map((i) => ({
      hit: { kind: 'instruction' as const, id: i.id, title: i.title, sub: i.intro ?? i.steps[0]?.text ?? '', href: `#/i/${i.id}` },
      title: norm(i.title),
      keys: norm(i.keywords.join(' ')),
      body: norm([i.intro, i.warning, ...i.steps.map((s) => `${s.text} ${s.tip ?? ''} ${s.lcd ?? ''}`)].join(' ')),
    })),
    ...menuItems.map((m) => ({
      hit: { kind: 'menu' as const, id: `menu-${m.no}`, title: `Меню ${m.no} ${m.name}`, sub: m.what, href: `#/set/${m.no}` },
      title: norm(`${m.no} ${m.name}`),
      keys: norm(m.name.replace(/[.\-/ ]/g, '')),
      body: norm(`${m.what} ${m.options} ${m.recommend}`),
    })),
    ...glossary.map((g) => ({
      hit: { kind: 'glossary' as const, id: g.term, title: `📖 ${g.term}`, sub: g.text, href: `#/glossary/${encodeURIComponent(g.term)}` },
      title: norm(g.term),
      keys: norm(g.aka ?? ''),
      body: norm(g.text),
    })),
    ...tips.map((tp) => ({
      hit: { kind: 'tip' as const, id: tp.id, title: `💡 ${tp.title}`, sub: tp.text, href: `#/tips/${tp.id}` },
      title: norm(tp.title),
      keys: '',
      body: norm(tp.text),
    })),
  ];
  return docs;
}

function has(text: string, w: string) {
  if (w.length <= 3) return new RegExp(`(^|[\\s.\\-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s.\\-])`).test(text) || text.includes(` ${w}`);
  return text.includes(stem(w));
}

export function search(q: string, limit = 25): Hit[] {
  const qt = tokens(q);
  if (!qt.length) return [];
  const phrase = norm(q);
  const out: Hit[] = [];
  for (const d of index()) {
    let score = 0;
    let matched = 0;
    for (const w of qt) {
      let best = 0;
      for (const [i, x] of expand(w).entries()) {
        const k = i === 0 ? 1 : 0.7;
        if (has(d.title, x)) best = Math.max(best, 10 * k);
        else if (has(d.keys, x)) best = Math.max(best, 8 * k);
        else if (has(d.body, x)) best = Math.max(best, 2 * k);
      }
      if (best) matched++;
      score += best;
    }
    if (!matched) continue;
    if (matched === qt.length) score *= 1.8;
    if (d.title.includes(phrase) || d.keys.includes(phrase)) score += 25;
    if (d.hit.kind === 'instruction') score *= 1.15;
    out.push({ ...d.hit, score });
  }
  out.sort((a, b) => b.score - a.score);
  const top = out[0]?.score ?? 0;
  return out.filter((h) => h.score >= top * 0.3).slice(0, limit);
}
