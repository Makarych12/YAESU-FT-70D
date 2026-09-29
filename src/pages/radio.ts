import type { Page } from '../main';
import { displayIcons, lcdMessages, radioKeys, refTitle } from '../lib/content';
import { photos } from '../lib/store';
import { t } from '../lib/i18n';
import { esc, keycap, rich } from '../components/ui';
import { radioExploded, radioFront, radioSide } from '../components/radioSvg';
import commonsPhoto from '../assets/ft70de-commons-hensys1.jpg';

const KEYCAP_IDS = new Set(['F', 'GM', 'MODE', 'HM/RV', 'AMS', 'BAND', 'V/M', 'PTT', 'MONI', 'VOL', 'POWER', 'DIAL', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

function keyCard(id: string) {
  const k = radioKeys.find((x) => x.id === id);
  if (!k) return '';
  const rows = [
    ['Где', k.where],
    ['Короткое нажатие', k.press],
    k.fPress ? ['[F], потом эта кнопка', k.fPress] : null,
    k.hold ? ['Нажать и держать', k.hold] : null,
    k.more ? ['Ещё', k.more] : null,
  ].filter(Boolean) as string[][];
  return `<section class="key-card" id="key-card" aria-live="polite">
    <h2>${KEYCAP_IDS.has(k.id) ? keycap(k.id, true) : ''} ${esc(k.label)}</h2>
    <div class="kv">${rows.map(([a, b]) => `<div><b>${esc(a)}</b>${rich(b)}</div>`).join('')}</div>
    ${
      k.related?.length
        ? `<div class="list">${k.related
            .map(refTitle)
            .filter(Boolean)
            .map((r) => `<a class="row" href="${r!.href}"><span class="row-t">${esc(r!.title)}</span><span class="row-go">›</span></a>`)
            .join('')}</div>`
        : ''
    }</section>`;
}

export const radioPage: Page = (el, [sub]) => {
  let tab = (sub?.split('/')[0] as 'front' | 'side' | 'exploded' | 'photos') || 'front';
  let sel = '';

  const draw = () => {
    const tabs = [
      ['front', '📱 Спереди'],
      ['side', '🔌 Правый бок'],
      ['exploded', '🧩 Разобранный вид'],
      ['photos', '📷 Настоящие фото'],
    ];
    let body = '';
    if (tab === 'front') body = `<div class="radio-wrap">${radioFront()}${radioSide()}</div>`;
    if (tab === 'side') body = `<div style="max-width:320px;margin:0 auto">${radioSide()}</div>`;
    if (tab === 'exploded') body = `${radioExploded()}<p class="muted center">Эти части ты можешь снять и поставить сам. Внутрь корпуса Yaesu лезть не советует: пропадёт защита от воды и гарантия.</p>`;
    if (tab === 'photos') body = `<div class="gallery" id="gal"></div>
      <div class="btn-row"><a class="btn btn-big btn-primary" href="#/photos">📷 Добавить свои фото рации</a></div>`;

    el.innerHTML = `<h1>🗺️ ${t('radio')}</h1>
      <p class="muted">Нажми на любую кнопку на рисунке — внизу появится подсказка.</p>
      <div class="tabs" role="tablist">${tabs
        .map(([k, l]) => `<button class="btn ${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`)
        .join('')}</div>
      ${body}
      <div id="card-host">${sel ? keyCard(sel) : ''}</div>
      <h2 class="mt">Все кнопки и разъёмы списком</h2>
      <div class="keylist">${radioKeys.map((k) => `<button class="btn" data-key="${k.id}">${esc(k.label)}</button>`).join('')}</div>`;

    if (sel) el.querySelectorAll(`.hot[data-key="${CSS.escape(sel)}"]`).forEach((g) => g.classList.add('sel'));

    if (tab === 'photos') {
      const gal = el.querySelector('#gal')!;
      gal.innerHTML = `<figure class="photo-card"><img src="${commonsPhoto}" alt="Yaesu FT-70DE, вид спереди" loading="lazy">
        <figcaption>Настоящая FT-70DE. Фото: Hensys1, <a href="https://commons.wikimedia.org/wiki/File:FT70DE_sk.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>, лицензия CC BY-SA 4.0.</figcaption></figure>`;
      photos.all().then((ps) => {
        gal.insertAdjacentHTML(
          'beforeend',
          ps.map((p) => `<figure class="photo-card"><img src="${p.data}" alt="${esc(p.caption || 'Моё фото рации')}" loading="lazy"><figcaption>${esc(p.caption || 'Моё фото')}</figcaption></figure>`).join('')
        );
      });
    }
  };

  const pick = (id: string) => {
    sel = id;
    el.querySelectorAll('.hot.sel').forEach((g) => g.classList.remove('sel'));
    el.querySelectorAll(`.hot[data-key="${CSS.escape(id)}"]`).forEach((g) => g.classList.add('sel'));
    el.querySelector('#card-host')!.innerHTML = keyCard(id);
    el.querySelector('#key-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  el.addEventListener('click', (e) => {
    const target = e.target as Element;
    const tb = target.closest<HTMLElement>('[data-tab]');
    if (tb) {
      tab = tb.dataset.tab as typeof tab;
      draw();
      return;
    }
    const k = target.closest<Element>('[data-key]');
    if (k) pick(k.getAttribute('data-key')!);
  });
  el.addEventListener('keydown', (e) => {
    const k = (e.target as Element).closest?.('.hot');
    if (k && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      pick(k.getAttribute('data-key')!);
    }
  });
  draw();
};

export const displayPage: Page = (el) => {
  el.innerHTML = `<h1>🔤 ${t('display')}</h1>
    <p class="muted">Значки нарисованы упрощённо — смотри на подпись. Номера страниц: OM — Operating Manual, AM — Advance Manual.</p>
    <h2>Значки</h2>
    <div class="table-wrap"><table><thead><tr><th>Значок</th><th>Что значит</th><th>Стр.</th></tr></thead><tbody>
    ${displayIcons.map((d) => `<tr><td><span class="lcd">${esc(d.icon)}</span></td><td>${esc(d.meaning)}</td><td class="muted">${esc(d.page)}</td></tr>`).join('')}
    </tbody></table></div>
    <h2 class="mt">Надписи и сообщения</h2>
    <div class="table-wrap"><table><thead><tr><th>Надпись</th><th>Что значит</th><th>Что делать</th></tr></thead><tbody>
    ${lcdMessages.map((m) => `<tr><td><span class="lcd">${esc(m.text)}</span></td><td>${esc(m.meaning)} <span class="muted">(${esc(m.page)})</span></td><td>${rich(m.action)}</td></tr>`).join('')}
    </tbody></table></div>`;
};
