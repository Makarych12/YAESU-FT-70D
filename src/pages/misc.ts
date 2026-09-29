import type { Page } from '../main';
import { cheatsheet, getInstruction, glossary, tips } from '../lib/content';
import { search } from '../lib/search';
import { photos, shrinkImage, store } from '../lib/store';
import { t } from '../lib/i18n';
import { confirmBig, esc, keysRow, toast } from '../components/ui';
import { speech } from '../components/speech';
import { insRow } from './section';

export const searchPage: Page = (el, [q0 = '']) => {
  el.innerHTML = `<h1>🔎 Поиск</h1>
    <form class="search" role="search" id="sf"><label for="q" class="sr-only">Поиск</label>
      <input id="q" type="search" enterkeyhint="search" value="${esc(q0)}" placeholder="${esc(t('search'))}"><button class="btn btn-primary" aria-label="${t('searchBtn')}">🔎</button></form>
    <div id="res" aria-live="polite"></div>`;
  const input = el.querySelector<HTMLInputElement>('#q')!;
  const run = () => {
    const q = input.value.trim();
    const hits = search(q);
    el.querySelector('#res')!.innerHTML = !q
      ? '<p class="muted">Например: <b>тон</b>, <b>субтон</b>, <b>ctcss</b>, <b>репитер не открывается</b>, <b>громкость</b>.</p>'
      : hits.length
        ? `<p class="muted">${t('found')}: ${hits.length}</p><div class="list">${hits
            .map((h) => `<a class="row" href="${h.href}"><span><span class="row-t">${esc(h.title)}</span><span class="row-d">${esc(h.sub.replace(/\[|\]|\{\{|\}\}/g, ''))}</span></span><span class="row-go">›</span></a>`)
            .join('')}</div>`
        : `<p>${t('nothingFound')}</p>`;
  };
  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(run, 200);
  });
  el.querySelector('#sf')!.addEventListener('submit', (e) => {
    e.preventDefault();
    history.replaceState(null, '', `#/search/${encodeURIComponent(input.value.trim())}`);
    run();
    input.blur();
  });
  run();
  if (!q0) input.focus();
};

export const glossaryPage: Page = (el, [term]) => {
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term, 'ru'));
  el.innerHTML = `<h1>📖 ${t('glossary')}</h1><p class="muted">Термины простыми словами — одно-два предложения на каждый.</p>
    <dl class="gloss">${sorted
      .map((g) => `<div class="card" id="g-${esc(g.term)}"><dt>${esc(g.term)}${g.aka ? `<small>${esc(g.aka)}</small>` : ''}</dt><dd>${esc(g.text)}</dd></div>`)
      .join('')}</dl>`;
  if (term) {
    const card = document.getElementById(`g-${decodeURIComponent(term)}`);
    if (card) {
      card.style.borderColor = 'var(--accent)';
      setTimeout(() => card.scrollIntoView({ block: 'center' }), 50);
    }
  }
};

export const tipsPage: Page = (el, [id]) => {
  el.innerHTML = `<h1>💡 ${t('tips')}</h1><p class="muted">Советы радиолюбителей. ✅ — подтверждено мануалом Yaesu, ⚠️ — только с форума, проверь на своей рации.</p>
    <div class="list">${tips
      .map(
        (tp) => `<article class="tip-card" id="t-${tp.id}"><h3><span aria-hidden="true">💡</span> ${esc(tp.title)}</h3><p>${esc(tp.text)}</p>
        <div class="badges"><span class="badge ${tp.verified ? 'badge-ok' : 'badge-warn'}">${tp.verified ? '✅ Проверено' : '⚠️ Не проверено'}</span></div>
        <div class="ref">${t('source')}: ${tp.sourceUrl ? `<a href="${esc(tp.sourceUrl)}" target="_blank" rel="noopener">${esc(tp.source)}</a>` : esc(tp.source)}</div></article>`
      )
      .join('')}</div>`;
  if (id) setTimeout(() => document.getElementById(`t-${id}`)?.scrollIntoView({ block: 'start' }), 50);
};

