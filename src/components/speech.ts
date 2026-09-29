import { speakable } from './ui';

/** «Прочитать вслух» — Web Speech API с русским голосом, если он есть на телефоне. */
export const speech = {
  available(): boolean {
    return 'speechSynthesis' in window;
  },
  voice(): SpeechSynthesisVoice | undefined {
    const vs = speechSynthesis.getVoices();
    return vs.find((v) => v.lang === 'ru-RU') ?? vs.find((v) => v.lang.startsWith('ru')) ?? vs.find((v) => v.lang.startsWith('uk'));
  },
  say(text: string, onEnd?: () => void) {
    if (!this.available()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    const v = this.voice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'ru-RU';
    u.rate = 0.9;
    u.onend = () => onEnd?.();
    speechSynthesis.speak(u);
  },
  stop() {
    if (this.available()) speechSynthesis.cancel();
  },
};
if ('speechSynthesis' in window) speechSynthesis.getVoices();
