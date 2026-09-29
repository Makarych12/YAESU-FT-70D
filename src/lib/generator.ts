import type { Repeater, Step } from './types';

/**
 * Генератор пошаговой инструкции «Как настроить рацию на этот репитер».
 * Каждое действие — из официальных мануалов (Operating Manual стр. 15–25, Advance Manual стр. 7–9, 38).
 */

/** 50 тонов CTCSS FT-70D (Advance Manual, стр. 8: 67,0–254,1 Гц) */
export const CTCSS = [
  67.0, 69.3, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9, 114.8, 118.8, 123.0,
  127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 159.8, 162.2, 165.5, 167.9, 171.3, 173.8, 177.3, 179.9, 183.5, 186.2,
  189.9, 192.8, 196.6, 199.5, 203.5, 206.5, 210.7, 218.1, 225.7, 229.1, 233.6, 241.8, 250.3, 254.1,
];

/** 104 кода DCS (Advance Manual, стр. 9: 023–754) */
export const DCS = (
  '023 025 026 031 032 036 043 047 051 053 054 065 071 072 073 074 114 115 116 122 125 131 132 134 143 145 152 155 156 ' +
  '162 165 172 174 205 212 223 225 226 243 244 245 246 251 252 255 261 263 265 266 271 274 306 311 315 325 331 332 343 ' +
  '346 351 356 364 365 371 411 412 413 423 431 432 445 446 452 454 455 462 464 465 466 503 506 516 523 526 532 546 565 ' +
  '606 612 624 627 631 632 654 662 664 703 712 723 731 732 734 743 754'
).split(' ');

export type Band = '2m' | '70cm' | 'other';

export function bandOf(f: number): Band {
  if (f >= 144 && f <= 146) return '2m';
  if (f >= 430 && f <= 440) return '70cm';
  return 'other';
}

/** Можно ли FT-70DE передавать на этой частоте (European version: 144–146, 430–440 МГц — OM стр. 39) */
export function canTx(f: number) {
  return (f >= 144 && f <= 146) || (f >= 430 && f <= 440);
}

export function canRx(f: number) {
  return f >= 108 && f <= 580;
}

/** Типовой сдвиг по IARU Region 1 */
export function suggestShift(f: number): { dir: '-' | '+' | 'simplex'; shift: number; why: string } {
  if (f >= 145.575 && f <= 145.8) return { dir: '-', shift: 0.6, why: 'Выход репитера на 2 м (145,6–145,8 МГц): стандартный сдвиг −0,6 МГц.' };
  if (f >= 438.0 && f <= 440) return { dir: '-', shift: 7.6, why: 'Выход репитера на 70 см (438–440 МГц): стандартный сдвиг −7,6 МГц.' };
  if (f >= 434.5 && f < 438.0) return { dir: '-', shift: 1.6, why: 'На 434–435 МГц встречается сдвиг −1,6 МГц, но бывает и −7,6. Обязательно уточни.' };
  if (bandOf(f) === '2m') return { dir: 'simplex', shift: 0.6, why: 'Это не репитерный участок 2 м — скорее всего, симплекс (без сдвига).' };
  if (bandOf(f) === '70cm') return { dir: 'simplex', shift: 7.6, why: 'Это не типичный выход репитера 70 см — скорее всего, симплекс.' };
  return { dir: 'simplex', shift: 0, why: 'На этой частоте FT-70DE может только слушать.' };
}

export function txFreq(r: Pick<Repeater, 'freq' | 'shiftDir' | 'shift'>) {
  if (r.shiftDir === 'simplex') return r.freq;
  return +(r.freq + (r.shiftDir === '+' ? r.shift : -r.shift)).toFixed(4);
}

export function fmtFreq(f: number) {
  const s = f.toFixed(4);
  return s.endsWith('0') ? f.toFixed(3) : s;
}

function isStandardShift(r: Repeater) {
  const b = bandOf(r.freq);
  return (b === '2m' && Math.abs(r.shift - 0.6) < 1e-6) || (b === '70cm' && Math.abs(r.shift - 7.6) < 1e-6);
}

/* ---------- Имя канала: перевод в латиницу и нажатия кнопок ---------- */

