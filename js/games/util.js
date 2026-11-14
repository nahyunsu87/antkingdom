// 놀이들이 같이 쓰는 작은 도구들
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;

// 서 있을 때의 머리 높이를 기억한다. 서면 바로 따라 올라가고, 앉아 있으면 아주 천천히만 내려온다 → 앉기 판정의 기준선.
export function trackStand(ref, p, dt) { return ref == null ? p.nose.y : Math.min(p.nose.y, ref + dt * p.torso * 0.15); }

// 한동안 아무것도 안 하면 무엇을 할지 그림으로 깜빡여 알려 준다(글자 대신)
export function hint(g, c, key, emoji, x = c.W / 2, y = c.H * 0.34) {
  g.globalAlpha = 0.45 + 0.35 * Math.sin(c.t * 5);
  c.sprite(key, emoji, x, y, c.u * 22);
  g.globalAlpha = 1;
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// 온몸 움직임 양 측정(멈추기 놀이용). m.e[i] = 플레이어 i 의 움직임(초당 몸통 길이 단위, 부드럽게).
// 대략: 가만히 서 있으면 0.1~0.3, 살살 흔들면 0.5~1, 신나게 춤추면 1.5 이상. (실기기에서 다시 맞출 것)
const MOTION_JOINTS = [0, 13, 14, 15, 16, 25, 26, 27, 28]; // 코, 팔꿈치, 손목, 무릎, 발목
export const STILL = 0.4, MOVING = 0.8;
export const makeMotion = () => ({ prev: [null, null], e: [0, 0] });
export function updateMotion(m, c, dt) {
  c.players.forEach((p, i) => {
    if (!p.present) { m.prev[i] = null; m.e[i] = 0; return; }
    const pts = MOTION_JOINTS.map(j => p.lm[j]);
    let d = 0, n = 0;
    if (m.prev[i]) pts.forEach((q, k) => { if (q && (q.v ?? 1) > 0.4) { d += Math.hypot(q.x - m.prev[i][k].x, q.y - m.prev[i][k].y); n++; } });
    const inst = n ? Math.min(6, d / n / p.torso / dt) : m.e[i];
    m.e[i] += (inst - m.e[i]) * Math.min(1, dt * 5);
    m.prev[i] = pts.map(q => ({ x: q?.x ?? 0, y: q?.y ?? 0 }));
  });
}
// 보이는 사람 모두가 가만히 있나(둘이 하면 둘 다)
export const allStill = (m, c) => c.present().every(p => m.e[p.i] < STILL);
export const maxMotion = (m, c) => Math.max(0, ...c.present().map(p => m.e[p.i]));
