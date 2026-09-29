import type { Page } from '../main';
import { menuItems } from '../lib/content';
import { t } from '../lib/i18n';
import { esc, keysRow } from '../components/ui';

const LIGHT = {
  green: ['light-green', 'Можно смело'],
  yellow: ['light-yellow', 'Только если понимаешь зачем'],
  red: ['light-red', 'Лучше не трогать'],
} as const;

/** Справочник меню SET — все пункты FT-70DE по номерам (Advance Manual стр. 25–42). */
export const setMenuPage: Page = (el, [no]) => {
  let filter: 'all' | 'green' | 'yellow' | 'red' = 'all';
  let q = '';

  const draw = () => {
    const items = menuItems.filter(
      (m) => (filter === 'all' || m.safety === filter) && (!q || `${m.no} ${m.name} ${m.what}`.toLowerCase().includes(q.toLowerCase()))
    );
    el.querySelector('#items')!.innerHTML = items
      .map(
        (m) => `<article class="menu-item" id="m${m.no}">
        <div class="menu-top"><span class="menu-no">${m.no}</span><span class="lcd">${esc(m.name)}</span>
          <span class="light ${LIGHT[m.safety][0]}" role="img" aria-label="${LIGHT[m.safety][1]}"></span>
          <span class="muted" style="font-size:.8rem">${LIGHT[m.safety][1]}</span></div>
        <p>${esc(m.what)}</p>
        <div class="menu-meta">
          <div><b>Варианты</b>${esc(m.options)}</div>
          <div><b>С завода</b>${esc(m.def)}</div>
          <div><b>Советуем</b>${esc(m.recommend)}</div>
          <div><b>Мануал</b>${esc(m.page)}${m.usaNo ? ` · в USA-версии № ${m.usaNo}` : ''}</div>
        </div>
        ${m.note ? `<div class="note note-check"><span class="note-ico">⚠️</span><div>${esc(m.note)}</div></div>` : ''}
      </article>`
      )
      .join('') || `<p>${t('nothingFound')}</p>`;
  };

  el.innerHTML = `<h1>⚙️ Меню SET — все пункты</h1>
    <div class="card">
      <p><strong>Как зайти и поменять любой пункт:</strong></p>
      ${keysRow(['hold:F', 'DIAL', 'F', 'DIAL', 'PTT'])}
      <p class="muted">Держать [F] → ручкой выбрать пункт → [F] → ручкой выбрать значение → PTT (сохранить и выйти). Номера — для европейской FT-70DE.</p>
      <p class="muted">🟢 можно смело · 🟡 только если понимаешь зачем · 🔴 лучше не трогать</p>
    </div>
    <div class="search mt"><label for="mq" class="sr-only">Поиск по меню</label><input id="mq" type="search" placeholder="Номер или слово: 46, тон, батарея…"></div>
    <div class="filter" role="group" aria-label="Фильтр">
      <button class="btn on" data-f="all">Все</button><button class="btn" data-f="green">🟢 Смело</button>
      <button class="btn" data-f="yellow">🟡 Осторожно</button><button class="btn" data-f="red">🔴 Не трогать</button>
    </div>
    <div class="list" id="items"></div>`;

  el.querySelector('#mq')!.addEventListener('input', (e) => {
    q = (e.target as HTMLInputElement).value.trim();
    draw();
  });
  el.querySelector('.filter')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-f]');
    if (!b) return;
    filter = b.dataset.f as typeof filter;
    el.querySelectorAll('.filter .btn').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });
  draw();
  if (no) {
    const it = el.querySelector(`#m${no}`);
    if (it) {
      it.classList.add('hl');
      setTimeout(() => it.scrollIntoView({ block: 'start' }), 50);
    }
  }
};
