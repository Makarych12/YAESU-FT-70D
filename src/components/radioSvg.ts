/**
 * Собственные схематичные рисунки FT-70D (не копия фото).
 * Расположение органов управления сверено с Operating Manual, стр. 2–5.
 * Каждый элемент с data-key кликабелен → карточка «что делает эта кнопка».
 */

function hot(key: string, label: string, inner: string) {
  return `<g class="hot" data-key="${key}" tabindex="0" role="button" aria-label="${label}">${inner}</g>`;
}

const DEFS = `<defs>
  <linearGradient id="gBody" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="var(--rb-body-1)"/><stop offset="1" stop-color="var(--rb-body-2)"/></linearGradient>
  <linearGradient id="gEdge" x1="0" x2="1"><stop offset="0" stop-color="var(--rb-edge-1)"/><stop offset=".5" stop-color="var(--rb-edge-2)"/><stop offset="1" stop-color="var(--rb-edge-1)"/></linearGradient>
  <linearGradient id="gLcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc766"/><stop offset="1" stop-color="#f0a02a"/></linearGradient>
  <linearGradient id="gKey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--rb-key-1)"/><stop offset="1" stop-color="var(--rb-key-2)"/></linearGradient>
  <linearGradient id="gFn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7b54"/><stop offset="1" stop-color="#d9462a"/></linearGradient>
  <linearGradient id="gKnob" x1="0" x2="1"><stop offset="0" stop-color="#2a2e34"/><stop offset=".45" stop-color="#5b626c"/><stop offset="1" stop-color="#1b1e22"/></linearGradient>
  <linearGradient id="gBatt" x1="0" x2="1"><stop offset="0" stop-color="#23272d"/><stop offset="1" stop-color="#0f1114"/></linearGradient>
  <radialGradient id="gLed" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#b8ffcf"/><stop offset=".6" stop-color="#2fd36f"/><stop offset="1" stop-color="#0c6b32"/></radialGradient>
  <filter id="fShadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>
</defs>`;

function key(k: string, x: number, y: number, w: number, h: number, main: string, sub = '', letters = '', fn = false) {
  return hot(
    k,
    `Кнопка ${main}`,
    `<rect class="k-hit" x="${x - 3}" y="${y - 15}" width="${w + 6}" height="${h + 18}" rx="8"/>
     ${sub ? `<text class="k-sub" x="${x + w / 2}" y="${y - 4}">${sub}</text>` : ''}
     <rect class="k-cap" x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="url(#${fn ? 'gFn' : 'gKey'})"/>
     <text class="k-main${fn ? ' k-main-fn' : ''}" x="${x + w / 2}" y="${y + h / 2 + (letters ? 1 : 6)}">${main}</text>
     ${letters ? `<text class="k-let" x="${x + w / 2}" y="${y + h - 6}">${letters}</text>` : ''}`
  );
}

