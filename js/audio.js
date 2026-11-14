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
  tick: () => tone(660, 0.08, 'square', 0.15),
  go: () => tone(990, 0.35, 'square', 0.2),
  select: () => { tone(660, 0.08, 'triangle', 0.3); tone(990, 0.14, 'triangle', 0.3, 0, 0.08); },
  step: () => tone(300, 0.04, 'triangle', 0.12),
  pop: () => { tone(900, 0.07, 'sine', 0.3, 600); tone(1400, 0.05, 'triangle', 0.15, 0, 0.04); },
  cheer: () => [659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.3, 0, i * 0.09)),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.3, 0, i * 0.13)),
};

// ── 음성 안내 ────────────────────────────────────────────────────────────
// 아이는 글을 못 읽으므로 모든 안내는 음성이다. say('키') 로 부른다.
// assets/voice/<키>.mp3 (일레븐랩스로 만든 파일)가 있으면 그것을, 없으면 브라우저 내장 한국어 음성으로 아래 문장을 읽는다.
// 문장을 추가·수정하면 assets/voice/README.md 의 대본도 같이 고칠 것.
export const VOICE = {
  hello: '안녕! 우리 같이 놀자!',
  menu: '하고 싶은 놀이를 골라 봐요!',
  bubble: '비눗방울을 손으로 팡! 터뜨려 봐요!',
  catch: '하늘에서 별이 떨어져요! 별을 잡아 봐요!',
  ant: '개미가 집에 가고 싶대요! 신나게 뛰어 봐요!',
  copy: '그림을 보고 똑같이 따라 해 봐요!',
  pose_up: '두 손 번쩍, 만세!',
  pose_small: '개구리처럼 작게 앉아 봐요!',
  pose_wide: '비행기처럼 팔을 쭉 벌려 봐요!',
  arrive: '도착! 한 번 더!',
  lost: '어디 갔지? 카메라 앞으로 와요!',
  done: '참 잘했어요! 정말 멋져요!',
};
const clips = {};
let playing = null, lastSaid = '', lastAt = 0;
export function loadVoice() { // unlockAudio() 이후에 호출
  if (!ac) return;
  for (const key of Object.keys(VOICE)) {
    fetch(`assets/voice/${key}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
      .then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).then(buf => { clips[key] = buf; }).catch(() => {});
  }
}
export function say(key) {
  try {
    const now = performance.now();
    if (key === lastSaid && now - lastAt < 2500) return; // 같은 말을 연달아 하지 않는다
    lastSaid = key; lastAt = now;
    try { playing?.stop(); } catch (e) {}
    window.speechSynthesis?.cancel();
    if (clips[key] && ac) { // 미리 녹음된 파일. WebAudio 로 틀어야 iOS 에서 탭 없이도 재생된다
      const src = ac.createBufferSource(), gain = ac.createGain();
      src.buffer = clips[key]; gain.gain.value = 1.0; src.connect(gain).connect(ac.destination); src.start(); playing = src;
    } else if (window.speechSynthesis && VOICE[key]) {
      const m = new SpeechSynthesisUtterance(VOICE[key]); m.lang = 'ko-KR'; m.rate = 0.95; m.pitch = 1.25;
      speechSynthesis.speak(m);
    }
  } catch (e) {}
}
