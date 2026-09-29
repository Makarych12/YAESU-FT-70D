import type { Page } from '../main';
import type { Repeater, ToneMode } from '../lib/types';
import { builtinRepeaters } from '../lib/content';
import { store } from '../lib/store';
import { t } from '../lib/i18n';
import { CTCSS, DCS, bandOf, canRx, canTx, fmtFreq, generateSteps, suggestShift, txFreq } from '../lib/generator';
import { confirmBig, esc, toast } from '../components/ui';
import { stepPlayer } from '../components/stepPlayer';

export function allRepeaters(): Repeater[] {
  const user = store.userRepeaters;
  const hidden = new Set(store.hiddenBuiltins);
  const overridden = new Set(user.map((r) => r.id));
  return [...user, ...builtinRepeaters.filter((r) => !hidden.has(r.id) && !overridden.has(r.id))];
}
export function findRepeater(id: string) {
  return allRepeaters().find((r) => r.id === id);
}

function toneText(r: Repeater) {
  if (r.mode === 'C4FM') return `DG-ID ${String(r.dgid ?? 0).padStart(2, '0')}`;
  switch (r.toneMode) {
    case 'tone': return `Тон ${r.tone?.toFixed(1)} Гц`;
    case 'tsql': return `TSQL ${r.tone?.toFixed(1)} Гц`;
    case 'dcs': return `DCS ${r.dcs}`;
    case 't1750': return 'Тон 1750 Гц';
    default: return 'Без тона';
  }
}
function shiftText(r: Repeater) {
  if (r.shiftDir === 'simplex') return 'Без сдвига';
  return `Сдвиг ${r.shiftDir === '-' ? '−' : '+'}${r.shift} МГц`;
}
const STATUS = { ok: ['🟢', 'работает'], unknown: ['⚪', 'статус неизвестен'], off: ['🔴', 'не работает'] } as const;

function card(r: Repeater) {
  const st = STATUS[r.status ?? 'unknown'];
  return `<article class="rpt">
    <div class="rpt-top">
      <div><div class="rpt-freq">${fmtFreq(r.freq)}</div><div class="muted" style="font-size:.75rem">МГц · выход</div></div>
      <div style="flex:1;min-width:160px"><div class="rpt-name">${esc(r.name)}${r.callsign && r.callsign !== r.name ? ` · ${esc(r.callsign)}` : ''}</div>
      <div class="rpt-city">${esc(r.city)}</div></div>
      <span class="badge" title="${st[1]}">${st[0]} ${st[1]}</span>
    </div>
    <div class="rpt-params">
      <span class="chip chip-mode-${r.mode.toLowerCase()}">${r.mode === 'C4FM' ? '🟦 C4FM цифра' : '📻 FM'}</span>
      <span class="chip">${shiftText(r)}${r.shiftAssumed ? ' ⚠️' : ''}</span>
      <span class="chip">${toneText(r)}</span>
      ${r.shiftDir !== 'simplex' ? `<span class="chip">Передача ${fmtFreq(txFreq(r))}</span>` : ''}
    </div>
    ${r.note ? `<p class="muted" style="font-size:.85rem">${esc(r.note)}</p>` : ''}
    <div class="btn-row">
      <a class="btn btn-primary" href="#/rpt/${r.id}/steps">🪜 Как настроить рацию</a>
      <a class="btn" href="#/rpt/${r.id}/show">👀 Показать крупно</a>
      <a class="btn" href="#/rpt/${r.id}/edit">✏️ Изменить</a>
    </div>
    <div class="rpt-src">${r.builtin && !store.userRepeaters.some((u) => u.id === r.id) ? `Источник: ${r.sourceUrl ? `<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${esc(r.source ?? '')}</a>` : esc(r.source ?? '')}, данные на ${esc(r.checked ?? '')}` : '✍️ Добавлен или изменён вручную'}</div>
  </article>`;
}

