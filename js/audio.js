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
function noise(dur = 0.1, vol = 0.3, freq = 1500, delay = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(ac.destination); s.start(t);
}
const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047]; // 도레미파솔라시도
export const sfx = {
  hit: (combo = 0) => tone(520 + Math.min(combo, 12) * 40, 0.1, 'triangle', 0.3, 200),
  tick: () => tone(660, 0.08, 'square', 0.15),
  go: () => tone(990, 0.35, 'square', 0.2),
  select: () => { tone(660, 0.08, 'triangle', 0.3); tone(990, 0.14, 'triangle', 0.3, 0, 0.08); },
  step: () => tone(300, 0.04, 'triangle', 0.12),
  pop: () => { tone(900, 0.07, 'sine', 0.3, 600); tone(1400, 0.05, 'triangle', 0.15, 0, 0.04); },
  cheer: () => [659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.3, 0, i * 0.09)),
  note: i => { const f = NOTES[i % NOTES.length]; tone(f, 0.7, 'triangle', 0.32); tone(f * 2, 0.35, 'sine', 0.08); },
  boing: () => tone(260, 0.28, 'sine', 0.32, 420),
  whoosh: () => noise(0.55, 0.18, 900),
  boom: () => { noise(0.7, 0.45, 280); tone(90, 0.45, 'sine', 0.4, -50); },
  clap: () => { noise(0.07, 0.55, 2200); noise(0.06, 0.3, 2800, 0.025); },
  kick: () => { tone(130, 0.16, 'sine', 0.55, -70); noise(0.05, 0.25, 1200); },
  splash: () => { noise(0.4, 0.3, 1100); noise(0.25, 0.2, 2400, 0.08); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.3, 0, i * 0.13)),
};

// ── 음성 안내 ────────────────────────────────────────────────────────────
// 아이는 글을 못 읽으므로 모든 안내는 음성이다. say('키') 로 부른다.
// assets/voice/<키>.mp3 (일레븐랩스로 만든 파일)가 있으면 그것을, 없으면 브라우저 내장 한국어 음성으로 아래 문장을 읽는다.
// 문장을 추가·수정하면 assets/voice/README.md 의 대본도 같이 고칠 것.
export const VOICE = {
  hello: '안녕! 우리 같이 놀자!',
  menu: '하고 싶은 놀이를 골라 봐요!',
  // 놀이 시작 안내(키 = 놀이 id)
  bubble: '비눗방울을 손으로 팡! 터뜨려 봐요!',
  catch: '하늘에서 별이 떨어져요! 별을 잡아 봐요!',
  balloon: '풍선이 떨어지지 않게 통통 쳐 봐요!',
  apple: '손을 쭉 뻗어서 사과를 따 봐요!',
  xylo: '손으로 실로폰을 쳐서 노래를 만들어 봐요!',
  clap: '짝짝 박수를 치면 꽃이 피어요!',
  firework: '만세를 하면 불꽃이 펑! 터져요!',
  peekaboo: '손으로 얼굴을 가렸다가, 까꿍! 해 봐요!',
  wipe: '뿌연 창문을 손으로 쓱쓱 닦아 봐요!',
  paint: '손으로 화면에 알록달록 색칠해 봐요!',
  copy: '그림을 보고 똑같이 따라 해 봐요!',
  frog: '개구리처럼 앉았다 일어나면 개구리가 폴짝 뛰어요!',
  ant: '개미가 집에 가고 싶대요! 신나게 뛰어 봐요!',
  bird: '새처럼 팔을 퍼덕퍼덕! 하늘 높이 날아 봐요!',
  plane: '팔을 쭉 벌리고 몸을 기울여서 비행기를 움직여 봐요!',
  soccer: '발로 공을 뻥! 차 봐요!',
  // 놀이 중
  pose_up: '두 손 번쩍, 만세!',
  pose_small: '개구리처럼 작게 앉아 봐요!',
  pose_wide: '비행기처럼 팔을 쭉 벌려 봐요!',
  pose_one: '홍학처럼 한 발을 들어 봐요!',
  pose_star: '별처럼 팔다리를 쫙 벌려 봐요!',
  peek: '까꿍!',
  goal: '슛! 골인!',
  frog_end: '개굴개굴! 연못에 도착했어요!',
  clean: '와, 반짝반짝 깨끗해졌어요!',
  paint_done: '우와, 멋진 그림이에요!',
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
export function say(key, force = false) { // force: 방금 한 말이라도 다시 한다
  try {
    const now = performance.now();
    if (!force && key === lastSaid && now - lastAt < 2500) return; // 같은 말을 연달아 하지 않는다
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