const TR: Record<string, string> = {
  а: 'A', б: 'B', в: 'V', г: 'G', ґ: 'G', д: 'D', е: 'E', ё: 'E', є: 'E', ж: 'ZH', з: 'Z', и: 'I', і: 'I', ї: 'I', й: 'Y',
  к: 'K', л: 'L', м: 'M', н: 'N', о: 'O', п: 'P', р: 'R', с: 'S', т: 'T', у: 'U', ф: 'F', х: 'H', ц: 'C', ч: 'CH', ш: 'SH',
  щ: 'SH', ъ: '', ы: 'Y', ь: '', э: 'E', ю: 'YU', я: 'YA',
};

export function channelName(r: Repeater): string {
  const src = (r.callsign || r.name || r.city || 'RPT').toLowerCase();
  let out = '';
  for (const ch of src) out += TR[ch] ?? (/[a-z0-9]/.test(ch) ? ch.toUpperCase() : '');
  return out.slice(0, 6) || 'RPT';
}

/** Буквы на цифровых кнопках (Operating Manual, стр. 5, 14: [2] → A → B → C → 2) */
const KEYPAD: Record<string, string> = { '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ' };

export function charKeys(ch: string): { key: string; times: number } | null {
  for (const [k, letters] of Object.entries(KEYPAD)) {
    const i = letters.indexOf(ch);
    if (i >= 0) return { key: k, times: i + 1 };
    if (ch === k) return { key: k, times: letters.length + 1 };
  }
  return null;
}

export function nameSteps(name: string): Step[] {
  const steps: Step[] = [];
  [...name].forEach((ch, idx) => {
    const ck = charKeys(ch);
    const last = idx === name.length - 1;
    if (!ck) {
      steps.push({ text: `Символ «${ch}»: крути DIAL, пока не появится «${ch}»${last ? '.' : ', потом нажми [BAND].'}`, keys: last ? ['DIAL'] : ['DIAL', 'BAND'], lcd: name.slice(0, idx + 1) });
      return;
    }
    const presses = Array(ck.times).fill(ck.key);
    const word = ck.times === 1 ? 'один раз' : ck.times === 2 ? 'два раза' : ck.times === 3 ? 'три раза' : ck.times === 4 ? 'четыре раза' : 'пять раз';
    steps.push({
      text: `Буква «${ch}»: нажми [${ck.key}] ${word}${last ? '.' : ', потом [BAND] — курсор вправо.'}`,
      keys: last ? presses : [...presses, 'BAND'],
      lcd: name.slice(0, idx + 1),
      check: idx === 0 && !last ? 'Если после буквы курсор сам ушёл вправо — [BAND] не нажимай, иначе получится пробел.' : null,
    });
  });
  return steps;
}

/* ---------- Сам генератор ---------- */

export interface Generated {
  title: string;
  warnings: string[];
  steps: Step[];
}

