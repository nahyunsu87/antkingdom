// 포즈 → 플레이어 슬롯(P1=화면 왼쪽, P2=오른쪽) 배정, 화면 좌표 변환, 떨림 보정.
// 게임은 p.lm(원본 33점) 대신 아래 파생값을 우선 쓴다:
//   p.present  p.cx  p.nose  p.shoulder  p.hip  p.hands[2]  p.knees[2]  p.ankles[2]
//   p.sw(어깨 너비 px)  p.torso(어깨~골반 px)  ← 거리와 무관한 크기 단위로 사용

export const COLORS = ['#ff5d73', '#3fb6ff'];
const SMOOTH = 0.55; // 0=안 움직임, 1=보정 없음
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Players {
  constructor() {
    this.list = [0, 1].map(i => ({ i, color: COLORS[i], present: false, lost: 9, lm: null, cx: 0, sw: 60, torso: 100,
      nose: { x: 0, y: 0 }, shoulder: { x: 0, y: 0 }, hip: { x: 0, y: 0 }, hands: [], knees: [], ankles: [] }));
  }

  update(frame, W, H, n, dt) {
    const { poses, vw, vh, mirror } = frame;
    const sc = Math.max(W / vw, H / vh), dw = vw * sc, dh = vh * sc, ox = (W - dw) / 2, oy = (H - dh) / 2; // object-fit: cover 와 동일
    const cands = poses
      .map(lm => lm.map(p => { const x = ox + p.x * dw; return { x: mirror ? W - x : x, y: oy + p.y * dh, v: p.visibility ?? 1 }; }))
      .filter(lm => lm[11].v > 0.5 && lm[12].v > 0.5)
      .map(lm => ({ lm, sw: dist(lm[11], lm[12]), cx: (lm[11].x + lm[12].x) / 2 }))
      .sort((a, b) => b.sw - a.sw).slice(0, n)   // 카메라에 가까운(큰) 사람 우선
      .sort((a, b) => a.cx - b.cx);              // 왼쪽부터 P1
    const slots = [null, null];
    if (n === 1) slots[0] = cands[0] || null;
    else if (cands.length === 2) { slots[0] = cands[0]; slots[1] = cands[1]; }
    else if (cands.length === 1) slots[cands[0].cx < W / 2 ? 0 : 1] = cands[0];

    this.list.forEach((p, i) => {
      const c = slots[i];
      if (!c) { p.lost += dt; if (p.lost > 0.4) p.present = false; return; }
      if (!p.lm || p.lost > 0.4) p.lm = c.lm;
      else p.lm = c.lm.map((q, j) => ({ x: p.lm[j].x + (q.x - p.lm[j].x) * SMOOTH, y: p.lm[j].y + (q.y - p.lm[j].y) * SMOOTH, v: q.v }));
      p.lost = 0; p.present = true;
      const m = p.lm;
      p.nose = m[0]; p.shoulder = mid(m[11], m[12]); p.hip = mid(m[23], m[24]);
      const t = dist(p.shoulder, p.hip);
      p.torso = m[23].v > 0.3 && t > 10 ? t : dist(m[11], m[12]) * 1.6;
      p.sw = Math.max(dist(m[11], m[12]), p.torso * 0.5); // 옆으로 돌아서도 0이 되지 않게
      p.cx = p.shoulder.x;
      p.hands = [[13, 15], [14, 16]].map(([e, w]) => ({ x: m[w].x + (m[w].x - m[e].x) * 0.3, y: m[w].y + (m[w].y - m[e].y) * 0.3, v: m[w].v }));
      p.knees = [m[25], m[26]]; p.ankles = [m[27], m[28]];
    });
  }
}

const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
export function drawSkeleton(g, p, alpha = 0.9) {
  if (!p.present) return;
  g.save(); g.globalAlpha = alpha; g.strokeStyle = p.color; g.lineCap = 'round'; g.lineWidth = Math.max(4, p.sw * 0.08);
  g.beginPath();
  for (const [a, b] of BONES) { if (p.lm[a].v < 0.3 || p.lm[b].v < 0.3) continue; g.moveTo(p.lm[a].x, p.lm[a].y); g.lineTo(p.lm[b].x, p.lm[b].y); }
  g.stroke();
  g.fillStyle = '#fff'; g.lineWidth = Math.max(3, p.sw * 0.06);
  for (const h of p.hands) { g.beginPath(); g.arc(h.x, h.y, p.sw * 0.2, 0, 7); g.fill(); g.stroke(); }
  g.beginPath(); g.arc(p.nose.x, p.nose.y, p.sw * 0.38, 0, 7); g.stroke();
  g.restore();
}
