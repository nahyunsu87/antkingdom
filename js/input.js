// 입력 소스: 실제 카메라+포즈 인식 또는 시뮬레이터(?sim=1).
// frame(W,H) -> { poses: [[{x,y,visibility} x33]], vw, vh, mirror }
// 좌표는 0..1 (영상 기준). 화면 좌표 변환은 players.js 가 한다.

const MP = new URL('../vendor/mediapipe/', import.meta.url).href;

export async function createInput({ sim, bot, video, onStatus = () => {} }) {
  return sim ? createSim(bot) : createCamera(video, onStatus);
}

async function createCamera(video, onStatus) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저는 카메라를 지원하지 않습니다 (HTTPS + Safari 필요)');
  let stream = null, facing = 'user';
  async function open() {
    stream?.getTracks().forEach(t => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 30 } },
    });
    video.srcObject = stream;
    await video.play();
  }
  onStatus('카메라 여는 중…');
  await open();

  onStatus('동작 인식 모델 불러오는 중… (처음엔 20MB, 잠시 걸립니다)');
  const { FilesetResolver, PoseLandmarker } = await import(MP + 'vision_bundle.mjs');
  const fileset = await FilesetResolver.forVisionTasks(MP + 'wasm');
  const make = delegate => PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MP + 'pose_landmarker_lite.task', delegate },
    runningMode: 'VIDEO', numPoses: 2,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  let detector;
  try { detector = await make('GPU'); } catch (e) { console.warn('GPU 실패, CPU로 전환', e); detector = await make('CPU'); }

  let lastT = -1, poses = [], lastTs = 0;
  return {
    kind: 'camera',
    frame() {
      if (video.readyState >= 2 && video.currentTime !== lastT) {
        lastT = video.currentTime;
        const ts = Math.max(performance.now(), lastTs + 1); lastTs = ts; // 타임스탬프는 단조 증가해야 함
        try { poses = detector.detectForVideo(video, ts).landmarks || []; } catch (e) { console.warn(e); }
      }
      return { poses, vw: video.videoWidth || 16, vh: video.videoHeight || 9, mirror: true };
    },
    async flip() { facing = facing === 'user' ? 'environment' : 'user'; await open(); },
  };
}

// ── 시뮬레이터: 카메라 없이 PC에서 개발/테스트 ─────────────────────────────
// P1: A/D 이동, S 앉기, W 점프, Q/E 무릎, 마우스 = 오른손
// P2: ←/→ 이동, ↓ 앉기, ↑ 점프, ,/. 무릎
// ?bot=1 이면 자동으로 움직인다.
function createSim(bot) {
  const keys = {}; let mouse = null, t = 0, last = performance.now();
  addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  addEventListener('pointermove', e => { mouse = { x: e.clientX / innerWidth, y: e.clientY / innerHeight }; });
  const P = [{ x: 0.3 }, { x: 0.7 }];
  const map = [
    { l: 'a', r: 'd', down: 's', up: 'w', k1: 'q', k2: 'e' },
    { l: 'arrowleft', r: 'arrowright', down: 'arrowdown', up: 'arrowup', k1: ',', k2: '.' },
  ];
  return {
    kind: 'sim',
    frame(W, H) {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const asp = H / W;
      const poses = P.map((o, i) => {
        const k = map[i];
        let crouch = keys[k.down] ? 1 : 0, jump = keys[k.up] ? 1 : 0, knee = [keys[k.k1] ? 1 : 0, keys[k.k2] ? 1 : 0], hands = [null, null];
        if (keys[k.l]) o.x -= dt * 0.35;
        if (keys[k.r]) o.x += dt * 0.35;
        if (i === 0 && mouse && !bot) hands[1] = mouse;
        if (bot) {
          const a = t * 2.3 + i * 1.7;
          o.x = (i ? 0.72 : 0.28) + Math.sin(t * 0.9 + i * 2) * 0.13;
          hands = [0, 1].map(h => ({
            x: o.x + (Math.sin(a * (1 + h * 0.37) + h * 2) * 0.30 + (h ? 0.08 : -0.08)) * asp,
            y: 0.34 + Math.cos(a * 0.8 + h) * 0.24,
          }));
          const c = (t + i * 0.3) % 4;
          crouch = c > 1 && c < 2 ? 1 : 0; jump = c > 3 && c < 3.4 ? 1 : 0;
          const s = Math.sin(t * 9 + i); knee = [s > 0 ? 1 : 0, s < 0 ? 1 : 0];
        }
        o.x = Math.min(0.95, Math.max(0.05, o.x));
        return simPose(o.x, asp, crouch, jump, knee, hands);
      });
      return { poses, vw: W, vh: H, mirror: false };
    },
    async flip() {},
  };
}

function simPose(cx, asp, crouch, jump, knee, hands) {
  const lm = Array.from({ length: 33 }, () => ({ x: cx, y: 0.5, visibility: 0 }));
  const set = (i, dx, y) => { lm[i] = { x: cx + dx * asp, y, visibility: 1 }; };
  const up = -jump * 0.10, sy = 0.36 + crouch * 0.14 + up, hy = 0.58 + crouch * 0.11 + up;
  set(0, 0, sy - 0.09);
  set(11, -0.07, sy); set(12, 0.07, sy);
  set(23, -0.045, hy); set(24, 0.045, hy);
  set(25, -0.05, 0.74 + up - knee[0] * 0.09); set(26, 0.05, 0.74 + up - knee[1] * 0.09);
  set(27, -0.05, 0.90 + up - knee[0] * 0.06); set(28, 0.05, 0.90 + up - knee[1] * 0.06);
  [[15, 13, 11, -0.10], [16, 14, 12, 0.10]].forEach(([w, e, s, dx], h) => {
    if (hands[h]) lm[w] = { x: hands[h].x, y: hands[h].y, visibility: 1 }; else set(w, dx, hy + 0.02);
    lm[e] = { x: (lm[w].x + lm[s].x) / 2, y: (lm[w].y + lm[s].y) / 2, visibility: 1 };
  });
  return lm;
}
