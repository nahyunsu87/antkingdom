// 제자리 달리기 — 유산소. 양 무릎 높이가 번갈아 뒤집힐 때마다 한 걸음. 먼저 GOAL 걸음을 채우면 끝.
const GOAL = 120, TH = 0.1; // TH: 무릎 높이 차(몸통 길이 대비). 낮추면 살살 뛰어도 인정됨
export default {
  id: 'run', title: '제자리 달리기', desc: '무릎 높이 올려 달리기', emoji: '🏃', color: '#3fb6ff',
  how: `제자리에서 무릎을 번갈아 높이! 먼저 ${GOAL}걸음`, duration: 45, needs: 'full',

  start() { return { side: [0, 0], recent: [[], []] }; },

  update(s, dt, c) {
    for (let i = 0; i < c.n; i++) {
      const p = c.players[i];
      if (!p.present || p.knees[0].v < 0.4 || p.knees[1].v < 0.4) continue;
      const d = (p.knees[0].y - p.knees[1].y) / p.torso, side = d > TH ? 1 : d < -TH ? -1 : 0;
      if (side && side !== s.side[i]) { s.side[i] = side; c.score[i]++; s.recent[i].push(c.t); c.sfx.step(); }
      s.recent[i] = s.recent[i].filter(t => c.t - t < 2);
      if (c.score[i] >= GOAL) c.finish();
    }
  },

  draw(s, g, c) {
    const { W, H, u } = c, x0 = W * 0.08, x1 = W * 0.92;
    for (let i = 0; i < c.n; i++) {
      const y = H * (0.2 + i * 0.1), k = Math.min(1, c.score[i] / GOAL), p = c.players[i], z = c.zones[i];
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x0, y - u * 0.7, x1 - x0, u * 1.4);
      g.fillStyle = p.color; g.fillRect(x0, y - u * 0.7, (x1 - x0) * k, u * 1.4);
      c.sprite('runner_p' + (i + 1), '🐜', x0 + (x1 - x0) * k, y - u * 1.5, u * 9);
      const pace = Math.round(s.recent[i].length * 30); // 최근 2초 → 분당 걸음
      c.text(`${pace} 걸음/분`, z.cx, H * 0.9, u * 5, pace > 150 ? '#ffd23f' : '#fff');
      if (p.present && (p.knees[0].v < 0.4 || p.knees[1].v < 0.4)) c.text('무릎이 보이게 뒤로!', z.cx, H * 0.5, u * 5, '#ff5d73');
    }
    c.sprite('flag', '🏁', x1, H * 0.16, u * 8);
  },
};
