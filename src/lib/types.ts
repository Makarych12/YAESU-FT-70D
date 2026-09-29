/**
 * Типы контента. Весь текст инструкций лежит в src/content/<язык>/*.json —
 * чтобы исправить текст, не нужно трогать код.
 *
 * Обозначения кнопок в поле keys (и в тексте в квадратных скобках, например «Нажми [F]»):
 *   F, GM, MODE, BAND, HM/RV, AMS, V/M, 0…9, PTT, MONI, VOL, POWER, DIAL
 *   hold:X   — нажать и держать кнопку X (больше секунды)
 *   A&B      — нажать вместе (например VOL&DIAL — держать VOL и крутить ручку)
 * В тексте {{…}} — надпись на экране рации (рисуется как LCD).
 */
export interface Step {
  text: string;
  keys?: string[];
  lcd?: string | null;
  tip?: string | null;
  /** Шаг не удалось подтвердить по мануалу — показать «⚠️ проверить на рации» */
  check?: string | null;
}

export interface Instruction {
  id: string;
  title: string;
  section: string;
  keywords: string[];
  difficulty: 1 | 2 | 3;
  verified: boolean;
  manualRef: string;
  intro?: string;
  steps: Step[];
  warning?: string;
  /** Опасное действие (сброс, прошивка, удаление) — красная рамка и подтверждение */
  danger?: boolean;
  related?: string[];
}

export interface Section {
  id: string;
  letter: string;
  icon: string;
  title: string;
  short: string;
  description: string;
}

export interface MenuItem {
  no: number;
  usaNo?: number;
  name: string;
  what: string;
  options: string;
  def: string;
  recommend: string;
  /** green — можно смело, yellow — только если понимаешь зачем, red — лучше не трогать */
  safety: 'green' | 'yellow' | 'red';
  page: string;
  note?: string;
}

export interface GlossaryItem {
  term: string;
  aka?: string;
  text: string;
}

export interface Tip {
  id: string;
  title: string;
  text: string;
  source: string;
  sourceUrl?: string;
  verified: boolean;
}

export interface DisplayIcon {
  icon: string;
  lcd?: string;
  meaning: string;
  page: string;
}

export interface LcdMessage {
  text: string;
  meaning: string;
  action: string;
  page: string;
}

export interface CheatItem {
  what: string;
  keys: string[];
}

export interface RadioKeyInfo {
  id: string;
  label: string;
  where: string;
  press: string;
  fPress?: string;
  hold?: string;
  more?: string;
  related?: string[];
}

export type ToneMode = 'none' | 'tone' | 'tsql' | 'dcs' | 't1750';
export type RptMode = 'FM' | 'C4FM';

export interface Repeater {
  id: string;
  name: string;
  city: string;
  callsign?: string;
  /** частота выхода репитера (то, что слушаем), МГц */
  freq: number;
  shiftDir: '-' | '+' | 'simplex';
  /** величина сдвига, МГц */
  shift: number;
  toneMode: ToneMode;
  tone?: number;
  dcs?: string;
  mode: RptMode;
  dgid?: number;
  note?: string;
  source?: string;
  sourceUrl?: string;
  checked?: string;
  status?: 'ok' | 'unknown' | 'off';
  /** true — репитер из встроенного списка, false — добавлен вручную */
  builtin?: boolean;
  shiftAssumed?: boolean;
}
