/** Мелкие строительные блоки интерфейса: клавиши рации, LCD-окошко, форматирование текста. */

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

interface KeyDef {
  main: string;
  sub?: string;
  kind?: 'fn' | 'side' | 'dial' | 'ptt' | 'num';
  say: string;
}

/** Как выглядит каждая кнопка. sub — надпись «второй функции» над кнопкой. */
const KEYS: Record<string, KeyDef> = {
  F: { main: 'F', kind: 'fn', say: 'эф' },
  GM: { main: 'GM', kind: 'fn', say: 'джи эм' },
  MODE: { main: 'MODE', say: 'мод' },
  'HM/RV': { main: 'HM/RV', say: 'хоум реверс' },
  AMS: { main: 'AMS', say: 'а эм эс' },
  BAND: { main: 'BAND', say: 'бэнд' },
  'V/M': { main: 'V/M', say: 'вэ эм' },
  '1': { main: '1', sub: 'TX PO', kind: 'num', say: 'один' },
  '2': { main: '2', sub: 'SCAN', kind: 'num', say: 'два' },
  '3': { main: '3', sub: 'DTMF', kind: 'num', say: 'три' },
  '4': { main: '4', sub: 'STEP', kind: 'num', say: 'четыре' },
  '5': { main: '5', sub: 'SQ TYP', kind: 'num', say: 'пять' },
  '6': { main: '6', sub: 'CODE', kind: 'num', say: 'шесть' },
  '7': { main: '7', sub: 'P1', kind: 'num', say: 'семь' },
  '8': { main: '8', sub: 'P2', kind: 'num', say: 'восемь' },
  '9': { main: '9', sub: 'SKIP', kind: 'num', say: 'девять' },
  '0': { main: '0', sub: 'RPT', kind: 'num', say: 'ноль' },
  PTT: { main: 'PTT', sub: 'сбоку', kind: 'ptt', say: 'пи ти ти' },
  MONI: { main: 'MONI', sub: 'T.CALL · сбоку', kind: 'side', say: 'мони' },
  VOL: { main: 'VOL', sub: 'сбоку', kind: 'side', say: 'вол' },
  POWER: { main: 'PWR', sub: 'LOCK · сбоку', kind: 'side', say: 'питание' },
  DIAL: { main: '⟳', sub: 'ручка DIAL', kind: 'dial', say: 'крути ручку' },
};

export function isKey(k: string) {
  return k in KEYS;
}

/** Одна клавиша. hold:X — «держать», A&B — вместе. */
export function keycap(token: string, big = false): string {
  if (token.includes('&')) {
    return `<span class="combo">${token
      .split('&')
      .map((t) => keycap(t, big))
      .join('<span class="plus" aria-hidden="true">+</span>')}</span>`;
  }
  const hold = token.startsWith('hold:');
  const id = hold ? token.slice(5) : token;
  const d = KEYS[id] ?? { main: id, say: id };
  const cls = ['key', d.kind ? `key-${d.kind}` : '', big ? 'key-big' : '', hold ? 'key-hold' : ''].join(' ');
  const label = `${hold ? 'Держать ' : ''}${id === 'DIAL' ? 'ручку DIAL' : id === 'POWER' ? 'кнопку POWER' : `кнопку ${d.main}`}`;
  return `<span class="${cls}" role="img" aria-label="${esc(label)}"><span class="key-main">${esc(d.main)}</span>${
    d.sub ? `<span class="key-sub">${esc(d.sub)}</span>` : ''
  }${hold ? '<span class="key-holdtag">держать</span>' : ''}</span>`;
}

/** Цепочка нажатий: [F] → [5] → ⟳ → [PTT]. Повторы сворачиваются: [8] ×2 */
export function keysRow(keys: string[], big = true): string {
  const groups: { k: string; n: number }[] = [];
  for (const k of keys) {
    const last = groups[groups.length - 1];
    if (last && last.k === k && /^\d$/.test(k)) last.n++;
    else groups.push({ k, n: 1 });
  }
  return `<div class="keys-row">${groups
    .map((g) => `${keycap(g.k, big)}${g.n > 1 ? `<span class="times">×${g.n}</span>` : ''}`)
    .join('<span class="arrow" aria-hidden="true">→</span>')}</div>`;
}

export function lcd(text: string, big = false): string {
  return `<span class="lcd${big ? ' lcd-big' : ''}" role="img" aria-label="На экране: ${esc(text)}"><span class="lcd-text">${esc(text)}</span></span>`;
}

/** Текст шага: [F] → клавиша, {{SQL 1}} → LCD, **жирный** */
export function rich(text: string): string {
  let s = esc(text);
  s = s.replace(/\{\{(.+?)\}\}/g, (_, t) => lcd(t));
  s = s.replace(/\[([A-Z0-9/]+)\]/g, (m, k) => (isKey(k) ? keycap(k) : m));
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return s;
}

/** Текст для чтения вслух */
export function speakable(text: string): string {
  return text
    .replace(/\{\{(.+?)\}\}/g, (_, t) => `надпись ${t}`)
    .replace(/\[([A-Z0-9/]+)\]/g, (_, k) => `кнопку ${KEYS[k]?.say ?? k}`)
    .replace(/PTT/g, 'пи ти ти')
    .replace(/DIAL/g, 'ручку')
    .replace(/→/g, ', потом ')
    .replace(/−/g, 'минус ');
}

export function stars(n: number) {
  return `<span class="stars" aria-label="Сложность ${n} из 3">${'●'.repeat(n)}${'○'.repeat(3 - n)}</span>`;
}

export function toast(msg: string, ms = 3500) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.classList.add('toast-on'), 10);
  setTimeout(() => {
    el.classList.remove('toast-on');
    setTimeout(() => el.remove(), 400);
  }, ms);
}

/** Своё окно подтверждения — крупное, без системных диалогов */
export function confirmBig(title: string, text: string, yes: string, danger = true): Promise<boolean> {
  return new Promise((res) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${danger ? 'modal-danger' : ''}" role="dialog" aria-modal="true" aria-labelledby="mt">
      <h2 id="mt">${esc(title)}</h2><p>${esc(text)}</p>
      <div class="modal-btns"><button class="btn btn-big ${danger ? 'btn-danger' : 'btn-primary'}" data-y>${esc(yes)}</button>
      <button class="btn btn-big" data-n>Отмена</button></div></div>`;
    document.body.append(wrap);
    const close = (v: boolean) => {
      wrap.remove();
      res(v);
    };
    wrap.querySelector<HTMLButtonElement>('[data-n]')!.focus();
    wrap.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-y]')) close(true);
      else if (t.closest('[data-n]') || t === wrap) close(false);
    });
  });
}
