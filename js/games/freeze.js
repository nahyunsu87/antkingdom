// 그대로 멈춰라 — 춤추다 멈추기. 음악이 나오면 신나게 춤추고(춤춘 만큼 별), 음악이 멈추고 "그대로 멈춰라!" 하면 얼음.
// 잘 멈추면 별 +2. 움직여 버려도 벌은 없다. 춤추는 시간은 매번 달라서 언제 멈출지 모른다.
import { rand, pick, makeMotion, updateMotion, allStill, maxMotion, MOVING } from './util.js';

const GRACE = 1.1, LOOK = 3.4, NEED = 1.4; // "그대로 멈춰라" 말이 끝나고 멈출 여유 / 얼음 시간 / 그중 가만히 있어야 하는 시간

export default {
  id: 'freeze', title: '그대로 멈춰라', emoji: '🕺', color: '#9b7dff', duration: 45,
  quietCheer: true,

  start() { return { m: makeMotion(), phase: 'wait', t: 0, len: 0, acc: 0, still: 0, ok: false, lights: Array.from({ length: 6 }, () => rand(0, 7)) }; },

  update(s, dt, c) {
    updateMotion(s.m, c, dt);
    s.t += dt;
    const e = maxMotion(s.m, c);
    if (s.phase === 'wait') { if (s.t > 4.2) dance(s, c); return; }
    if (s.phase === 'dance') {
      if (e > MOVING) { // 춤춘 만큼 별
        s.acc += dt * Math.min(e, 3);
        if (s.acc > 2.5) { s.acc = 0; const p = pick(c.present()); if (p) c.add(1, p.hands[Math.random() < 0.5 ? 0 : 1].x, p.hands[0].y, pick(['#ff9ad5', '#7fd8ff', '#ffd23f'])); }
      }
      if (s.t >= s.len) { c.music.stop(); c.say('freeze_cue', true); s.phase = 'freeze'; s.t = 0; s.still = 0; s.ok = false; }
      return;
    }
    if (s.t > GRACE && s.t < LOOK && c.present().length && allStill(s.m, c)) s.still += dt;
    if (!s.ok && s.still >= NEED) { s.ok = true; c.add(2, c.W / 2, c.H * 0.5, '#7fd8ff'); c.say('freeze_good', true); c.sfx.cheer(); }
    if (s.t >= LOOK) dance(s, c);
  },

  stop() {}, // 음악은 엔진이 놀이를 떠날 때 끈다

  draw(s, g, c) {
    const { W, H, u } = c;
    if (s.phase === 'dance') { // 무대 조명
      s.lights.forEach((ph, i) => {
        g.globalAlpha = 0.18 + 0.12 * Math.sin(c.t * 6 + ph);
        g.fillStyle = ['#ff5d73', '#ffd23f', '#3fb6ff', '#7dff9b', '#ff9ad5', '#b45dff'][i];
        g.beginPath(); g.arc(W * (i + 0.5) / 6, H * 0.18 + Math.sin(c.t * 2 + ph) * H * 0.05, W * 0.09, 0, 7); g.fill();
      });
      g.globalAlpha = 1;
      const beat = Math.abs(Math.sin(c.t * Math.PI * 124 / 60));
      c.sprite('dancer', '🕺', W * 0.12, H * 0.3 - beat * u * 3, u * 16);
      c.sprite('note', '🎵', W * 0.88, H * 0.3 - beat * u * 3, u * 12);
    } else if (s.phase === 'freeze') {
      g.fillStyle = 'rgba(160,220,255,.22)'; g.fillRect(0, 0, W, H); // 얼음처럼 파랗게
      c.sprite('ice', '🧊', W / 2, H * 0.3, u * 20 * (1 + Math.sin(c.t * 8) * 0.05));
      if (s.ok) for (const p of c.present()) c.sprite('snow', '❄️', p.cx, p.nose.y - p.sw * 1.4, p.sw * 1.1);
    }
  },
};

function dance(s, c) { s.phase = 'dance'; s.t = 0; s.len = rand(5, 9); c.music.start(); }
