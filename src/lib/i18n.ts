import { store } from './store';
import uk from '../content/uk/ui.json';

/**
 * Надписи интерфейса. Русский — основной (здесь), украинский — в src/content/uk/ui.json.
 * Чтобы добавить язык: скопируй uk/ui.json, переведи и подключи ниже.
 */
const ru = {
  appName: 'FT-70D — просто и понятно',
  back: 'Назад',
  home: 'Домой',
  search: 'Поиск: «тон», «репитер», «громкость»…',
  searchBtn: 'Найти',
  nothingFound: 'Ничего не нашлось. Попробуй другое слово: «тон», «сдвиг», «память».',
  found: 'Нашлось',
  themeDark: 'Тёмная тема',
  themeLight: 'Светлая тема (для солнца)',
  font: 'Размер шрифта',
  fontBig: 'Большой',
  fontVery: 'Очень большой',
  fontHuge: 'Огромный',
  more: 'Ещё',
  step: 'Шаг',
  of: 'из',
  next: 'Дальше',
  prev: 'Назад',
  done: 'Готово!',
  doneText: 'Все шаги пройдены. Молодец!',
  again: 'Начать сначала',
  listMode: 'Весь список',
  stepMode: 'По одному шагу',
  readAloud: 'Прочитать вслух',
  stop: 'Стоп',
  fav: 'В «Моё»',
  unfav: 'Убрать из «Моё»',
  verified: 'Проверено по мануалу',
  unverified: 'Проверить на рации',
  checkOnRadio: 'Проверь на рации',
  source: 'Источник',
  tip: 'Совет',
  warning: 'Внимание',
  danger: 'Опасно!',
  dangerConfirm: 'Я понимаю. Показать шаги',
  related: 'Смотри также',
  difficulty: 'Сложность',
  myRepeaters: 'Мои репитеры',
  wizard: 'Настрой по частоте',
  radio: 'Схема рации',
  cheat: 'Шпаргалка',
  glossary: 'Словарь',
  tips: 'Фишки',
  favs: 'Моё',
  settings: 'Настройки',
  sources: 'Источники',
  photos: 'Фото моей рации',
  display: 'Значки на экране',
  print: 'Распечатать',
  offlineReady: 'Приложение сохранено и работает без интернета',
  updateReady: 'Есть новая версия. Нажми, чтобы обновить',
  install: 'Установить на телефон',
};

export type Str = keyof typeof ru;

export function t(k: Str): string {
  const lang = store.settings.lang;
  if (lang === 'uk') return (uk as Record<string, string>)[k] ?? ru[k];
  return ru[k];
}
