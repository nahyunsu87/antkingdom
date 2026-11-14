// 따라 해봐 — 큰 동작(만세·웅크리기·팔 벌리기). 말과 그림으로 동작을 알려 주고, 하면 칭찬. 못 해도 그냥 다음으로 넘어간다.
const POSES = [
  { key: 'pose_up', emoji: '🙌', test: p => p.hands.every(h => h.y < p.nose.y) },
  { key: 'pose_small', emoji: '🐸', test: (p, ref) =>
      (p.knees.every(k => k.v > 0.5) && (Math.min(p.knees[0].y, p.knees[1].y) - p.hip.y) / p.torso < 0.4) || p.nose.y > ref + p.torso * 0.5 },
  { key: 'pose_wide', emoji: '✈️', test: p =>
      Math.abs(p.hands[0].x - p.hands[1].x) > p.sw * 3 && p.hands.every(h => Math.abs(h.y - p.shoulder.y) < p.torso * 0.6) },
];
const WAIT = 6; // 한 동작을 기다려 주는 시간(초)
export default {
  id: 'copy', title: '따라 해봐', emoji: '🙌', color: '#ff9ad5', duration: 40,

  start() { return { cur: null, last: -1, t: 0, rest: 1, done: [false, false], ref: [null, null], hold: [0, 0] }; },

  update(s, dt, c) {
    c.players.forEach((p, i) => { // 서 있을 때의 머리 높이를 천천히 따라가며 기억(앉기 판정 기준)
      if (!p.present) { s.ref[i] = null; return; }
      s.ref[i] = s.ref[i] == null ? p.nose.y : Math.min(p.nose.y, s.ref[i] + dt * p.torso * 0.15);
    });
    if (!s.cur) {
      s.rest -= dt;
      if (s.rest > 0) return;
      let k; do { k = Math.floor(Math.random() * POSES.length); } while (k === s.last);
      s.last = k; s.cur = POSES[k]; s.t = 0; s.done = [false, false]; s.hold = [0, 0]; c.say(s.cur.key);
      return;
    }
    s.t += dt;
    c.players.forEach((p, i) => {
      if (!p.present || s.done[i]) return;
      s.hold[i] = s.cur.test(p, s.ref[i]) ? s.hold[i] + dt : 0;
      if (s.hold[i] > 0.25) { s.done[i] = true; c.sfx.cheer(); c.add(1, p.cx, p.nose.y - p.sw, '#ff9ad5'); }
    });
    const ps = c.present();
    if (s.t > WAIT || (ps.length && ps.every(p => s.done[p.i]) && (s.endAt = s.endAt || s.t + 0.9) < s.t)) { s.cur = null; s.endAt = 0; s.rest = 0.8; }
  },

  draw(s, g, c) {
    if (!s.cur) return;
    const { W, H, u } = c, size = u * 30 * (1 + Math.sin(c.t * 5) * 0.04);
    g.beginPath(); g.arc(W / 2, H * 0.34, u * 19, 0, 7); g.fillStyle = 'rgba(255,255,255,.2)'; g.fill();
    g.beginPath(); g.arc(W / 2, H * 0.34, u * 19, -Math.PI / 2, -Math.PI / 2 + (1 - s.t / WAIT) * Math.PI * 2);
    g.lineWidth = u * 1.4; g.strokeStyle = '#ff9ad5'; g.stroke();
    c.sprite(s.cur.key, s.cur.emoji, W / 2, H * 0.34, size);
  },
};