export function radioFront(): string {
  const cols = [86, 126, 166, 206, 246];
  const rows = [506, 572, 638];
  const grid = [
    [['MODE', 'MODE', ''], ['1', '1', 'TX PO'], ['2', '2', 'SCAN', 'ABC'], ['3', '3', 'DTMF', 'DEF'], ['BAND', 'BAND', 'BND DN']],
    [['HM/RV', 'HM/RV', ''], ['4', '4', 'STEP', 'GHI'], ['5', '5', 'SQ TYP', 'JKL'], ['6', '6', 'CODE', 'MNO'], ['V/M', 'V/M', 'DW']],
    [['AMS', 'AMS', ''], ['7', '7', 'P1', 'PQRS'], ['8', '8', 'P2', 'TUV'], ['9', '9', 'SKIP', 'WXYZ'], ['0', '0', 'RPT', '']],
  ];
  const keys = grid
    .map((row, r) =>
      row
        .map(([k, main, sub, letters], c) => {
          const small = main.length > 2;
          return key(k, cols[c], rows[r], 34, 42, small ? `<tspan font-size="10">${main}</tspan>` : main, sub, letters ?? '');
        })
        .join('')
    )
    .join('');

  const grille = Array.from({ length: 7 }, (_, i) => `<rect x="158" y="${378 + i * 12}" width="${118 - (i % 2) * 6}" height="5" rx="2.5" class="grille"/>`).join('');
  const knobRibs = Array.from({ length: 13 }, (_, i) => `<rect x="${226 + i * 5.2}" y="118" width="2.4" height="64" rx="1" class="rib"/>`).join('');

  return `<svg class="radio-svg" viewBox="0 0 360 720" role="group" aria-label="Передняя панель FT-70D. Нажми на кнопку, чтобы узнать, что она делает.">
  ${DEFS}
  <!-- антенна -->
  ${hot('ANT', 'Антенна', `
    <rect class="k-hit" x="78" y="4" width="46" height="196" rx="10"/>
    <path d="M96 10 Q101 4 106 10 L110 150 L92 150 Z" class="ant"/>
    ${Array.from({ length: 5 }, (_, i) => `<rect x="${88 - i * .3}" y="${150 + i * 8}" width="${26 + i * .6}" height="6" rx="2" class="ant-base"/>`).join('')}
    <rect x="84" y="190" width="34" height="12" rx="3" class="sma"/>`)}
  <!-- ручка -->
  ${hot('DIAL', 'Ручка DIAL', `
    <rect class="k-hit" x="214" y="104" width="94" height="96" rx="12"/>
    <rect x="220" y="112" width="80" height="76" rx="12" fill="url(#gKnob)" filter="url(#fShadow)"/>
    ${knobRibs}
    <rect x="232" y="186" width="56" height="16" rx="4" class="knob-base"/>`)}
  <!-- корпус -->
  <rect x="52" y="196" width="258" height="512" rx="34" fill="url(#gBody)" filter="url(#fShadow)" class="body"/>
  <rect x="52" y="196" width="258" height="512" rx="34" class="body-rim"/>
  <!-- светодиод -->
  ${hot('LED', 'Лампочка MODE/STATUS', `
    <rect class="k-hit" x="134" y="192" width="72" height="24" rx="8"/>
    <rect x="140" y="198" width="60" height="12" rx="6" fill="url(#gLed)" class="led"/>`)}
  <!-- левые боковые кнопки -->
  ${hot('PTT', 'Кнопка PTT — передача', `<rect class="k-hit" x="26" y="286" width="40" height="112" rx="10"/><rect x="36" y="296" width="20" height="92" rx="8" class="side-key"/><text class="side-lbl" x="18" y="345" transform="rotate(-90 18 345)">PTT</text>`)}
  ${hot('MONI', 'Кнопка MONI/T.CALL', `<rect class="k-hit" x="26" y="404" width="40" height="46" rx="10"/><rect x="38" y="410" width="18" height="34" rx="7" class="side-key"/><text class="side-lbl" x="18" y="427" transform="rotate(-90 18 427)">MONI</text>`)}
  ${hot('VOL', 'Кнопка VOL — громкость', `<rect class="k-hit" x="26" y="456" width="40" height="46" rx="10"/><rect x="38" y="462" width="18" height="34" rx="7" class="side-key"/><text class="side-lbl" x="18" y="479" transform="rotate(-90 18 479)">VOL</text>`)}
  ${hot('POWER', 'Кнопка POWER/LOCK — питание и блокировка', `<rect class="k-hit" x="26" y="508" width="40" height="46" rx="10"/><rect x="38" y="514" width="18" height="34" rx="7" class="side-key side-power"/><text class="side-lbl" x="18" y="531" transform="rotate(-90 18 531)">PWR</text>`)}
  <!-- экран -->
  ${hot('LCD', 'Экран', `
    <rect class="k-hit" x="72" y="222" width="218" height="140" rx="16"/>
    <rect x="76" y="226" width="210" height="132" rx="16" class="bezel"/>
    <text x="181" y="246" class="brand">YAESU</text>
    <rect x="92" y="256" width="178" height="78" rx="6" fill="url(#gLcd)"/>
    <text x="100" y="272" class="lcd-ico">AMS</text><text x="100" y="288" class="lcd-ico">FM</text>
    <text x="140" y="272" class="lcd-ico">−  T</text>
    <text x="264" y="314" class="lcd-digits" text-anchor="end">145.675</text>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${100 + i * 6}" y="${330 - i}" width="4" height="${2 + i}" class="lcd-bar"/>`).join('')}
    <text x="100" y="352" class="model-dig">Digital</text><text x="272" y="352" class="model-name" text-anchor="end">FT-70D</text>`)}
  <!-- микрофон и динамик -->
  ${hot('MIC', 'Микрофон', `<rect class="k-hit" x="66" y="362" width="30" height="30" rx="8"/><circle cx="80" cy="376" r="4" class="mic"/>`)}
  ${hot('SPK', 'Динамик', `<rect class="k-hit" x="152" y="370" width="130" height="90" rx="10"/>${grille}`)}
  <!-- GM и F -->
  ${key('GM', 86, 388, 56, 30, 'GM', '', '', true)}
  ${key('F', 86, 438, 56, 30, 'F', '', '', true)}
  ${keys}
  <text x="181" y="700" class="foot">схема · не фото</text>
</svg>`;
}