export const cheatPage: Page = (el) => {
  el.innerHTML = `<h1>📋 Шпаргалка FT-70DE — самое главное</h1>
    <div class="btn-row no-print"><button class="btn btn-big btn-primary" id="print">🖨 ${t('print')}</button></div>
    <div class="table-wrap"><table class="cheat-table"><tbody>
    ${cheatsheet.map((c) => `<tr><td>${esc(c.what)}</td><td>${keysRow(c.keys, false)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="muted no-print mt">«держать» — нажать и держать больше секунды. ⟳ — крутить ручку DIAL. После настройки: PTT — сохранить и выйти.</p>
    <p class="print-foot">UR4MAD · FT-70DE · «держать» = нажать и держать 1 с · ⟳ = крутить ручку · По мануалам Yaesu. Передача только 144–146 и 430–440 МГц.</p>`;
  el.querySelector('#print')!.addEventListener('click', () => window.print());
};

export const favPage: Page = (el) => {
  const list = store.favorites.map(getInstruction).filter(Boolean);
  el.innerHTML = `<h1>⭐ ${t('favs')}</h1>
    ${
      list.length
        ? `<div class="list">${list.map((i) => insRow(i!)).join('')}</div>`
        : `<div class="card"><p>Пока пусто.</p><p>Открой любую инструкцию и нажми <b>☆ В «Моё»</b> — она появится здесь.</p></div>`
    }`;
};

export const settingsPage: Page = (el) => {
  const s = store.settings;
  const opt = (k: string, v: string | number | boolean, l: string, cur: unknown) =>
    `<button class="btn ${cur === v ? 'on' : ''}" data-k="${k}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`;
  el.innerHTML = `<h1>🛠️ ${t('settings')}</h1>
    <div class="list">
      <div class="pref"><div class="pref-t">🔠 ${t('font')}</div><div class="seg">${opt('fontScale', 1, t('fontBig'), s.fontScale)}${opt('fontScale', 1.3, t('fontVery'), s.fontScale)}${opt('fontScale', 1.6, t('fontHuge'), s.fontScale)}</div></div>
      <div class="pref"><div class="pref-t">🌗 Тема</div><div class="seg">${opt('theme', 'dark', '🌙 ' + t('themeDark'), s.theme)}${opt('theme', 'light', '☀️ ' + t('themeLight'), s.theme)}</div></div>
      <div class="pref"><div class="pref-t">👣 Как показывать шаги</div><div class="seg">${opt('stepMode', 'step', t('stepMode'), s.stepMode)}${opt('stepMode', 'list', t('listMode'), s.stepMode)}</div></div>
      <div class="pref"><div class="pref-t">🔊 Кнопка «Прочитать вслух» ${speech.available() ? '' : '<span class="muted">(на этом устройстве голоса нет)</span>'}</div><div class="seg">${opt('voice', true, 'Показывать', s.voice)}${opt('voice', false, 'Скрыть', s.voice)}</div></div>
      <div class="pref"><div class="pref-t">🌐 Язык интерфейса</div><div class="seg">${opt('lang', 'ru', 'Русский', s.lang)}${opt('lang', 'uk', 'Українська', s.lang)}</div>
        <p class="muted" style="font-size:.8rem;margin-top:8px">Українською поки перекладено меню та назви розділів. Інструкції — російською.</p></div>
    </div>
    <h2 class="mt">💾 Мои данные</h2>
    <p class="muted">Свои репитеры, «Моё», настройки и фото. Сохрани файл — и перенеси на другой телефон или спрячь на всякий случай.</p>
    <div class="btn-row">
      <button class="btn btn-big btn-primary" id="exp">⬇️ Экспорт в файл</button>
      <label class="btn btn-big" for="imp">⬆️ Импорт из файла</label><input id="imp" type="file" accept="application/json,.json" hidden>
    </div>
    <label class="pref" style="display:flex;gap:12px;align-items:center;min-height:64px"><input type="checkbox" id="withPhotos" style="width:32px;height:32px"> Экспортировать вместе с фото (файл будет больше)</label>
    <h2 class="mt">📲 Установка на телефон</h2>
    <div class="card"><p><b>Android (Chrome):</b> меню ⋮ → «Установить приложение» или «Добавить на главный экран».</p>
    <p><b>iPhone (Safari):</b> кнопка «Поделиться» ⬆️ → «На экран «Домой»».</p>
    <p class="muted">После первого открытия всё работает без интернета — даже в режиме «в самолёте».</p>
    <button class="btn btn-big" id="installBtn" hidden>📲 ${t('install')}</button></div>
    <h2 class="mt">🧹 Сброс приложения</h2>
    <button class="btn btn-big btn-danger" id="wipe">Стереть мои данные в приложении</button>`;

  el.onclick = async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-k]');
    if (b) {
      const k = b.dataset.k as keyof typeof s;
      let v: unknown = b.dataset.v;
      if (k === 'fontScale') v = +b.dataset.v!;
      if (k === 'voice') v = b.dataset.v === 'true';
      store.setSetting(k, v as never);
      if (k === 'lang') return location.reload();
      settingsPage(el, []);
    }
  };
  el.querySelector('#exp')!.addEventListener('click', async () => {
    const withPhotos = (el.querySelector('#withPhotos') as HTMLInputElement).checked;
    const json = store.exportJson(withPhotos ? await photos.all() : null);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `ft70d-moi-dannye-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Файл сохранён в «Загрузки»');
  });
  el.querySelector('#imp')!.addEventListener('change', async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!(await confirmBig('Загрузить данные из файла?', 'Текущие репитеры, «Моё» и настройки заменятся данными из файла.', 'Да, загрузить', false))) return;
    try {
      await store.importJson(await f.text());
      toast('✅ Данные загружены');
      settingsPage(el, []);
    } catch (err) {
      toast('⛔ ' + (err as Error).message);
    }
  });
  el.querySelector('#wipe')!.addEventListener('click', async () => {
    if (await confirmBig('Стереть всё?', 'Удалятся твои репитеры, «Моё», настройки и фото в этом приложении. На рацию это не влияет.', 'Да, стереть')) {
      for (const p of await photos.all()) await photos.remove(p.id);
      store.resetAll();
      toast('Стёрто');
      location.hash = '#/';
    }
  });
  const ev = (window as unknown as { __installEvt?: Event & { prompt: () => void } }).__installEvt;
  const ib = el.querySelector<HTMLButtonElement>('#installBtn')!;
  if (ev) {
    ib.hidden = false;
    ib.onclick = () => ev.prompt();
  }
};

export const photosPage: Page = (el) => {
  const draw = async () => {
    const list = await photos.all();
    const hero = store.heroPhoto;
    el.innerHTML = `<h1>📷 ${t('photos')}</h1>
      <p>Сфотографируй свою рацию: спереди, сбоку, сзади, со снятым аккумулятором, в разобранном виде. Фото останутся только на этом телефоне.</p>
      <div class="btn-row">
        <label class="btn btn-big btn-primary" for="cam">📸 Сфотографировать</label><input id="cam" type="file" accept="image/*" capture="environment" hidden>
        <label class="btn btn-big" for="pick">🖼 Выбрать из галереи</label><input id="pick" type="file" accept="image/*" multiple hidden>
      </div>
      <div class="gallery mt">${
        list
          .map(
            (p) => `<figure class="photo-card"><img src="${p.data}" alt="${esc(p.caption || 'Фото рации')}">
          <figcaption><div class="field"><label for="c-${p.id}">Подпись</label><input id="c-${p.id}" data-cap="${p.id}" value="${esc(p.caption)}" placeholder="Например: вид сбоку"></div>
          <div class="btn-row"><button class="btn ${hero === p.id ? 'on' : ''}" data-hero="${p.id}">${hero === p.id ? '✅ На главном экране' : '🏠 Поставить на главный'}</button>
          <button class="btn btn-danger" data-del="${p.id}">🗑</button></div></figcaption></figure>`
          )
          .join('') || '<div class="card"><p class="muted">Пока фото нет. На главном экране — фото FT-70DE с Wikimedia Commons (автор Hensys1, CC BY-SA 4.0).</p></div>'
      }</div>
      ${hero ? '<button class="btn btn-big btn-wide" id="unhero">↺ Вернуть стандартное фото на главный экран</button>' : ''}`;
  };
  const add = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      try {
        const data = await shrinkImage(f);
        await photos.put({ id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, caption: '', data, added: new Date().toISOString() });
      } catch {
        toast('Не получилось открыть фото');
      }
    }
    toast('📷 Фото добавлено');
    draw();
  };
  el.addEventListener('change', (e) => {
    const i = e.target as HTMLInputElement;
    if (i.id === 'cam' || i.id === 'pick') add(i.files);
    if (i.dataset.cap)
      photos.get(i.dataset.cap).then((p) => {
        if (p) photos.put({ ...p, caption: i.value.trim() });
      });
  });
  el.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-hero],[data-del],#unhero');
    if (!b) return;
    if (b.id === 'unhero') store.setHeroPhoto(undefined);
    if (b.dataset.hero) store.setHeroPhoto(b.dataset.hero);
    if (b.dataset.del && (await confirmBig('Удалить фото?', 'Фото пропадёт из приложения.', 'Удалить'))) {
      await photos.remove(b.dataset.del);
      if (store.heroPhoto === b.dataset.del) store.setHeroPhoto(undefined);
    }
    draw();
  });
  draw();
};

export const sourcesPage: Page = (el) => {
  const L = (u: string, l: string) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`;
  el.innerHTML = `<h1>📚 ${t('sources')}</h1>
    <div class="card"><h3>Официальные документы Yaesu</h3><ul>
      <li>${L('https://www.yaesu.com/Files/DFDF4D53-1B78-7375-E6C7A6E4B192BE13/FT-70DR_DE_OM_ENG_EH051M202_1809R-CY-1.pdf', 'FT-70DR/DE Operating Manual')} — в приложении «OM»</li>
      <li>${L('https://www.yaesu.com/Files/DFDF4D53-1B78-7375-E6C7A6E4B192BE13/FT-70DR_DE_AM_ENG_1907-F.pdf', 'FT-70DR/DE Advance Manual')} — «AM»</li>
      <li>${L('https://www.yaesu.com/Files/BB2B47AE-1018-01AF-FAE48FDCB1919193/FT-70D_ver111(EXP).zip', 'Прошивка MAIN 1.11 (EXP) с инструкцией')}</li>
      <li>${L('https://www.yaesu.com/Files/BB2B47AE-1018-01AF-FAE48FDCB1919193/FT-70D_ADMS-10_ENG.zip', 'ADMS-10 (программа)')} и ${L('https://www.yaesu.com/Files/DFDF4D53-1B78-7375-E6C7A6E4B192BE13/ADMS-10_FT-70D_IM_ENG_2211-C.pdf', 'её инструкция')}</li>
      <li>${L('https://yaesu.com/product-detail.aspx?Model=FT-70DR&CatName=VHF%2FUHF+Handhelds', 'Страница FT-70DR на yaesu.com')}</li>
      <li>${L('https://www.yaesu.com/jp/en/wires-x/index.php', 'WIRES-X: список узлов')}</li></ul></div>
    <div class="card mt"><h3>Форумы и блоги (фишки)</h3><ul>
      <li>${L('https://0x9900.com/going-digital-with-the-ft-70d/', '0x9900.com — Going digital with the FT-70D')}</li>
      <li>${L('https://wb4son.com/wpblog/?p=3406', 'WB4SON — DTMF and the FT-70D')}</li>
      <li>${L('https://forum.pistar.uk/viewtopic.php?t=4645', 'forum.pistar.uk — FT-70D not connecting to Wires-X')}</li>
      <li>${L('https://chirpmyradio.com/issues/5647', 'CHIRP — FT-70D (#5647)')}, ${L('https://chirpmyradio.com/issues/9211', '#9211')}</li>
      <li>${L('https://forums.radioreference.com/threads/ft-70d-driver-installation.403329/', 'RadioReference — FT-70D driver installation')}</li>
      <li>${L('https://forums.radioreference.com/threads/yaesu-ft-70d-programming-issues.415012/', 'RadioReference — FT-70D programming issues')}</li>
      <li>${L('https://wp.hamoperator.com/?p=1322', 'HamOperator — Battery Hints and the FT-70')}</li>
      <li>${L('https://www.rtsystemsinc.com/FT-70D_c_814.html', 'RT Systems ADMS-70D')}</li></ul></div>
    <div class="card mt"><h3>Репитеры</h3><ul>
      <li>${L('https://prevadece.smoce.net/seznam-prevadecu/cz/', 'Smoce — каталог репитеров Чехии')}</li>
      <li>${L('https://ok1kvk.cz/clanek/2008/ok0e-a-ok0be/', 'OK1KVK — репитеры на Клиновце')}</li>
      <li>${L('https://z64.vfdb.org/z64-aktivitat/notfunk/relaisliste/', 'VFDB Z64 — список северной Баварии')}</li>
      <li>${L('https://z64.vfdb.org/impressum/', 'VFDB Z64 — параметры DB0YQ')}</li>
      <li>${L('https://www.darc-mak.de/relais.html', 'DARC Marktredwitz — DB0MAK')}</li>
      <li>${L('https://www.darc.de/der-club/distrikte/b/vhfuhfshf/', 'DARC Oberfranken — DB0ZB')}</li>
      <li>${L('https://www.repeaterbook.com/row_repeaters/Display_SS.php?state_id=CZ', 'RepeaterBook — Чехия')}</li>
      <li>${L('https://www.repeaterbook.com/row_repeaters/details.php?ID=2697&state_id=DE', 'RepeaterBook — DB0RQ')}</li></ul>
      <p class="muted">Список составлен 29.09.2026. Расстояния приблизительные, по прямой от центра Марианских Лазней; досягаемость не гарантируется.</p></div>
    <div class="card mt"><h3>Фото</h3><p>Фото FT-70DE: Hensys1, ${L('https://commons.wikimedia.org/wiki/File:FT70DE_sk.jpg', 'Wikimedia Commons')}, лицензия ${L('https://creativecommons.org/licenses/by-sa/4.0/', 'CC BY-SA 4.0')}.
      Схемы рации нарисованы для этого приложения и не копируют фото и рисунки Yaesu.</p></div>
    <div class="card mt"><h3>Важно</h3><p>Тексты написаны своими словами по мануалам Yaesu. Шаги с пометкой ⚠️ не удалось полностью подтвердить по мануалу — проверь их на рации.
      Надписи на экране в приложении показаны примерно — на рации шрифт и значки выглядят иначе. Yaesu не имеет отношения к этому приложению.</p></div>`;
};
