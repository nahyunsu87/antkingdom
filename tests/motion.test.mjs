// 실행: node tests/motion.test.mjs  — 카메라 없이 놀이의 동작 판정(박수, 까꿍, 스쿼트 등)을 검사한다
// 동작 판정 테스트: 가짜 몸 자세를 시간 순서대로 넣고 점수/상태가 기대대로 바뀌는지 본다
globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ data: [] }) }) }) };
const W = 844, H = 390;
function mkPlayer(o = {}) {
  const cx = o.cx ?? 420, ny = o.noseY ?? 100, sy = ny + 50, hy = sy + 100;
  const hands = o.hands ?? [{ x: cx - 50, y: hy }, { x: cx + 50, y: hy }];
  const knees = o.knees ?? [{ x: cx - 20, y: hy + 70 }, { x: cx + 20, y: hy + 70 }];
  const ankles = o.ankles ?? [{ x: cx - 20, y: hy + 130 }, { x: cx + 20, y: hy + 130 }];
  const lm = []; lm[11] = { x: cx - 30, y: sy + (o.tiltL ?? 0), v: 1 }; lm[12] = { x: cx + 30, y: sy + (o.tiltR ?? 0), v: 1 };
  return { present: o.present ?? true, i: o.i ?? 0, cx, sw: 60, torso: 100, nose: { x: cx, y: ny }, shoulder: { x: cx, y: sy }, hip: { x: cx, y: hy },
    hands: hands.map(h => ({ v: 1, ...h })), knees: knees.map(k => ({ v: 1, ...k })), ankles: ankles.map(a => ({ v: 1, ...a })), lm };
}
function mkCtx() {
  const c = { W, H, u: H / 100, t: 0, dur: 40, score: 0, said: [], players: [mkPlayer(), mkPlayer({ present: false, i: 1 })],
    present() { return c.players.filter(p => p.present); },
    touching(x, y, r, body) { for (const p of c.present()) { if (p.hands.some(h => Math.hypot(h.x - x, h.y - y) < r + p.sw * 0.25)) return p;
      if (body && [p.nose].some(o => Math.hypot(o.x - x, o.y - y) < r + p.sw * 0.5)) return p; } return null; },
    add(n) { c.score += n; }, fx() {}, say(k) { c.said.push(k); }, sprite() {}, text() {}, hasImage: () => false,
    sfx: new Proxy({}, { get: () => () => {} }) };
  return c;
}
async function run(name, script, check) {
  const game = (await import(`../js/games/${name}.js`)).default, c = mkCtx(), s = game.start(c), dt = 1 / 30;
  for (const [secs, pose] of script) for (let t = 0; t < secs; t += dt) { c.players[0] = mkPlayer(typeof pose === 'function' ? pose(t) : pose); c.t += dt; game.update(s, dt, c); }
  const r = check(c, s); console.log(r.ok ? 'PASS' : 'FAIL', name.padEnd(9), r.msg);
}
const apart = { hands: [{ x: 300, y: 200 }, { x: 540, y: 200 }] }, together = { hands: [{ x: 415, y: 200 }, { x: 425, y: 200 }] };
await run('clap', [[0.5, apart], [0.3, together], [0.4, apart], [0.3, together], [0.4, apart]], c => ({ ok: c.score === 2, msg: `claps=${c.score} (expect 2)` }));
await run('clap', [[0.5, apart], [1.0, { hands: [{ x: 415, y: 200 }, { x: 425, y: 200 }] }]], c => ({ ok: c.score === 1, msg: `holding hands together counts once: ${c.score}` }));
const face = { hands: [{ x: 405, y: 100 }, { x: 435, y: 100 }] };
await run('peekaboo', [[0.5, apart], [0.6, face], [0.5, apart]], c => ({ ok: c.score === 1 && c.said.includes('peek'), msg: `peek=${c.score} said=${c.said}` }));
await run('peekaboo', [[0.5, apart], [0.2, face], [0.5, apart]], c => ({ ok: c.score === 0, msg: `too-short cover ignored: ${c.score}` }));
const up = { hands: [{ x: 380, y: 50 }, { x: 460, y: 50 }] }, down = { hands: [{ x: 370, y: 260 }, { x: 470, y: 260 }] };
await run('firework', [[0.3, down], [1.5, up], [1.0, up]], c => ({ ok: c.score === 1, msg: `keep arms up = one firework: ${c.score}` }));
await run('firework', [[0.3, down], [1.2, up], [0.4, down], [1.2, up]], c => ({ ok: c.score === 2, msg: `up-down-up = two: ${c.score}` }));
await run('frog', [[1, { noseY: 100 }], [0.5, { noseY: 145 }], [0.6, { noseY: 100 }], [0.5, { noseY: 145 }], [0.6, { noseY: 100 }]], (c, s) => ({ ok: c.score === 2 && s.pos === 2, msg: `squats=${c.score} pos=${s.pos}` }));
await run('frog', [[1, { noseY: 100 }], [0.5, { noseY: 115 }], [0.6, { noseY: 100 }]], c => ({ ok: c.score === 0, msg: `small dip ignored: ${c.score}` }));
await run('plane', [[1.5, { tiltR: 40, tiltL: -40 }]], (c, s) => ({ ok: s.x > W / 2 + 50, msg: `lean right → x=${s.x.toFixed(0)} (> ${W / 2 + 50})` }));
await run('plane', [[1.5, { tiltR: -40, tiltL: 40 }]], (c, s) => ({ ok: s.x < W / 2 - 50, msg: `lean left → x=${s.x.toFixed(0)}` }));
await run('plane', [[1.5, { tiltR: 3, tiltL: -3 }]], (c, s) => ({ ok: Math.abs(s.x - W / 2) < 2, msg: `stand straight stays: x=${s.x.toFixed(0)}` }));
const flap = t => { const k = (t * 2) % 1; const y = k < 0.5 ? 60 + k * 2 * 220 : 280 - (k - 0.5) * 2 * 220; return { hands: [{ x: 300, y }, { x: 540, y }] }; };
await run('bird', [[4, flap]], (c, s) => ({ ok: s.y < H * 0.6, msg: `flapping → bird y=${(s.y / H).toFixed(2)}H (< 0.6H)` }));
await run('bird', [[4, {}]], (c, s) => ({ ok: s.y >= H * 0.85, msg: `still → stays on ground y=${(s.y / H).toFixed(2)}H` }));
// 공 차기: 공이 놓이면 발목을 공 위치로 옮긴다
{
  const game = (await import('../js/games/soccer.js')).default, c = mkCtx(), s = game.start(c), dt = 1 / 30;
  for (let t = 0; t < 1.2; t += dt) game.update(s, dt, c);
  const b = s.ball; let kicked = false;
  for (let t = 0; t < 3; t += dt) { if (s.ball) c.players[0] = mkPlayer({ ankles: [{ x: b.x, y: b.y }, { x: 400, y: 380 }] }); game.update(s, dt, c); if (s.ball?.state === 'fly') kicked = true; }
  console.log(c.score === 1 && kicked && c.said.includes('goal') ? 'PASS' : 'FAIL', 'soccer   ', `kicked=${kicked} goals=${c.score} said=${c.said}`);
}
