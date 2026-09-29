import type { Page } from '../main';
import { sections } from '../lib/content';
import { store, photos } from '../lib/store';
import { t } from '../lib/i18n';
import { esc } from '../components/ui';
import commonsPhoto from '../assets/ft70de-commons-hensys1.jpg';

/** Главный экран: поиск, 9 огромных плиток, «Ещё», тема и шрифт. */
export const homePage: Page = (el) => {
  const S = Object.fromEntries(sections().map((s) => [s.id, s]));
  const tile = (href: string, icon: string, title: string, desc: string, cls = '') =>
    `<a class="tile ${cls}" href="${href}"><span class="tile-ico" aria-hidden="true">${icon}</span>
      <span><span class="tile-t">${esc(title)}</span><span class="tile-d">${esc(desc)}</span></span></a>`;

  const main = [
    tile('#/s/first', '📻', S.first.short, 'Позывной, громкость, мощность — за 5 минут', 'tile-main'),
    tile('#/s/repeater', '🔁', S.repeater.short, 'Сдвиг, субтон, выход в эфир', 'tile-main'),
    tile('#/s/memory', '💾', S.memory.short, 'Записать, назвать, удалить', 'tile-main'),
    tile('#/s/digital', '🟦', S.digital.short, 'C4FM / Fusion, DG-ID', 'tile-main'),
    tile('#/s/wires', '🌐', S.wires.short, 'Интернет-комнаты и хотспот', 'tile-main'),
    tile('#/s/scan', '🔍', S.scan.short, 'Поиск станций', 'tile-main'),
    tile('#/s/battery', '🔋', S.battery.short, 'Зарядка и уход', 'tile-main'),
    tile('#/set', '⚙️', S.setmenu.short, 'Меню SET — все 63 пункта', 'tile-main'),
    tile('#/s/help', '🆘', S.help.short, 'Симптом → что сделать', 'tile-main tile-help'),
  ].join('');

  const more = [
    tile('#/rpt', '📶', t('myRepeaters'), 'Список и настройка по шагам'),
    tile('#/wizard', '🧮', t('wizard'), 'Ввёл частоту — получил шаги'),
    tile('#/radio', '🗺️', t('radio'), 'Нажми на кнопку — узнаешь, что она делает'),
    tile('#/cheat', '📋', t('cheat'), 'Самое главное на одном листе'),
    tile('#/fav', '⭐', t('favs'), 'Отмеченные звёздочкой'),
    tile('#/s/intro', '👋', S.intro.short, 'Кнопки, громкость, замочек'),
    tile('#/s/freq', '📡', S.freq.short, 'Ввод частоты, FM и цифра'),
    tile('#/display', '🔤', t('display'), 'Что значит надпись на экране'),
    tile('#/glossary', '📖', t('glossary'), 'CTCSS, DCS, сдвиг… простыми словами'),
    tile('#/tips', '💡', t('tips'), 'Советы с форумов'),
    tile('#/s/firmware', '🧩', S.firmware.short, 'Версия и обновление'),
    tile('#/photos', '📷', t('photos'), 'Свои снимки — фоном и в карточках'),
    tile('#/settings', '🛠️', t('settings'), 'Экспорт, язык, голос'),
    tile('#/sources', '📚', t('sources'), 'Мануалы и форумы'),
  ].join('');

  const s = store.settings;
  el.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <h1>FT-70D — <span>просто</span> и понятно</h1>
        <p>Пошаговая инструкция для Yaesu FT-70DE. Работает без интернета.</p>
        <span class="lcd lcd-big hero-call" aria-label="Позывной UR4MAD">UR4MAD</span>
      </div>
      <div class="hero-photo"><img id="hero-img" src="${commonsPhoto}" alt="Рация Yaesu FT-70DE" width="250" height="532">
        <span class="credit" id="hero-credit">Фото: Hensys1, CC BY-SA 4.0</span></div>
    </section>

    <form class="search" role="search" id="search">
      <label for="q" class="sr-only">Поиск</label>
      <input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(t('search'))}">
      <button class="btn btn-primary" aria-label="${t('searchBtn')}">🔎</button>
    </form>

    <nav class="tiles" aria-label="Разделы">${main}</nav>

    <h2 class="home-h">${t('more')}</h2>
    <nav class="tiles tiles-small" aria-label="Ещё">${more}</nav>

    <div class="prefs">
      <div class="pref"><div class="pref-t">🌗 Тема</div><div class="seg">
        <button class="btn ${s.theme === 'dark' ? 'on' : ''}" data-theme-set="dark" aria-pressed="${s.theme === 'dark'}">🌙 Тёмная</button>
        <button class="btn ${s.theme === 'light' ? 'on' : ''}" data-theme-set="light" aria-pressed="${s.theme === 'light'}">☀️ Светлая</button></div></div>
      <div class="pref"><div class="pref-t">🔠 ${t('font')}</div><div class="seg">
        ${([
          [1, t('fontBig')],
          [1.3, t('fontVery')],
          [1.6, t('fontHuge')],
        ] as const)
          .map(([v, l]) => `<button class="btn ${s.fontScale === v ? 'on' : ''}" data-font="${v}" aria-pressed="${s.fontScale === v}">${l}</button>`)
          .join('')}
      </div></div>
    </div>`;

  el.querySelector('#search')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (el.querySelector('#q') as HTMLInputElement).value.trim();
    if (q) location.hash = `#/search/${encodeURIComponent(q)}`;
  });
  el.onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-theme-set],[data-font]');
    if (!b) return;
    if (b.dataset.themeSet) store.setSetting('theme', b.dataset.themeSet as 'dark' | 'light');
    if (b.dataset.font) store.setSetting('fontScale', +b.dataset.font as 1 | 1.3 | 1.6);
    homePage(el, []);
  };

  // своё фото на главном экране, если выбрано
  const hid = store.heroPhoto;
  if (hid)
    photos.get(hid).then((p) => {
      if (!p) return;
      const img = el.querySelector<HTMLImageElement>('#hero-img');
      const credit = el.querySelector<HTMLElement>('#hero-credit');
      if (!img || !credit) return;
      img.src = p.data;
      credit.textContent = p.caption || 'Моё фото';
    });
};
