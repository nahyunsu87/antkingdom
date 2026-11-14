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