export const repeatersPage: Page = (el) => {
  let q = '';
  let band: 'all' | '2m' | '70cm' = 'all';
  let showOff = false;
  const draw = () => {
    const list = allRepeaters()
      .filter((r) => showOff || r.status !== 'off')
      .filter((r) => band === 'all' || bandOf(r.freq) === band || (band === '70cm' && r.freq > 400))
      .filter((r) => !q || `${r.name} ${r.city} ${r.callsign ?? ''} ${r.freq}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => Number(!!b.builtin === false) - Number(!!a.builtin === false) || a.freq - b.freq);
    el.querySelector('#list')!.innerHTML = list.map(card).join('') || '<p class="muted">Ничего не нашлось.</p>';
  };
  el.innerHTML = `<h1>📶 ${t('myRepeaters')}</h1>
    <div class="note note-warn"><span class="note-ico">⚠️</span><div>Частоты и тоны собраны из открытых списков (RepeaterBook, ORLink) на 29.09.2026 и могут устареть.
    Перед выходом в эфир уточни их у местных радиолюбителей. Значок ⚠️ у сдвига — величина взята стандартная.</div></div>
    <div class="btn-row"><a class="btn btn-big btn-primary" href="#/rpt/new">➕ Добавить свой репитер</a><a class="btn btn-big" href="#/wizard">🧮 Настрой по частоте</a></div>
    <div class="search"><label for="rq" class="sr-only">Поиск репитера</label><input id="rq" type="search" placeholder="Город, позывной или частота"></div>
    <div class="filter" role="group" aria-label="Диапазон">
      <button class="btn on" data-b="all">Все</button><button class="btn" data-b="2m">2 м (145)</button><button class="btn" data-b="70cm">70 см (430+)</button>
      <button class="btn" data-off aria-pressed="false">🔴 Показать неработающие</button>
    </div>
    <div class="list" id="list"></div>
    <div class="btn-row"><button class="btn" id="restore">↺ Вернуть удалённые встроенные репитеры</button></div>`;
  el.querySelector('#rq')!.addEventListener('input', (e) => {
    q = (e.target as HTMLInputElement).value.trim();
    draw();
  });
  el.querySelector('.filter')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.hasAttribute('data-off')) {
      showOff = !showOff;
      b.classList.toggle('on', showOff);
      b.setAttribute('aria-pressed', String(showOff));
    } else {
      band = b.dataset.b as typeof band;
      el.querySelectorAll('[data-b]').forEach((x) => x.classList.toggle('on', x === b));
    }
    draw();
  });
  el.querySelector('#restore')!.addEventListener('click', () => {
    store.restoreBuiltins();
    toast('Встроенный список восстановлен');
    draw();
  });
  draw();
};

function paramsSummary(r: Repeater) {
  return `<div class="rpt"><div class="rpt-top"><div class="rpt-freq">${fmtFreq(r.freq)}</div>
    <div><div class="rpt-name">${esc(r.name)}</div><div class="rpt-city">${esc(r.city)}</div></div></div>
    <div class="rpt-params"><span class="chip">${r.mode === 'C4FM' ? '🟦 C4FM' : '📻 FM'}</span><span class="chip">${shiftText(r)}</span><span class="chip">${toneText(r)}</span></div></div>`;
}

export const repeaterStepsPage: Page = (el, [id]) => {
  const r = findRepeater(id);
  if (!r) return void (el.innerHTML = '<h1>Репитер не найден</h1>');
  return renderGenerated(el, r);
};

function renderGenerated(el: HTMLElement, r: Repeater, extraTop = '') {
  const g = generateSteps(r);
  el.innerHTML = `<h1>🪜 Настроить рацию: ${esc(r.name)}</h1>${extraTop}${paramsSummary(r)}
    ${g.warnings.map((w) => `<div class="note note-warn"><span class="note-ico">⚠️</span><div>${esc(w)}</div></div>`).join('')}
    <div class="note note-tip"><span class="note-ico">🤖</span><div>Эти шаги составлены автоматически по параметрам репитера — по процедурам из официальных мануалов Yaesu.</div></div>
    <div id="player" class="mt"></div>
    <div class="btn-row no-print"><a class="btn btn-big" href="#/rpt/${r.id}/show">👀 Показать крупно</a></div>`;
  const p = stepPlayer(el.querySelector('#player')!, g.steps, { id: `rpt-${r.id}` });
  return () => p.stop();
}

export const repeaterShowPage: Page = (el, [id]) => {
  const r = findRepeater(id);
  if (!r) return void (el.innerHTML = '<h1>Репитер не найден</h1>');
  const div = document.createElement('div');
  div.className = 'show';
  div.setAttribute('role', 'dialog');
  div.setAttribute('aria-label', `Репитер ${r.name}`);
  div.innerHTML = `<div class="show-name">${esc(r.name)} · ${esc(r.city)}</div>
    <div class="show-freq">${fmtFreq(r.freq)}</div>
    <div class="show-grid">
      <div><small>Сдвиг</small>${r.shiftDir === 'simplex' ? 'нет' : `${r.shiftDir === '-' ? '−' : '+'} ${r.shift}`}</div>
      <div><small>${r.mode === 'C4FM' ? 'DG-ID' : 'Тон'}</small>${r.mode === 'C4FM' ? String(r.dgid ?? 0).padStart(2, '0') : r.toneMode === 'none' ? 'нет' : r.toneMode === 'dcs' ? `DCS ${r.dcs}` : r.toneMode === 't1750' ? '1750' : r.tone?.toFixed(1)}</div>
      <div><small>Режим</small>${r.mode === 'C4FM' ? 'ЦИФРА' : 'FM'}</div>
      ${r.shiftDir !== 'simplex' ? `<div><small>Передача</small>${fmtFreq(txFreq(r))}</div>` : ''}
    </div>
    <button class="btn" id="close">✕ Закрыть</button>`;
  document.body.append(div);
  const close = () => {
    div.remove();
    history.back();
  };
  div.querySelector('#close')!.addEventListener('click', close);
  try {
    // экран не гаснет, пока открыта карточка
    (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => void }> } }).wakeLock?.request('screen').catch(() => {});
  } catch { /* не поддерживается */ }
  el.innerHTML = `<h1>${esc(r.name)}</h1>`;
  return () => div.remove();
};

/* ---------- Форма ---------- */

function segBtns(name: string, opts: [string, string][], val: string) {
  return `<div class="seg" role="radiogroup">${opts
    .map(([v, l]) => `<button type="button" class="btn ${v === val ? 'on' : ''}" role="radio" aria-checked="${v === val}" data-seg="${name}" data-v="${v}">${l}</button>`)
    .join('')}</div>`;
}

export const repeaterFormPage: Page = (el, [id]) => {
  const existing = id ? findRepeater(id) : undefined;
  const r: Repeater = existing
    ? structuredClone(existing)
    : { id: `u-${Date.now().toString(36)}`, name: '', city: '', freq: 145.6, shiftDir: '-', shift: 0.6, toneMode: 'tone', tone: 88.5, mode: 'FM', builtin: false };

  const draw = () => {
    el.innerHTML = `<h1>${existing ? '✏️ Изменить репитер' : '➕ Новый репитер'}</h1>
    <form class="form" id="f" novalidate>
      <div class="field"><label for="name">Название</label><input id="name" required value="${esc(r.name)}" placeholder="Например: Киев R81"></div>
      <div class="field"><label for="city">Город / место</label><input id="city" value="${esc(r.city)}" placeholder="Например: Киев"></div>
      <div class="field"><label for="freq">Частота ВЫХОДА репитера, МГц</label>
        <input id="freq" inputmode="decimal" value="${fmtFreq(r.freq)}" placeholder="145.675"><div class="hint" id="freq-hint"></div></div>
      <div class="field"><span class="lbl">Сдвиг</span>${segBtns('shiftDir', [['-', '− минус'], ['+', '+ плюс'], ['simplex', 'Без сдвига']], r.shiftDir)}</div>
      <div class="field" ${r.shiftDir === 'simplex' ? 'hidden' : ''}><label for="shift">Величина сдвига, МГц</label>
        <input id="shift" inputmode="decimal" value="${r.shift}"><div class="hint">Обычно 0.6 для 2 м и 7.6 для 70 см.</div></div>
      <div class="field"><span class="lbl">Режим</span>${segBtns('mode', [['FM', '📻 FM (аналог)'], ['C4FM', '🟦 C4FM (цифра)']], r.mode)}</div>
      ${
        r.mode === 'FM'
          ? `<div class="field"><span class="lbl">Тон</span>${segBtns('toneMode', [['none', 'Нет'], ['tone', 'Субтон (TONE)'], ['tsql', 'TSQL'], ['dcs', 'DCS'], ['t1750', '1750 Гц']], r.toneMode)}</div>
      ${r.toneMode === 'tone' || r.toneMode === 'tsql' ? `<div class="field"><label for="tone">Частота субтона, Гц</label><select id="tone">${CTCSS.map((c) => `<option ${c === r.tone ? 'selected' : ''}>${c.toFixed(1)}</option>`).join('')}</select></div>` : ''}
      ${r.toneMode === 'dcs' ? `<div class="field"><label for="dcs">Код DCS</label><select id="dcs">${DCS.map((c) => `<option ${c === r.dcs ? 'selected' : ''}>${c}</option>`).join('')}</select></div>` : ''}`
          : `<div class="field"><label for="dgid">DG-ID (00 — для всех)</label><input id="dgid" inputmode="numeric" value="${String(r.dgid ?? 0).padStart(2, '0')}"></div>`
      }
      <div class="field"><label for="note">Заметка</label><textarea id="note">${esc(r.note ?? '')}</textarea></div>
      <div class="btn-row"><button class="btn btn-big btn-primary" type="submit">💾 Сохранить</button>
      ${existing ? `<button class="btn btn-big btn-danger" type="button" id="del">🗑 Удалить</button>` : ''}</div>
    </form>`;
    hintFreq();
  };

  const read = () => {
    const v = (s: string) => (el.querySelector(`#${s}`) as HTMLInputElement | null)?.value ?? '';
    r.name = v('name').trim();
    r.city = v('city').trim();
    r.freq = parseFloat(v('freq').replace(',', '.')) || 0;
    const sh = parseFloat(v('shift').replace(',', '.'));
    if (!isNaN(sh)) r.shift = sh;
    if (el.querySelector('#tone')) r.tone = parseFloat(v('tone'));
    if (el.querySelector('#dcs')) r.dcs = v('dcs');
    if (el.querySelector('#dgid')) r.dgid = Math.min(99, Math.max(0, parseInt(v('dgid')) || 0));
    r.note = v('note').trim() || undefined;
  };

  const hintFreq = () => {
    const h = el.querySelector('#freq-hint');
    const f = parseFloat((el.querySelector('#freq') as HTMLInputElement).value.replace(',', '.'));
    if (!h) return;
    if (!f) return void (h.textContent = '');
    const s = suggestShift(f);
    h.textContent = !canRx(f) ? '⛔ FT-70DE не принимает эту частоту.' : `${canTx(f) ? '' : '⚠️ Здесь FT-70DE только слушает. '}Подсказка: ${s.why}`;
  };

  el.addEventListener('input', (e) => {
    if ((e.target as HTMLElement).id === 'freq') hintFreq();
  });
  el.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-seg],#del');
    if (!b) return;
    if (b.id === 'del') {
      if (await confirmBig('Удалить репитер?', `«${r.name}» пропадёт из списка.`, 'Да, удалить')) {
        store.deleteRepeater(r.id);
        toast('Удалено');
        location.hash = '#/rpt';
      }
      return;
    }
    read();
    const k = b.dataset.seg as 'shiftDir' | 'mode' | 'toneMode';
    if (k === 'shiftDir') r.shiftDir = b.dataset.v as Repeater['shiftDir'];
    if (k === 'mode') r.mode = b.dataset.v as Repeater['mode'];
    if (k === 'toneMode') {
      r.toneMode = b.dataset.v as ToneMode;
      if ((r.toneMode === 'tone' || r.toneMode === 'tsql') && !r.tone) r.tone = 88.5;
      if (r.toneMode === 'dcs' && !r.dcs) r.dcs = '023';
    }
    draw();
  });
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    read();
    if (!r.name) return toast('Впиши название');
    if (!canRx(r.freq)) return toast('Проверь частоту: 108–580 МГц');
    r.builtin = false;
    r.shiftAssumed = false;
    r.status = r.status ?? 'ok';
    store.saveRepeater(r);
    toast('💾 Сохранено');
    location.hash = `#/rpt/${r.id}/steps`;
  });
  draw();
};

