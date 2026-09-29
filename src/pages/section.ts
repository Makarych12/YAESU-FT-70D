import type { Page } from '../main';
import type { Instruction } from '../lib/types';
import { getInstruction, refTitle, section, sectionInstructions } from '../lib/content';
import { store } from '../lib/store';
import { t } from '../lib/i18n';
import { esc, rich, stars } from '../components/ui';
import { stepPlayer } from '../components/stepPlayer';

export function insRow(i: Instruction) {
  return `<a class="row ${i.danger ? 'row-danger' : ''}" href="#/i/${i.id}">
    <span class="row-ico" aria-hidden="true">${i.danger ? '⛔' : store.isFav(i.id) ? '⭐' : '▶️'}</span>
    <span><span class="row-t">${esc(i.title)}</span>
    <span class="row-d">${i.verified ? '' : '⚠️ '}${esc(i.intro ?? i.steps[0]?.text.replace(/\[|\]|\{\{|\}\}/g, '') ?? '')}</span></span>
    <span class="row-go" aria-hidden="true">›</span></a>`;
}

export const sectionPage: Page = (el, [id]) => {
  if (id === 'setmenu') return void (location.hash = '#/set');
  if (id === 'tips') return void (location.hash = '#/tips');
  const s = section(id);
  if (!s) return void (el.innerHTML = '<h1>Раздел не найден</h1>');
  const list = sectionInstructions(id);
  const extra =
    id === 'repeater'
      ? `<div class="btn-row"><a class="btn btn-big btn-primary" href="#/rpt">📶 Мои репитеры — настройка по шагам</a>
         <a class="btn btn-big" href="#/wizard">🧮 Настрой по частоте</a></div>`
      : id === 'intro'
        ? `<div class="btn-row"><a class="btn btn-big btn-primary" href="#/radio">🗺️ Схема рации: что где</a><a class="btn btn-big" href="#/display">🔤 Значки на экране</a></div>`
        : id === 'help'
          ? `<div class="btn-row"><a class="btn btn-big" href="#/display">🔤 Все надписи на экране</a></div>`
          : '';
  el.innerHTML = `<h1><span aria-hidden="true">${s.icon}</span> ${esc(s.title)}</h1>
    <p class="muted">${esc(s.description)}</p>${extra}
    <div class="list">${list.map(insRow).join('')}</div>`;
};

export const instructionPage: Page = (el, [id]) => {
  const ins = getInstruction(id);
  if (!ins) return void (el.innerHTML = '<h1>Инструкция не найдена</h1>');
  const sec = section(ins.section);
  const anyCheck = ins.steps.some((s) => s.check);

  const head = `
    <div class="ins-head">
      <a class="muted" href="#/s/${ins.section}">${sec?.icon ?? ''} ${esc(sec?.title ?? '')}</a>
      <h1>${esc(ins.title)}</h1>
      <div class="badges">
        ${ins.verified ? `<span class="badge badge-ok">✅ ${t('verified')}</span>` : `<span class="badge badge-warn">⚠️ ${t('unverified')}</span>`}
        ${anyCheck && ins.verified ? `<span class="badge badge-warn">⚠️ Есть шаги «проверить на рации»</span>` : ''}
        <span class="badge">${t('difficulty')}: ${stars(ins.difficulty)}</span>
        ${ins.danger ? `<span class="badge badge-danger">⛔ ${t('danger')}</span>` : ''}
      </div>
      <div class="ref">📘 ${esc(ins.manualRef)}</div>
      <div class="ins-actions no-print">
        <button class="btn" id="fav" aria-pressed="${store.isFav(id)}">${store.isFav(id) ? `⭐ ${t('unfav')}` : `☆ ${t('fav')}`}</button>
      </div>
    </div>
    ${ins.intro ? `<div class="intro">${rich(ins.intro)}</div>` : ''}`;

  const tail = `
    ${ins.warning ? `<div class="note ${ins.danger ? 'note-danger' : 'note-warn'} mt"><span class="note-ico" aria-hidden="true">${ins.danger ? '⛔' : '⚠️'}</span><div><strong>${t('warning')}:</strong> ${rich(ins.warning)}</div></div>` : ''}
    ${
      ins.related?.length
        ? `<h3 class="mt">${t('related')}</h3><div class="list">${ins.related
            .map((r) => refTitle(r))
            .filter(Boolean)
            .map((r) => `<a class="row" href="${r!.href}"><span class="row-t">${esc(r!.title)}</span><span class="row-go">›</span></a>`)
            .join('')}</div>`
        : ''
    }`;

  el.innerHTML = `${head}<div id="player"></div>${tail}`;
  const host = el.querySelector<HTMLElement>('#player')!;
  let player: { stop: () => void } | null = null;

  if (ins.danger) {
    host.innerHTML = `<div class="danger-box"><h2>⛔ ${t('danger')}</h2>
      <p>${rich(ins.warning ?? 'Это действие нельзя отменить.')}</p>
      <button class="btn btn-big btn-danger btn-wide" id="agree">${t('dangerConfirm')}</button></div>`;
    host.querySelector('#agree')!.addEventListener('click', () => {
      host.innerHTML = '';
      player = stepPlayer(host, ins.steps, { id });
    });
  } else {
    player = stepPlayer(host, ins.steps, { id });
  }

  el.querySelector('#fav')!.addEventListener('click', (e) => {
    const on = store.toggleFav(id);
    const b = e.currentTarget as HTMLButtonElement;
    b.textContent = on ? `⭐ ${t('unfav')}` : `☆ ${t('fav')}`;
    b.setAttribute('aria-pressed', String(on));
  });
  return () => player?.stop();
};
