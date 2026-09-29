import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/latin-400.css';
import '@fontsource/golos-text/cyrillic-600.css';
import '@fontsource/golos-text/latin-600.css';
import '@fontsource/golos-text/cyrillic-700.css';
import '@fontsource/golos-text/latin-700.css';
import '@fontsource/golos-text/cyrillic-800.css';
import '@fontsource/golos-text/latin-800.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import './styles/main.css';

import { store } from './lib/store';
import { t } from './lib/i18n';
import { speech } from './components/speech';
import { toast } from './components/ui';
import { homePage } from './pages/home';
import { sectionPage, instructionPage } from './pages/section';
import { radioPage, displayPage } from './pages/radio';
import { setMenuPage } from './pages/setmenu';
import { repeatersPage, repeaterStepsPage, repeaterShowPage, repeaterFormPage, wizardPage } from './pages/repeaters';
import { searchPage, glossaryPage, tipsPage, cheatPage, favPage, settingsPage, sourcesPage, photosPage } from './pages/misc';

export type Cleanup = void | (() => void);
export type Page = (el: HTMLElement, params: string[]) => Cleanup;

const routes: [RegExp, Page][] = [
  [/^\/?$/, homePage],
  [/^\/s\/([\w-]+)$/, sectionPage],
  [/^\/i\/([\w-]+)$/, instructionPage],
  [/^\/radio(?:\/([\w/-]+))?$/, radioPage],
  [/^\/display$/, displayPage],
  [/^\/set(?:\/(\d+))?$/, setMenuPage],
  [/^\/rpt$/, repeatersPage],
  [/^\/rpt\/new$/, repeaterFormPage],
  [/^\/rpt\/([\w-]+)\/edit$/, repeaterFormPage],
  [/^\/rpt\/([\w-]+)\/steps$/, repeaterStepsPage],
  [/^\/rpt\/([\w-]+)\/show$/, repeaterShowPage],
  [/^\/wizard$/, wizardPage],
  [/^\/search(?:\/(.*))?$/, searchPage],
  [/^\/glossary(?:\/(.*))?$/, glossaryPage],
  [/^\/tips(?:\/([\w-]+))?$/, tipsPage],
  [/^\/cheat$/, cheatPage],
  [/^\/fav$/, favPage],
  [/^\/settings$/, settingsPage],
  [/^\/sources$/, sourcesPage],
  [/^\/photos$/, photosPage],
];

function applySettings() {
  const s = store.settings;
  document.documentElement.style.setProperty('--scale', String(s.fontScale));
  document.documentElement.dataset.theme = s.theme;
  document.documentElement.lang = s.lang;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.theme === 'dark' ? '#0b0d10' : '#f6f2ea');
}

const app = document.getElementById('app')!;
let cleanup: Cleanup;

export function setTitle(title: string) {
  document.title = title ? `${title} · FT-70D` : t('appName');
  const el = document.getElementById('bar-title');
  if (el) el.textContent = title;
}

function shell() {
  app.innerHTML = `
    <header class="topbar no-print">
      <button class="btn" id="btn-back" aria-label="${t('back')}">⬅ ${t('back')}</button>
      <div class="title" id="bar-title"></div>
      <a class="btn" href="#/" id="btn-home" aria-label="${t('home')}">🏠 ${t('home')}</a>
    </header>
    <main class="wrap" id="view" tabindex="-1"></main>`;
  document.getElementById('btn-back')!.addEventListener('click', () => {
    if (history.length > 1 && sessionStorage.getItem('ft70d:nav')) history.back();
    else location.hash = '#/';
  });
}

function route() {
  const path = decodeURIComponent(location.hash.replace(/^#/, '') || '/');
  if (typeof cleanup === 'function') cleanup();
  speech.stop();
  const view = document.getElementById('view')!;
  view.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';
  view.append(page);
  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (m) {
      setTitle('');
      cleanup = fn(page, m.slice(1).filter((x) => x !== undefined));
      window.scrollTo(0, 0);
      const h1 = page.querySelector('h1');
      if (h1 && path !== '/') setTitle(h1.textContent ?? '');
      view.focus({ preventScroll: true });
      return;
    }
  }
  page.innerHTML = `<h1>Страница не найдена</h1><a class="btn btn-big btn-primary" href="#/">🏠 ${t('home')}</a>`;
}

applySettings();
shell();
store.onChange(applySettings);
window.addEventListener('hashchange', () => {
  sessionStorage.setItem('ft70d:nav', '1');
  route();
});
route();

/* ---------- Офлайн: service worker ---------- */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      if (!hadController) {
        navigator.serviceWorker.ready.then(() => toast('✅ ' + t('offlineReady')));
      }
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'activated' && hadController) {
            const b = document.createElement('button');
            b.className = 'btn btn-big btn-primary update-bar';
            b.textContent = '🔄 ' + t('updateReady');
            b.onclick = () => location.reload();
            document.body.append(b);
          }
        });
      });
    });
  });
}
