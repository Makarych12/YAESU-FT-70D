/**
 * Самопроверка контента и логики: npm run test
 * Проверяет критерии приёмки ТЗ (п. 9): поиск и генератор инструкций для репитера.
 */
import { search } from '../src/lib/search';
import { generateSteps, CTCSS, DCS, txFreq, channelName, canTx } from '../src/lib/generator';
import { instructions, menuItems, sections, refTitle, builtinRepeaters } from '../src/lib/content';
import type { Repeater } from '../src/lib/types';
import { isKey } from '../src/components/ui';

let fail = 0;
const ok = (cond: unknown, msg: string) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) fail++;
};

// 1. Поиск
const expectTop: [string, string[]][] = [
  ['тон', ['repeater-manual-tone', 'repeater-tsql', 'repeater-tone-search', 'repeater-quick']],
  ['субтон', ['repeater-manual-tone', 'repeater-tsql', 'repeater-tone-search', 'repeater-quick', 'repeater-basics']],
  ['ctcss', ['repeater-manual-tone', 'repeater-tsql', 'repeater-tone-search', 'repeater-quick', 'repeater-basics']],
  ['репитер не открывается', ['help-repeater-silent']],
  ['громкость', ['intro-volume']],
];
for (const [q, ids] of expectTop) {
  const hits = search(q).slice(0, 5).map((h) => h.id);
  ok(hits.some((h) => ids.includes(h)), `поиск «${q}» → ${hits.slice(0, 3).join(', ')}`);
}

// 2. Генератор
const base: Repeater = { id: 't', name: 'Тест', city: 'Киев', freq: 145.675, shiftDir: '-', shift: 0.6, toneMode: 'none', mode: 'FM' };
const cases: [string, Repeater, (txt: string) => boolean][] = [
  ['FM без тона', base, (s) => s.includes('{{OFF}}') && !s.includes('{{TONE}}')],
  ['FM + CTCSS 88.5', { ...base, toneMode: 'tone', tone: 88.5 }, (s) => s.includes('{{TONE}}') && s.includes('{{88.5}}')],
  ['FM + DCS 023', { ...base, freq: 438.8, shift: 7.6, toneMode: 'dcs', dcs: '023' }, (s) => s.includes('{{DCS}}') && s.includes('{{023}}')],
  ['C4FM DG-ID 12', { ...base, freq: 438.8, shift: 7.6, mode: 'C4FM', dgid: 12 }, (s) => s.includes('{{DN}}') && s.includes('{{T12}}') && s.includes('{{R00}}') && !s.includes('{{TONE}}')],
  ['1750 Гц', { ...base, toneMode: 't1750' }, (s) => s.includes('hold:MONI')],
  ['нестандартный сдвиг', { ...base, freq: 439.0, shift: 5 }, (s) => s.includes('46 RPT.FRQ') && s.includes('5.00M')],
  ['частота 145.7625 → шаг 12.5', { ...base, freq: 145.7625 }, (s) => s.includes('{{12.5}}')],
];
for (const [name, r, check] of cases) {
  const g = generateSteps(r);
  const blob = g.steps.map((s) => `${s.text} ${(s.keys ?? []).join(' ')} ${s.lcd ?? ''}`).join('\n');
  ok(check(blob), `генератор: ${name} (${g.steps.length} шагов, передача ${txFreq(r)})`);
  for (const s of g.steps) for (const k of s.keys ?? []) for (const kk of k.split('&')) if (!isKey(kk.replace('hold:', ''))) ok(false, `  неизвестная клавиша «${k}»`);
}
ok(channelName({ ...base, callsign: 'UR0UVA' }) === 'UR0UVA', 'имя канала сохраняет цифру 0 в позывном');
ok(generateSteps({ ...base, freq: 446.125, shift: 7.6 }).warnings.length === 0, 'выход 446.125 −7.6: передача 438.525 разрешена');
ok(generateSteps({ ...base, freq: 147.0 }).warnings.some((w) => w.includes('невозможна')), 'предупреждение при передаче вне 144–146');

// 3. Контент
ok(CTCSS.length === 50, `CTCSS: ${CTCSS.length} тонов (по мануалу 50)`);
ok(DCS.length === 104, `DCS: ${DCS.length} кодов (по мануалу 104)`);
ok(menuItems.length === 63 && menuItems.every((m, i) => m.no === i + 1), `меню SET: ${menuItems.length} пунктов, номера 1–63 подряд`);
const secIds = new Set(sections().map((s) => s.id));
for (const s of ['intro', 'first', 'freq', 'repeater', 'memory', 'scan', 'digital', 'wires', 'battery', 'firmware', 'help'])
  ok(instructions.some((i) => i.section === s), `раздел ${s}: ${instructions.filter((i) => i.section === s).length} инструкций`);
ok(instructions.every((i) => secIds.has(i.section)), 'у всех инструкций существующий раздел');
const ids = instructions.map((i) => i.id);
ok(new Set(ids).size === ids.length, `уникальные id инструкций (${ids.length})`);
const badRel = instructions.flatMap((i) => (i.related ?? []).filter((r) => !refTitle(r)).map((r) => `${i.id}→${r}`));
ok(badRel.length === 0, `ссылки «Смотри также» живые ${badRel.join(', ')}`);
const badKeys = instructions.flatMap((i) => i.steps.flatMap((s) => (s.keys ?? []).flatMap((k) => k.split('&')).filter((k) => !isKey(k.replace('hold:', ''))).map((k) => `${i.id}:${k}`)));
ok(badKeys.length === 0, `все клавиши в инструкциях известны ${badKeys.join(', ')}`);
const inlineBad = instructions.flatMap((i) => i.steps.flatMap((s) => [...`${s.text} ${s.tip ?? ''}`.matchAll(/\[([A-Z0-9/]+)\]/g)].map((m) => m[1]).filter((k) => !isKey(k)).map((k) => `${i.id}:[${k}]`)));
ok(inlineBad.length === 0, `клавиши в тексте известны ${inlineBad.join(', ')}`);
ok(instructions.every((i) => i.manualRef), 'у каждой инструкции есть ссылка на источник');
ok(builtinRepeaters.every((r) => r.source && r.checked), `у всех ${builtinRepeaters.length} встроенных репитеров есть источник и дата`);
ok(builtinRepeaters.every((r) => r.id.startsWith('cz-') || r.id.startsWith('de-')), 'встроенный список относится к Чехии и Германии');
ok(builtinRepeaters.every((r) => canTx(txFreq(r))), 'частоты передачи всех местных репитеров доступны FT-70DE');
ok(builtinRepeaters.every((r) => r.distanceKm && r.distanceKm <= 70), 'все местные репитеры имеют оценку расстояния до 70 км');
const unverified = instructions.filter((i) => !i.verified || i.steps.some((s) => s.check));
console.log(`\nℹ️ Инструкций: ${instructions.length}. С пометкой ⚠️: ${unverified.length} — ${unverified.map((i) => i.id).join(', ')}`);

console.log(fail ? `\n❌ Ошибок: ${fail}` : '\n✅ Всё в порядке');
process.exit(fail ? 1 : 0);
