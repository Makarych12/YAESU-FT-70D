import type {
  CheatItem, DisplayIcon, GlossaryItem, Instruction, LcdMessage, MenuItem, RadioKeyInfo, Repeater, Section, Tip,
} from './types';
import { store } from './store';

import sectionsRu from '../content/ru/sections.json';
import sectionsUk from '../content/uk/sections.json';
import intro from '../content/ru/intro.json';
import first from '../content/ru/first.json';
import freq from '../content/ru/freq.json';
import repeater from '../content/ru/repeater.json';
import memory from '../content/ru/memory.json';
import scan from '../content/ru/scan.json';
import digital from '../content/ru/digital.json';
import wires from '../content/ru/wires.json';
import battery from '../content/ru/battery.json';
import firmware from '../content/ru/firmware.json';
import help from '../content/ru/help.json';
import menuSet from '../content/ru/menu-set.json';
import glossaryRu from '../content/ru/glossary.json';
import tipsRu from '../content/ru/tips.json';
import displayRu from '../content/ru/display.json';
import cheatRu from '../content/ru/cheatsheet.json';
import keysRu from '../content/ru/keys.json';
import repeatersRu from '../content/ru/repeaters.json';

/*
 * Украинский перевод инструкций пока не сделан — показываем русские тексты.
 * Чтобы перевести раздел: создай src/content/uk/<раздел>.json с теми же id и подключи тут.
 */

export const instructions: Instruction[] = [
  ...intro, ...first, ...freq, ...repeater, ...memory, ...scan, ...digital, ...wires, ...battery, ...firmware, ...help,
] as Instruction[];

const byId = new Map(instructions.map((i) => [i.id, i]));

export function getInstruction(id: string) {
  return byId.get(id);
}

export function sections(): Section[] {
  return (store.settings.lang === 'uk' ? sectionsUk : sectionsRu) as Section[];
}
export function section(id: string) {
  return sections().find((s) => s.id === id);
}
export function sectionInstructions(id: string) {
  return instructions.filter((i) => i.section === id);
}

export const menuItems = menuSet as MenuItem[];
export const glossary = glossaryRu as GlossaryItem[];
export const tips = tipsRu as Tip[];
export const displayIcons = displayRu.icons as DisplayIcon[];
export const lcdMessages = displayRu.messages as LcdMessage[];
export const cheatsheet = cheatRu as CheatItem[];
export const radioKeys = keysRu as RadioKeyInfo[];
export const builtinRepeaters = repeatersRu as Repeater[];

/** Всё, на что можно сослаться из «Смотри также»: инструкции, пункты меню, фишки */
export function refTitle(id: string): { title: string; href: string } | null {
  const ins = byId.get(id);
  if (ins) return { title: ins.title, href: `#/i/${id}` };
  const m = id.match(/^menu-(\d+)$/);
  if (m) {
    const it = menuItems.find((x) => x.no === +m[1]);
    if (it) return { title: `Меню ${it.no} ${it.name}`, href: `#/set/${it.no}` };
  }
  const tip = tips.find((x) => x.id === id);
  if (tip) return { title: `💡 ${tip.title}`, href: `#/tips/${id}` };
  if (id === 'wizard-by-freq') return { title: 'Настрой по частоте', href: '#/wizard' };
  if (id === 'setmenu') return { title: 'Меню SET — все пункты', href: '#/set' };
  return null;
}
