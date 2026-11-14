// 실로폰 — 팔 휘두르기. 몸 둘레에 무지개 건반 8개. 손이 닿으면 도레미 소리. 정답 없이 마음대로 연주.
import { clamp, roundRect } from './util.js';
const N = 8, COLS = ['#ff5d5d', '#ff9f40', '#ffd23f', '#7ee26b', '#3fd3ff', '#4f7dff', '#b45dff', '#ff6bd6'];

function layout(s, c) { // 아이 머리 위에서 허리 옆까지 반원으로 건반을 둘러 놓는다
  const top = s.top, bot = s.bot, rx = c.W * 0.4, ry = bot - top;
  const w = Math.min(c.W * 0.085, c.u * 16), h = Math.min(c.H * 0.17, ry * 0.5 + c.u * 6);
  return Array.from({ length: N }, (_, i) => {
    const a = Math.PI * (1.06 + 0.88 * i / (N - 1));
    return { x: c.W / 2 + Math.cos(a) * rx, y: bot + Math.sin(a) * ry, w, h };
  });
}

export default {
  id: 'xylo', title: '실로폰', emoji: '🎹', color: '#b45dff', duration: 40,

  start(c) { return { top: c.H * 0.3, bot: c.H * 0.75, in: {}, cool: new Array(N).fill(0), glow: new Array(N).fill(0), notes: [] }; },

  update(s, dt, c) {
    const p = c.present()[0], k = Math.min(1, dt * 1.5);
    if (p) { // 아이 키에 맞춰 천천히 따라간다
      s.top += (clamp(p.nose.y - p.torso * 0.8, c.H * 0.24, c.H * 0.6) - s.top) * k;
      s.bot += (clamp(p.hip.y + p.torso * 0.2, s.top + c.H * 0.2, c.H * 0.92) - s.bot) * k;
    }
    const bars = layout(s, c), now = {};
    for (let i = 0; i < N; i++) { s.cool[i] -= dt; s.glow[i] = Math.max(0, s.glow[i] - dt * 3); }
    c.players.forEach((pl, pi) => {
      if (!pl.present) return;
      pl.hands.forEach((h, hi) => {
        if (h.v < 0.3) return;
        bars.forEach((b, bi) => {
          const m = pl.sw * 0.15;
          if (Math.abs(h.x - b.x) > b.w / 2 + m || Math.abs(h.y - b.y) > b.h / 2 + m) return;
          const key = `${pi}-${hi}-${bi}`; now[key] = 1;
          if (s.in[key] || s.cool[bi] > 0) return; // 손이 건반에 새로 들어올 때만 소리
          s.cool[bi] = 0.25; s.glow[bi] = 1;
          c.sfx.note(bi); c.add(1, b.x, b.y - b.h * 0.6, COLS[bi]);
          s.notes.push({ x: b.x, y: b.y, t: 0 });
        });
      });
    });
    s.in = now;
    s.notes = s.notes.filter(n => (n.t += dt) < 1);
  },

  draw(s, g, c) {
    layout(s, c).forEach((b, i) => {
      const sc = 1 + s.glow[i] * 0.15, w = b.w * sc, h = b.h * sc;
      roundRect(g, b.x - w / 2, b.y - h / 2, w, h, w * 0.3);
      g.fillStyle = COLS[i]; g.globalAlpha = 0.75 + s.glow[i] * 0.25; g.fill(); g.globalAlpha = 1;
      g.lineWidth = c.u * (0.5 + s.glow[i]); g.strokeStyle = '#fff'; g.stroke();
    });
    for (const n of s.notes) {
      g.globalAlpha = 1 - n.t;
      c.sprite('note', '🎵', n.x + Math.sin(n.t * 8) * c.u * 2, n.y - n.t * c.H * 0.25, c.u * 8);
    }
    g.globalAlpha = 1;
  },
};