export function generateSteps(r: Repeater, opts: { saveToMemory?: boolean } = { saveToMemory: true }): Generated {
  const warnings: string[] = [];
  const steps: Step[] = [];
  const f = fmtFreq(r.freq);
  const tx = txFreq(r);
  const txs = fmtFreq(tx);
  const digital = r.mode === 'C4FM';

  if (!canRx(r.freq)) warnings.push(`Частоту ${f} МГц FT-70DE не принимает (приём 108–580 МГц).`);
  if (!canTx(tx))
    warnings.push(`Передача на ${txs} МГц невозможна: европейская FT-70DE передаёт только на 144–146 и 430–440 МГц. Рация покажет ERROR.`);
  if (r.shiftAssumed) warnings.push('Величина сдвига взята стандартная (IARU). Если репитер не открывается — уточни сдвиг у местных радиолюбителей.');
  if (r.status === 'off') warnings.push('По данным источника этот репитер НЕ работает.');

  steps.push({ text: 'Включи рацию: держи боковую кнопку POWER, пока не загорится экран. Уже включена — пропусти этот шаг.', keys: ['hold:POWER'] });
  steps.push({ text: 'Если на экране номер канала памяти (слева маленькие цифры), нажми [V/M]. Нужен ручной режим частоты.', keys: ['V/M'] });

  // Режим (OM стр. 16–17)
  steps.push({
    text: 'Если на экране горит надпись {{AMS}}, подержи [AMS] секунду — AMS выключится. Нет надписи — пропусти.',
    keys: ['hold:AMS'],
    tip: digital ? 'Так рация точно будет передавать в цифре.' : 'Субтон и DCS работают только в FM. Так рация точно будет в FM.',
  });
  steps.push({
    text: digital ? 'Нажимай [MODE], пока на экране не появится {{DN}} (цифра).' : 'Нажимай [MODE], пока на экране не появится {{FM}}.',
    keys: ['MODE'],
    lcd: digital ? 'DN' : 'FM',
  });

  // Шаг 12,5 кГц для частот вида 145.7625 (OM стр. 15)
  const khz = Math.round(r.freq * 10000) / 10;
  const odd = Math.abs(khz - Math.round(khz)) > 1e-6;
  if (odd) {
    steps.push({ text: 'У этой частоты 4 знака после точки. Поставь шаг 12,5 кГц: нажми [F], потом [4].', keys: ['F', '4'], lcd: 'AUTO' });
    steps.push({ text: 'Крути DIAL до {{12.5}} и нажми PTT.', keys: ['DIAL', 'PTT'], lcd: '12.5' });
  }

  // Ввод частоты (OM стр. 15)
  const digits = r.freq.toFixed(3).replace('.', '').split('');
  steps.push({
    text: `Набери частоту цифрами: ${digits.join(', ')}.`,
    keys: digits,
    lcd: f,
    tip: 'Ошибся — нажми PTT, набор отменится, и набери снова.',
    check: odd ? `Если на экране ${r.freq.toFixed(3)}, а не ${f}, поверни DIAL на один щелчок вправо.` : null,
  });

  // Сдвиг (OM стр. 5, 23; меню 46 RPT.FRQ — AM стр. 38)
  if (r.shiftDir === 'simplex') {
    steps.push({
      text: 'Над частотой НЕ должно быть значков «−» и «+» (это симплекс). Если значок есть — нажимай [F] → [0], пока он не пропадёт.',
      keys: ['F', '0'],
      lcd: f,
    });
  } else {
    const sign = r.shiftDir === '-' ? '−' : '+';
    steps.push({
      text: `Над частотой должен быть значок «${sign}». Часто рация ставит его сама. Если его нет или стоит другой — нажимай [F] → [0], пока не появится «${sign}».`,
      keys: ['F', '0'],
      lcd: `${sign}  ${f}`,
      check: 'Если после [F] → [0] рация ждёт выбора — выбери ручкой DIAL и нажми PTT.',
    });
    if (!isStandardShift(r)) {
      steps.push({ text: `Сдвиг у этого репитера нестандартный: ${r.shift} МГц. Подержи [F] — откроется меню.`, keys: ['hold:F'] });
      steps.push({ text: 'Крути DIAL до {{46 RPT.FRQ}} и нажми [F].', keys: ['DIAL', 'F'], lcd: '46 RPT.FRQ' });
      steps.push({ text: `Крути DIAL до {{${r.shift.toFixed(2)}M}} и нажми PTT.`, keys: ['DIAL', 'PTT'], lcd: `${r.shift.toFixed(2)}M` });
    }
    steps.push({
      text: `Проверка без выхода в эфир: нажми [F] → [HM/RV] (реверс). На экране должна показаться частота передачи {{${txs}}}.`,
      keys: ['F', 'HM/RV'],
      lcd: txs,
      tip: `Другая частота? Значит, не тот сдвиг — ${isStandardShift(r) ? `проверь меню 46 RPT.FRQ (должно быть ${r.shift.toFixed(2)}M)` : 'повтори шаги со сдвигом'}.`,
    });
    steps.push({ text: 'Нажми [F] → [HM/RV] ещё раз — реверс выключится (значок перестанет мигать).', keys: ['F', 'HM/RV'], lcd: `${sign}  ${f}` });
  }

  // Тон / DCS / 1750 (AM стр. 7–9; OM стр. 23)
  if (!digital) {
    if (r.toneMode === 'tone' || r.toneMode === 'tsql') {
      const kind = r.toneMode === 'tone' ? 'TONE' : 'TSQL';
      steps.push({ text: 'Нажми [F], потом [5] — выбор типа тона.', keys: ['F', '5'] });
      steps.push({
        text: `Крути DIAL до {{${kind}}} и нажми PTT.`,
        keys: ['DIAL', 'PTT'],
        lcd: kind,
        tip: kind === 'TONE' ? 'TONE — рация посылает субтон, а слушает всех.' : 'TSQL — посылает субтон и слушает только сигналы с ним.',
      });
      const tone = (r.tone ?? 88.5).toFixed(1);
      steps.push({ text: 'Нажми [F], потом [6] — выбор частоты субтона.', keys: ['F', '6'] });
      steps.push({ text: `Крути DIAL до {{${tone}}} и нажми [F].`, keys: ['DIAL', 'F'], lcd: tone, tip: 'Если рация не вышла из настройки — нажми PTT.' });
    } else if (r.toneMode === 'dcs') {
      const code = r.dcs ?? '023';
      steps.push({ text: 'Нажми [F], потом [5] — выбор типа тона.', keys: ['F', '5'] });
      steps.push({ text: 'Крути DIAL до {{DCS}} и нажми PTT.', keys: ['DIAL', 'PTT'], lcd: 'DCS' });
      steps.push({ text: 'Нажми [F], потом [6] — выбор кода.', keys: ['F', '6'] });
      steps.push({ text: `Крути DIAL до {{${code}}} и нажми [F].`, keys: ['DIAL', 'F'], lcd: code });
    } else {
      steps.push({
        text: 'Этому репитеру субтон не нужен. Проверь, что тон выключен: нажми [F] → [5], крути DIAL до {{OFF}}, нажми PTT.',
        keys: ['F', '5', 'DIAL', 'PTT'],
        lcd: 'OFF',
      });
      if (r.toneMode === 't1750')
        steps.push({
          text: 'Этот репитер открывается тоном 1750 Гц. Перед первой фразой подержи боковую кнопку MONI/T.CALL 1–2 секунды.',
          keys: ['hold:MONI'],
          tip: 'Если кнопка не пищит, а открывает шумодав — в меню 32 M/T-CL поставь T-CALL.',
        });
    }
  } else {
    // DG-ID (OM стр. 19–20, 23)
    const dg = String(r.dgid ?? 0).padStart(2, '0');
    steps.push({ text: 'Подержи [MODE] — откроется DG-ID. Замигает номер передачи {{T..}}.', keys: ['hold:MODE'], lcd: 'T00' });
    steps.push({
      text: `Крути DIAL до {{T${dg}}}.`,
      keys: ['DIAL'],
      lcd: `T${dg}`,
      tip: dg === '00' ? '00 — «для всех». Большинство репитеров открыты для 00.' : `Репитер пускает только станции с DG-ID ${dg}.`,
    });
    steps.push({ text: 'Нажми [MODE]. Замигает номер приёма — поставь ручкой {{R00}}, чтобы слышать всех.', keys: ['MODE', 'DIAL'], lcd: 'R00' });
    steps.push({ text: 'Подержи [MODE] — сохранится.', keys: ['hold:MODE'] });
  }

  // Запись в память (OM стр. 25)
  if (opts.saveToMemory) {
    const name = channelName(r);
    steps.push({
      text: 'Теперь запишем репитер в память, чтобы потом не настраивать. Подержи [V/M] — замигает номер канала.',
      keys: ['hold:V/M'],
    });
    steps.push({
      text: 'Крути DIAL и выбери свободный номер (свободные мигают). Нажми [V/M].',
      keys: ['DIAL', 'V/M'],
      tip: 'Если появилось {{M-WRT?}} — канал занят. Нажми [V/M], только если его не жалко перезаписать.',
    });
    steps.push({ text: `Введём имя {{${name}}}. Сначала сотри старое: подержи [GM].`, keys: ['hold:GM'] });
    steps.push(...nameSteps(name));
    steps.push({ text: 'Подержи [V/M] — рация пискнет. Канал записан!', keys: ['hold:V/M'], lcd: name });
  }

  steps.push({
    text: 'Проверка: нажми PTT, скажи «UR4MAD, проверка» и отпусти. Слышен «хвост» или ответ — всё работает!',
    keys: ['PTT'],
    tip: 'Тишина? Открой 🆘 «Не открывается репитер».',
  });

  return { title: `${r.name} — ${f} МГц`, warnings, steps };
}
