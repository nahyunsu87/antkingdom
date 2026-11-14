// 효과음은 파일 없이 WebAudio 로 합성한다. iOS 는 사용자 탭 이후에만 소리가 나므로 unlockAudio() 를 시작 버튼에서 호출.
let ac = null;
export function unlockAudio() {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) {}
}
function tone(freq, dur = 0.12, type = 'sine', vol = 0.25, slide = 0, delay = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  hit: (combo = 0) => tone(520 + Math.min(combo, 12) * 40, 0.1, 'triangle', 0.3, 200),
  bad: () => tone(180, 0.3, 'sawtooth', 0.25, -100),
  tick: () => tone(660, 0.08, 'square', 0.15),
  go: () => tone(990, 0.35, 'square', 0.2),
  select: () => { tone(660, 0.08, 'triangle', 0.3); tone(990, 0.14, 'triangle', 0.3, 0, 0.08); },
  step: () => tone(300, 0.04, 'triangle', 0.12),
  warn: () => tone(440, 0.1, 'square', 0.12),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.3, 0, i * 0.13)),
};
