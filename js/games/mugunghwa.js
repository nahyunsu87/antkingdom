// 무궁화 꽃이 피었습니다 — 움직였다 멈추기. 술래가 눈을 가리고 "무궁화 꽃이 피었습니다!" 하는 동안 움직이면(제자리 걷기·춤 등)
// 개미가 꽃 쪽으로 다가가고, 말이 끝나 술래가 돌아보면 그대로 멈춘다. 잘 멈추면 별 +2.
// 움직여 버려도 벌은 없다(별을 못 받을 뿐). 개미가 꽃에 닿으면 칭찬하고 처음부터. 둘이 하면 한 마리를 같이 움직인다.
import { pick, makeMotion, updateMotion, allStill, maxMotion, MOVING } from './util.js';

const GRACE = 0.8, LOOK = 3.2, NEED = 1.3; // 돌아본 뒤 멈출 여유(초) / 돌아보는 시간 / 그중 가만히 있어야 하는 시간

export default {
  id: 'mugunghwa', title: '무궁화 꽃이 피었습니다', emoji: '🌺', color: '#ff7eb6', duration: 45,
  quietCheer: true, // 한 바퀴 칭찬 때 말소리를 겹치지 않는다

  start() { return { m: makeMotion(), phase: 'wait', t: 0, len: 0, prog: 0, still: 0, ok: false, walk: 0 }; },

  update(s, dt, c) {
    updateMotion(s.m, c, dt);
    s.t += dt;
    const e = maxMotion(s.m, c);
    if (s.phase === 'wait') { if (s.t > 4) next(s, c); return; } // 처음엔 시작 안내가 끝날 때까지
    if (s.phase === 'chant') {
      if (e > MOVING) { // 움직이는 만큼 개미가 꽃으로
        s.prog = Math.min(1, s.prog + dt * Math.min(e, 3) * 0.03); s.walk += dt * e;
        if (Math.random() < dt * 3) { const p = pick(c.present()); if (p) c.fx(p.cx, p.nose.y, '#ff9ad5', 3); }
      }
      if (s.prog >= 1) {
        s.prog = 0; c.add(3, c.W * 0.86, c.H * 0.26, '#ff7eb6'); c.fx(c.W * 0.86, c.H * 0.26, '#ffd23f', 30, 2, 0.9);
        c.say('mugung_end', true); c.sfx.cheer(); s.phase = 'wait'; s.t = 1; return;
      }
      if (s.t >= s.len) { s.phase = 'look'; s.t = 0; s.still = 0; s.ok = false; c.sfx.whoosh(); }
      return;
    }
    // look: 술래가 보고 있다
    if (s.t > GRACE && s.t < LOOK && c.present().length && allStill(s.m, c)) s.still += dt;
    if (!s.ok && s.still >= NEED) {
      s.ok = true; c.add(2, c.W / 2, c.H * 0.5, '#7fd8ff'); c.say('freeze_good', true); c.sfx.cheer();
    }
    if (s.t >= LOOK) next(s, c);
  },

  draw(s, g, c) {
    const { W, H, u } = c, x0 = W * 0.08, x1 = W * 0.78, y = H * 0.26;
    const looking = s.phase === 'look';
    if (looking) { g.fillStyle = 'rgba(255,90,120,.18)'; g.fillRect(0, 0, W, H); } // 돌아보면 화면이 살짝 붉어진다
    g.lineCap = 'round'; g.lineWidth = u * 2;
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.strokeStyle = '#ff7eb6'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (x1 - x0) * s.prog, y); g.stroke();
    const hop = s.phase === 'chant' ? Math.abs(Math.sin(s.walk * 6)) * u * 2 : 0;
    c.sprite('ant', '🐜', x0 + (x1 - x0) * s.prog, y - u * 5 - hop, u * 11);
    c.sprite('mugung_flower', '🌺', W * 0.86, y + u * 6, u * 11);
    // 술래: 눈 가림 = 움직여도 돼요 / 눈 뜸 = 멈춰요
    const pulse = looking ? 1 + Math.sin(c.t * 8) * 0.06 : 1;
    c.sprite(looking ? 'tagger_look' : 'tagger_back', looking ? '👀' : '🙈', W * 0.86, y - u * 8, u * 20 * pulse);
    if (looking && s.ok) c.sprite('ice', '🧊', W / 2, H * 0.62, u * 16);
  },
};

function next(s, c) { // 다음 "무궁화 꽃이 피었습니다" — 빠르기를 매번 바꿔 재미있게
  const rate = pick([0.8, 1, 1, 1.3]);
  c.say('mugung', true, rate);
  s.len = (c.clipLen('mugung') ?? 2.4) / rate + 0.15;
  s.phase = 'chant'; s.t = 0;
}
