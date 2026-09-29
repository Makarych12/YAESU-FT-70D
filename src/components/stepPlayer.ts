import type { Step } from '../lib/types';
import { store } from '../lib/store';
import { t } from '../lib/i18n';
import { esc, keysRow, lcd, rich } from './ui';
import { speech } from './speech';

/**
 * Показ шагов. Режим «по одному шагу» (крупно, кнопки Дальше/Назад, свайп)
 * или «весь список сразу». Выбор запоминается.
 */
export function stepPlayer(host: HTMLElement, steps: Step[], opts: { id: string; unverifiedAll?: boolean }) {
  let i = 0;
  let mode = store.settings.stepMode;
  let speaking = false;

  const stepHtml = (s: Step, n: number, compact: boolean) => `
    <article class="step ${compact ? 'step-compact' : ''}" aria-label="${t('step')} ${n + 1}">
      ${compact ? `<div class="step-num" aria-hidden="true">${n + 1}</div>` : ''}
      <div class="step-body">
        <p class="step-text">${rich(s.text)}</p>
        ${s.keys?.length ? keysRow(s.keys, !compact) : ''}
        ${s.lcd ? `<div class="step-lcd"><span class="lbl">На экране:</span> ${lcd(s.lcd, !compact)}</div>` : ''}
        ${s.tip ? `<div class="note note-tip"><span class="note-ico" aria-hidden="true">💡</span><div>${rich(s.tip)}</div></div>` : ''}
        ${s.check ? `<div class="note note-check"><span class="note-ico" aria-hidden="true">⚠️</span><div><strong>${t('checkOnRadio')}.</strong> ${rich(s.check)}</div></div>` : ''}
      </div>
    </article>`;

  const render = () => {
    speech.stop();
    speaking = false;
    const canSpeak = store.settings.voice && speech.available();
    const toggle = `<div class="seg" role="group" aria-label="Как показывать шаги">
        <button class="btn ${mode === 'step' ? 'on' : ''}" data-mode="step" aria-pressed="${mode === 'step'}">👣 ${t('stepMode')}</button>
        <button class="btn ${mode === 'list' ? 'on' : ''}" data-mode="list" aria-pressed="${mode === 'list'}">📜 ${t('listMode')}</button>
      </div>`;
    if (mode === 'list') {
      host.innerHTML = `${toggle}<div class="step-list">${steps.map((s, n) => stepHtml(s, n, true)).join('')}</div>`;
      return;
    }
    if (i >= steps.length) {
      host.innerHTML = `${toggle}<div class="step-done"><div class="big-emoji" aria-hidden="true">🎉</div>
        <h2>${t('done')}</h2><p>${t('doneText')}</p>
        <div class="player-nav"><button class="btn btn-big" data-go="restart">↺ ${t('again')}</button>
        <a class="btn btn-big btn-primary" href="#/">🏠 ${t('home')}</a></div></div>`;
      return;
    }
    const pct = Math.round(((i + 1) / steps.length) * 100);
    host.innerHTML = `${toggle}
      <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${i + 1}">
        <div class="progress-label">${t('step')} <b>${i + 1}</b> ${t('of')} ${steps.length}</div>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="step-stage" aria-live="polite">${stepHtml(steps[i], i, false)}</div>
      ${canSpeak ? `<button class="btn btn-wide" data-speak>🔊 ${t('readAloud')}</button>` : ''}
      <div class="player-nav sticky-nav">
        <button class="btn btn-big" data-go="prev" ${i === 0 ? 'disabled' : ''}>◀ ${t('prev')}</button>
        <button class="btn btn-big btn-primary" data-go="next">${i === steps.length - 1 ? `✓ ${t('done')}` : `${t('next')} ▶`}</button>
      </div>`;
    host.querySelector('.step-stage')?.classList.add('enter');
  };

  host.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-go],[data-mode],[data-speak]');
    if (!b) return;
    if (b.dataset.mode) {
      mode = b.dataset.mode as 'step' | 'list';
      store.setSetting('stepMode', mode);
      render();
    } else if (b.dataset.go === 'next') {
      i++;
      render();
      host.scrollIntoView({ block: 'start' });
    } else if (b.dataset.go === 'prev') {
      i = Math.max(0, i - 1);
      render();
    } else if (b.dataset.go === 'restart') {
      i = 0;
      render();
    } else if (b.hasAttribute('data-speak')) {
      if (speaking) {
        speech.stop();
        speaking = false;
        b.innerHTML = `🔊 ${t('readAloud')}`;
      } else {
        const s = steps[i];
        speaking = true;
        b.innerHTML = `⏹ ${t('stop')}`;
        speech.say(`${t('step')} ${i + 1}. ${s.text}. ${s.tip ?? ''}`, () => {
          speaking = false;
          b.innerHTML = `🔊 ${t('readAloud')}`;
        });
      }
    }
  });

  // свайп влево/вправо
  let x0: number | null = null;
  host.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  host.addEventListener('touchend', (e) => {
    if (x0 === null || mode !== 'step') return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) < 70) return;
    if (dx < 0 && i < steps.length) i++;
    else if (dx > 0 && i > 0) i--;
    render();
  });

  void esc;
  void opts;
  render();
  return { stop: () => speech.stop() };
}