export function radioSide(): string {
  return `<svg class="radio-svg side" viewBox="0 0 200 720" role="group" aria-label="Правый бок FT-70D с разъёмами">
  ${DEFS}
  <rect x="72" y="112" width="44" height="76" rx="10" fill="url(#gKnob)"/>
  <rect x="56" y="196" width="90" height="512" rx="26" fill="url(#gBody)" filter="url(#fShadow)"/>
  <rect x="120" y="230" width="40" height="460" rx="14" fill="url(#gBatt)" class="batt-side"/>
  ${hot('BATT', 'Аккумулятор', `<rect class="k-hit" x="118" y="228" width="46" height="464" rx="14"/><text class="side-lbl2" x="148" y="470" transform="rotate(-90 148 470)">SBR-24LI</text>`)}
  ${hot('MICSP', 'Гнездо MIC/SP', `<rect class="k-hit" x="60" y="268" width="62" height="88" rx="10"/><rect x="68" y="276" width="46" height="72" rx="10" class="cap"/><text class="cap-lbl" x="91" y="306">MIC</text><text class="cap-lbl" x="91" y="322">SP</text>`)}
  ${hot('DATA', 'Гнездо DATA (USB)', `<rect class="k-hit" x="60" y="372" width="62" height="92" rx="10"/><rect x="68" y="380" width="46" height="76" rx="10" class="cap"/><text class="cap-lbl" x="91" y="422">DATA</text>`)}
  ${hot('SWITCH', 'Переключатель PROGRAM (для прошивки)', `<rect class="k-hit" x="40" y="398" width="26" height="40" rx="6"/><rect x="48" y="406" width="10" height="24" rx="3" class="switch"/><rect x="49" y="414" width="8" height="8" rx="2" class="switch-knob"/>`)}
  ${hot('DCIN', 'Гнездо EXT DC IN', `<rect class="k-hit" x="60" y="480" width="62" height="92" rx="10"/><rect x="68" y="488" width="46" height="76" rx="10" class="cap"/><text class="cap-lbl" x="91" y="522">EXT</text><text class="cap-lbl" x="91" y="538">DC IN</text>`)}
  <circle cx="134" cy="210" r="6" class="strap"/>
  <text x="100" y="700" class="foot">правый бок</text>
</svg>`;
}

