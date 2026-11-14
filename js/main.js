// 진행 흐름: boot → menu → ready(자리 잡기) → count(3·2·1) → play → result
// 게임 로직은 js/games/*.js 에만 있다. 여기는 공통 틀(메뉴, 타이머, 점수판, 결과)만 담당.
import { createInput } from './input.js';
import { Players, drawSkeleton, COLORS } from './players.js';
import { sfx, unlockAudio } from './audio.js';
import { loadAssets, sprite } from './assets.js';
import { GAMES } from './games/index.js';

const q = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const cv = $('stage'), g = cv.getContext('2d');
const DWELL = 1.0; // 손을 올려두면 선택되는 시간(초)

let W = 0, H = 0, u = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight; u = H / 100;
  cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize); resize();

const players = new Players();
let input = null;
const S = { name: 'boot', t: 0, n: Math.min(2, Math.max(1, +q.get('n') || 1)), game: null, gs: null, ctx: null, tap: null,
  hold: 0, lastSec: 0, done: false, lostT: 0, pops: [] };
let dwell = {};
cv.addEventListener('pointerdown', e => { S.tap = { x: e.clientX, y: e.clientY }; unlockAudio(); });

// ── 그리기 도우미 ────────────────────────────────────────────────────────
function text(str, x, y, size, color = '#fff', align = 'center') {
  g.font = `800 ${size}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.16; g.strokeStyle = 'rgba(10,12,40,.85)'; g.strokeText(str, x, y);
  g.fillStyle = color; g.fillText(str, x, y);
}
function rrect(x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const dim = a => { g.fillStyle = `rgba(13,16,38,${a})`; g.fillRect(0, 0, W, H); };
const inside = (p, b) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
const zones = () => S.n === 1 ? [{ x: 0, w: W, cx: W / 2 }] : [{ x: 0, w: W / 2, cx: W / 4 }, { x: W / 2, w: W / 2, cx: W * 3 / 4 }];

// ── 손으로 누르는 버튼 ───────────────────────────────────────────────────
// 손이 가슴 위로 올라왔을 때만 커서로 인정(내린 손이 버튼을 건드리는 오작동 방지).
function cursors() {
  const out = [];
  for (const p of players.list) if (p.present) for (const h of p.hands) if (h.y < p.shoulder.y + p.torso * 0.6) out.push({ x: h.x, y: h.y, color: p.color });
  return out;
}
function runButtons(btns, dt) {
  const cs = cursors();
  let fired = null;
  for (const b of btns) {
    const hot = !b.active && cs.some(c => inside(c, b));
    let p = hot ? (dwell[b.id] || 0) + dt / DWELL : Math.max(0, (dwell[b.id] || 0) - dt * 2);
    if (S.tap && inside(S.tap, b)) p = 1;
    dwell[b.id] = p;
    if (p >= 1 && !fired) fired = b;
    g.save();
    rrect(b.x, b.y, b.w, b.h, u * 3);
    g.fillStyle = b.active ? 'rgba(255,210,63,.92)' : hot ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.16)'; g.fill();
    g.lineWidth = u * 0.6; g.strokeStyle = b.color || '#fff'; g.stroke();
    if (p > 0 && p < 1) { g.clip(); g.fillStyle = 'rgba(255,210,63,.55)'; g.fillRect(b.x, b.y + b.h * (1 - p), b.w, b.h * p); }
    g.restore();
    const cx = b.x + b.w / 2, ink = b.active ? '#1b1f4b' : '#fff';
    if (b.icon) {
      sprite(g, b.icon[0], b.icon[1], cx, b.y + b.h * 0.34, b.h * 0.42);
      text(b.label, cx, b.y + b.h * 0.68, Math.min(b.h * 0.13, b.w * 0.15));
      if (b.sub) text(b.sub, cx, b.y + b.h * 0.86, Math.min(b.h * 0.075, b.w * 0.085), '#cfd6ff');
    } else text(b.label, cx, b.y + b.h / 2, Math.min(b.h * 0.42, b.w * 0.16), ink);
  }
  for (const c of cs) { g.beginPath(); g.arc(c.x, c.y, u * 2.4, 0, 7); g.fillStyle = c.color; g.fill(); g.lineWidth = u * 0.6; g.strokeStyle = '#fff'; g.stroke(); }
  if (fired) { dwell = {}; sfx.select(); fired.on(); }
}

// ── 상태 전환 ────────────────────────────────────────────────────────────
function go(name) { S.name = name; S.t = 0; S.hold = 0; S.lastSec = 0; dwell = {}; }
function startGame(game) { S.game = game; go('ready'); }
function beginPlay() {
  const game = S.game;
  S.done = false; S.pops = []; S.lostT = 0;
  S.ctx = {
    get W() { return W; }, get H() { return H; }, get u() { return u; }, get zones() { return zones(); },
    n: S.n, players: players.list, score: [0, 0], t: 0, dur: game.duration, sfx, text,
    sprite: (key, emoji, x, y, size) => sprite(g, key, emoji, x, y, size),
    pop: (x, y, str, color = '#ffd23f') => S.pops.push({ x, y, str, color, t: 0 }),
    finish: () => { S.done = true; },
  };
  S.gs = game.start(S.ctx);
  go('play'); sfx.go();
}
function bestKey() { return `antgym_best_${S.game.id}`; }

// ── 화면별 처리 ──────────────────────────────────────────────────────────
function menu(dt) {
  dim(0.5);
  text('🐜 개미 체육관', W / 2, u * 8, u * 6.5);
  const bw = Math.min(W * 0.2, u * 34), gap = (W - bw * 4) / 5, btns = [];
  [1, 2].forEach((n, i) => btns.push({ id: 'n' + n, x: W / 2 + (i ? u * 2 : -u * 30), y: u * 15, w: u * 28, h: u * 11,
    label: n + '인 플레이', active: S.n === n, on: () => { S.n = n; } }));
  GAMES.forEach((gm, i) => btns.push({ id: gm.id, x: gap + i * (bw + gap), y: u * 31, w: bw, h: u * 44, color: gm.color,
    icon: ['icon_' + gm.id, gm.emoji], label: gm.title, sub: gm.desc, on: () => startGame(gm) }));
  btns.push({ id: 'flip', x: W - u * 25, y: u * 2.5, w: u * 22, h: u * 8, label: '카메라 전환', on: () => input.flip().catch(console.warn) });
  for (const p of players.list) drawSkeleton(g, p, 0.55);
  runButtons(btns, dt);
  text(players.list.some(p => p.present) ? '손을 들어 원하는 칸에 1초간 올려두세요' : '카메라에 상반신이 보이게 서 주세요',
    W / 2, u * 88, u * 4.6, '#ffd23f');
}

function bodyOk(p, z, full) {
  if (!p.present) return '카메라 앞에 서 주세요';
  if (p.cx < z.x || p.cx > z.x + z.w) return '자기 칸 안으로 이동';
  if (p.lm[23].v < 0.5 || p.lm[24].v < 0.5) return '뒤로 물러나 골반까지 보이게';
  if (full && (p.lm[25].v < 0.5 || p.lm[26].v < 0.5)) return '더 뒤로! 무릎까지 보이게';
  return '';
}
function ready(dt) {
  dim(0.35);
  const zs = zones(); let all = true;
  text(`${S.game.emoji} ${S.game.title}`, W / 2, u * 9, u * 7);
  text(S.game.how, W / 2, u * 19, u * 4, '#cfd6ff');
  zs.forEach((z, i) => {
    const p = players.list[i], msg = bodyOk(p, z, S.game.needs === 'full');
    if (msg) all = false;
    g.strokeStyle = COLORS[i]; g.lineWidth = u; g.setLineDash([u * 3, u * 2]); rrect(z.x + u * 3, u * 27, z.w - u * 6, u * 68, u * 4); g.stroke(); g.setLineDash([]);
    drawSkeleton(g, p);
    text(`P${i + 1}`, z.cx, u * 33, u * 6, COLORS[i]);
    text(msg || '준비 완료 ✔', z.cx, u * 88, u * 4.6, msg ? '#fff' : '#7dff9b');
  });
  S.hold = all ? S.hold + dt : 0;
  exitBtn(dt);
  if (S.hold > 1 || q.has('skip')) go('count');
}
function count() {
  dim(0.3);
  for (const p of players.list.slice(0, S.n)) drawSkeleton(g, p);
  const left = 3 - Math.floor(S.t);
  if (left !== S.lastSec) { S.lastSec = left; if (left > 0) sfx.tick(); }
  if (left <= 0) return beginPlay();
  const f = S.t % 1;
  text(String(left), W / 2, H / 2, u * 40 * (1.25 - f * 0.25), '#ffd23f');
}
function hud() {
  const c = S.ctx, left = Math.max(0, Math.ceil(c.dur - c.t));
  text(String(left), W / 2, u * 7, u * 9, left <= 5 ? '#ff5d73' : '#fff');
  text((S.n === 2 ? 'P1  ' : '') + c.score[0], u * 4, u * 7, u * 7.5, COLORS[0], 'left');
  if (S.n === 2) text(c.score[1] + '  P2', W - u * 4, u * 7, u * 7.5, COLORS[1], 'right');
  if (S.n === 2) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(W / 2 - u * 0.25, u * 14, u * 0.5, H); }
  S.pops = S.pops.filter(p => p.t < 0.8);
  for (const p of S.pops) { g.globalAlpha = 1 - p.t / 0.8; text(p.str, p.x, p.y - p.t * u * 14, u * 6, p.color); g.globalAlpha = 1; }
}
function exitBtn(dt) { // 터치 전용(게임 중 손동작으로 눌리면 안 됨)
  const b = { x: W / 2 - u * 34, y: u * 2.5, w: u * 15, h: u * 8 };
  g.globalAlpha = 0.6; rrect(b.x, b.y, b.w, b.h, u * 2); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.globalAlpha = 1;
  text('✕ 메뉴', b.x + b.w / 2, b.y + b.h / 2, u * 3.4);
  if (S.tap && inside(S.tap, b)) go('menu');
}
function play(dt) {
  const c = S.ctx, game = S.game, active = players.list.slice(0, S.n);
  dim(0.3);
  S.lostT = active.some(p => p.present) ? 0 : S.lostT + dt;
  const paused = S.lostT > 2;
  if (!paused) { c.t += dt; game.update(S.gs, dt, c); for (const p of S.pops) p.t += dt; }
  game.draw(S.gs, g, c);
  for (const p of active) drawSkeleton(g, p, 0.75);
  hud();
  exitBtn(dt);
  if (paused) { dim(0.6); text('플레이어를 찾는 중…', W / 2, H / 2, u * 8); }
  if (S.name === 'play' && (c.t >= c.dur || S.done)) {
    const top = Math.max(c.score[0], S.n === 2 ? c.score[1] : 0), prev = +localStorage.getItem(bestKey()) || 0;
    S.newBest = top > prev; if (S.newBest) localStorage.setItem(bestKey(), top);
    S.best = Math.max(top, prev);
    go('result'); sfx.win();
  }
}
function result(dt) {
  dim(0.6);
  const c = S.ctx, [a, b] = c.score;
  text(`${S.game.emoji} ${S.game.title}`, W / 2, u * 9, u * 6);
  if (S.n === 2) {
    text(a === b ? '무승부!' : `P${a > b ? 1 : 2} 승리! 🏆`, W / 2, u * 25, u * 10, a === b ? '#fff' : COLORS[a > b ? 0 : 1]);
    text(`P1  ${a}`, W * 0.39, u * 43, u * 8, COLORS[0]); text(`P2  ${b}`, W * 0.61, u * 43, u * 8, COLORS[1]);
  } else {
    text(`${a}점`, W / 2, u * 36, u * 18, '#ffd23f');
  }
  text(S.newBest ? '🎉 최고 기록 갱신!' : `최고 기록 ${S.best}`, W / 2, u * 58, u * 4.6, '#cfd6ff');
  for (const p of players.list) drawSkeleton(g, p, 0.5);
  if (S.t < 1.5) return; // 게임 끝 동작이 버튼을 바로 누르지 않게
  // 버튼은 든 손이 닿는 높이(화면 위쪽 절반)에만 둔다
  runButtons([
    { id: 'again', x: W * 0.03, y: u * 26, w: W * 0.22, h: u * 26, label: '다시 하기', on: () => startGame(S.game) },
    { id: 'menu', x: W * 0.75, y: u * 26, w: W * 0.22, h: u * 26, label: '메뉴로', on: () => go('menu') },
  ], dt);
  text('손을 들어 선택', W / 2, u * 90, u * 4.2, '#ffd23f');
}

// ── 메인 루프 ────────────────────────────────────────────────────────────
const screens = { menu, ready, count, play, result };
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!input || S.name === 'boot') return;
  players.update(input.frame(W, H), W, H, S.name === 'menu' || S.name === 'result' ? 2 : S.n, dt);
  g.clearRect(0, 0, W, H);
  if (input.kind === 'sim') { g.fillStyle = '#1a2148'; g.fillRect(0, 0, W, H); }
  S.t += dt;
  screens[S.name](dt);
  S.tap = null;
}
requestAnimationFrame(loop);

// ── 시작 ─────────────────────────────────────────────────────────────────
async function boot() {
  const btn = $('startBtn'), status = $('status');
  btn.disabled = true; unlockAudio();
  try {
    input = await createInput({ sim: q.has('sim'), bot: q.has('bot'), video: $('cam'), onStatus: s => { status.textContent = s; } });
    loadAssets();
    try { await navigator.wakeLock?.request('screen'); } catch (e) {} // 화면 꺼짐 방지
    document.addEventListener('visibilitychange', () => { if (!document.hidden) navigator.wakeLock?.request('screen').catch(() => {}); });
    $('boot').classList.add('hidden');
    const direct = GAMES.find(gm => gm.id === q.get('game'));
    if (direct) startGame(direct); else go('menu');
  } catch (e) {
    console.error(e); btn.disabled = false;
    status.textContent = e.name === 'NotAllowedError'
      ? '카메라 권한이 거부되었습니다.\n설정 > Safari > 카메라를 "허용"으로 바꾼 뒤 새로고침하세요.'
      : '시작 실패: ' + (e.message || e);
  }
}
$('startBtn').addEventListener('click', boot);
if (q.has('sim')) boot();