/* ---------- Мастер «Настрой по частоте» ---------- */

export const wizardPage: Page = (el) => {
  const w: Repeater = { id: `u-${Date.now().toString(36)}`, name: 'Репитер', city: '', freq: 0, shiftDir: '-', shift: 0.6, toneMode: 'tone', tone: 88.5, mode: 'FM', builtin: false };
  let stage = 0;
  let cleanup: (() => void) | void;

  const draw = () => {
    if (typeof cleanup === 'function') cleanup();
    if (stage === 0) {
      el.innerHTML = `<h1>🧮 ${t('wizard')}</h1>
      <p>Введи частоту ВЫХОДА репитера — ту, что написана в списке.</p>
      <form id="f0" class="form"><div class="field"><label for="wf">Частота, МГц</label>
        <input id="wf" inputmode="decimal" autofocus placeholder="например 145.675" value="${w.freq ? fmtFreq(w.freq) : ''}"></div>
        <button class="btn btn-big btn-primary">Дальше ▶</button></form>`;
      el.querySelector('#f0')!.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = parseFloat((el.querySelector('#wf') as HTMLInputElement).value.replace(',', '.'));
        if (!f || !canRx(f)) return toast('FT-70DE принимает 108–580 МГц. Проверь частоту.');
        w.freq = f;
        const s = suggestShift(f);
        w.shiftDir = s.dir;
        w.shift = s.shift || w.shift;
        stage = 1;
        draw();
      });
    } else if (stage === 1) {
      const s = suggestShift(w.freq);
      el.innerHTML = `<h1>🧮 Сдвиг</h1>
        <div class="rpt"><div class="rpt-freq">${fmtFreq(w.freq)}</div></div>
        <div class="note note-tip"><span class="note-ico">💡</span><div>${esc(s.why)}</div></div>
        ${canTx(w.freq) ? '' : '<div class="note note-warn"><span class="note-ico">⚠️</span><div>На этой частоте FT-70DE передавать не может — только слушать.</div></div>'}
        <p class="mt"><strong>Какой сдвиг у репитера?</strong></p>
        <div class="list">
          <button class="btn btn-big" data-sh="-:${w.freq < 200 ? 0.6 : 7.6}">− ${w.freq < 200 ? '0,6' : '7,6'} МГц ${s.dir === '-' && (s.shift === 0.6 || s.shift === 7.6) ? '(обычно так)' : ''}</button>
          ${w.freq > 400 ? '<button class="btn btn-big" data-sh="-:1.6">− 1,6 МГц</button>' : ''}
          <button class="btn btn-big" data-sh="+:${w.freq < 200 ? 0.6 : 7.6}">+ ${w.freq < 200 ? '0,6' : '7,6'} МГц</button>
          <button class="btn btn-big" data-sh="simplex:0">Без сдвига (симплекс)</button>
        </div>`;
      el.querySelectorAll<HTMLElement>('[data-sh]').forEach((b) =>
        b.addEventListener('click', () => {
          const [d, v] = b.dataset.sh!.split(':');
          w.shiftDir = d as Repeater['shiftDir'];
          w.shift = +v || w.shift;
          stage = 2;
          draw();
        })
      );
    } else if (stage === 2) {
      el.innerHTML = `<h1>🧮 Режим и тон</h1>
        <p><strong>Что нужно репитеру?</strong></p>
        <div class="list">
          <button class="btn btn-big" data-t="tone">📻 FM с субтоном (самое частое)</button>
          <button class="btn btn-big" data-t="none">📻 FM без тона</button>
          <button class="btn btn-big" data-t="t1750">📻 FM, открывается тоном 1750 Гц</button>
          <button class="btn btn-big" data-t="dcs">📻 FM с кодом DCS</button>
          <button class="btn btn-big" data-t="c4fm">🟦 Цифра C4FM (Fusion)</button>
          <button class="btn btn-big" data-t="unknown">🤷 Не знаю</button>
        </div>`;
      el.querySelectorAll<HTMLElement>('[data-t]').forEach((b) =>
        b.addEventListener('click', () => {
          const v = b.dataset.t!;
          if (v === 'unknown') {
            location.hash = '#/i/repeater-tone-search';
            return;
          }
          w.mode = v === 'c4fm' ? 'C4FM' : 'FM';
          w.toneMode = v === 'c4fm' ? 'none' : (v as ToneMode);
          stage = v === 'tone' || v === 'dcs' || v === 'c4fm' ? 3 : 4;
          draw();
        })
      );
    } else if (stage === 3) {
      const isTone = w.toneMode === 'tone';
      const isDcs = w.toneMode === 'dcs';
      el.innerHTML = `<h1>🧮 ${isTone ? 'Субтон' : isDcs ? 'Код DCS' : 'DG-ID'}</h1>
        <form id="f3" class="form"><div class="field">
        ${
          isTone
            ? `<label for="v">Частота субтона, Гц</label><select id="v">${CTCSS.map((c) => `<option ${c === 88.5 ? 'selected' : ''}>${c.toFixed(1)}</option>`).join('')}</select>`
            : isDcs
              ? `<label for="v">Код DCS</label><select id="v">${DCS.map((c) => `<option>${c}</option>`).join('')}</select>`
              : `<label for="v">DG-ID репитера (00 — для всех)</label><input id="v" inputmode="numeric" value="00">`
        }</div><button class="btn btn-big btn-primary">Показать шаги ▶</button></form>`;
      el.querySelector('#f3')!.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (el.querySelector('#v') as HTMLInputElement).value;
        if (isTone) w.tone = parseFloat(v);
        else if (isDcs) w.dcs = v;
        else w.dgid = Math.min(99, Math.max(0, parseInt(v) || 0));
        stage = 4;
        draw();
      });
    } else {
      w.name = `R ${fmtFreq(w.freq)}`;
      cleanup = renderGenerated(
        el,
        w,
        `<div class="btn-row no-print"><button class="btn btn-big btn-primary" id="save">💾 Сохранить в «Мои репитеры»</button><button class="btn btn-big" id="again">↺ Другая частота</button></div>`
      );
      el.querySelector('#save')!.addEventListener('click', () => {
        store.saveRepeater({ ...w, status: 'ok' });
        toast('💾 Сохранено в «Мои репитеры»');
        location.hash = `#/rpt/${w.id}/edit`;
      });
      el.querySelector('#again')!.addEventListener('click', () => {
        stage = 0;
        draw();
      });
    }
  };
  draw();
  return () => {
    if (typeof cleanup === 'function') cleanup();
  };
};