/** «Разобранный вид»: основные части, которые пользователь сам снимает и ставит */
export function radioExploded(): string {
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" class="leader"/><circle cx="${x2}" cy="${y2}" r="3.5" class="leader-dot"/>`;
  return `<svg class="radio-svg exploded" viewBox="0 0 760 580" role="group" aria-label="Разобранный вид FT-70D: антенна, корпус, аккумулятор, клипса, заглушки">
  ${DEFS}
  <!-- антенна отдельно -->
  ${hot('ANT', 'Антенна', `
    <rect class="k-hit" x="36" y="30" width="70" height="250" rx="12"/>
    <g transform="rotate(-8 70 150)"><path d="M66 36 Q71 30 76 36 L80 220 L62 220 Z" class="ant"/>
    ${Array.from({ length: 5 }, (_, i) => `<rect x="${58}" y="${220 + i * 9}" width="26" height="7" rx="2" class="ant-base"/>`).join('')}</g>
    <text class="exp-lbl" x="70" y="312">Антенна</text>`)}
  ${line(96, 250, 196, 150)}
  <!-- корпус -->
  <g transform="translate(180 60)">
    <rect x="30" y="0" width="54" height="50" rx="10" fill="url(#gKnob)"/>
    <rect x="0" y="54" width="200" height="400" rx="28" fill="url(#gBody)" filter="url(#fShadow)"/>
    <rect x="18" y="74" width="164" height="104" rx="12" class="bezel"/>
    <rect x="30" y="92" width="140" height="62" rx="5" fill="url(#gLcd)"/>
    <text x="164" y="134" class="lcd-digits" text-anchor="end" font-size="26">145.675</text>
    ${Array.from({ length: 3 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<rect x="${22 + c * 33}" y="${270 + r * 52}" width="26" height="34" rx="7" fill="url(#gKey)"/>`).join('')).join('')}
    <rect x="22" y="200" width="44" height="22" rx="6" fill="url(#gFn)"/><rect x="22" y="232" width="44" height="22" rx="6" fill="url(#gFn)"/>
    ${Array.from({ length: 5 }, (_, i) => `<rect x="90" y="${204 + i * 10}" width="86" height="4" rx="2" class="grille"/>`).join('')}
    <text x="100" y="480" class="exp-lbl">Корпус</text>
  </g>
  <!-- заглушки -->
  ${hot('DCIN', 'Резиновые заглушки гнёзд', `
    <rect class="k-hit" x="404" y="150" width="70" height="210" rx="12"/>
    <rect x="418" y="160" width="42" height="190" rx="14" class="cap"/>
    <text class="cap-lbl" x="439" y="210">MIC</text><text class="cap-lbl" x="439" y="258">DATA</text><text class="cap-lbl" x="439" y="306">DC IN</text>
    <text class="exp-lbl" x="439" y="392">Заглушки</text>`)}
  ${line(404, 250, 384, 250)}
  <!-- аккумулятор -->
  ${hot('BATT', 'Аккумулятор SBR-24LI', `
    <rect class="k-hit" x="494" y="90" width="150" height="420" rx="18"/>
    <rect x="504" y="100" width="130" height="400" rx="20" fill="url(#gBatt)" filter="url(#fShadow)"/>
    <rect x="520" y="120" width="98" height="60" rx="8" class="batt-label"/>
    <text x="569" y="146" class="batt-t1">SBR-24LI</text><text x="569" y="168" class="batt-t2">7.4 V · 1800 mAh</text>
    <rect x="530" y="440" width="78" height="22" rx="6" class="latch"/><text x="569" y="456" class="batt-t2">LOCK ⇆ UNLOCK</text>
    <rect x="548" y="408" width="42" height="18" rx="4" class="push"/><text x="569" y="421" class="batt-t3">PUSH</text>
    <text class="exp-lbl" x="569" y="540">Аккумулятор</text>`)}
  ${line(504, 300, 390, 300)}
  <!-- клипса -->
  ${hot('CLIP', 'Клипса на ремень', `
    <rect class="k-hit" x="664" y="150" width="84" height="300" rx="12"/>
    <path d="M680 160 h52 a8 8 0 0 1 8 8 v250 q0 20 -20 20 h-12 q-20 0 -20 -20 v-200 h-8 z" class="clip"/>
    <circle cx="706" cy="200" r="5" class="screw"/><circle cx="706" cy="236" r="5" class="screw"/>
    <text class="exp-lbl" x="706" y="480">Клипса</text><text class="exp-lbl small" x="706" y="504">2 винта</text>`)}
  ${line(664, 220, 640, 220)}
</svg>`;
}
