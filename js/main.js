// 진행 흐름: boot → menu → ready(카메라 앞에 서기) → count(3·2·1) → play → result
// 놀이 로직은 js/games/*.js 에만 있다. 여기는 공통 틀(메뉴, 남은 시간, 별 개수, 칭찬 화면)만 담당.
// 대상은 만 3~4세: 실패·감점·승패·글자 의존이 없어야 한다. 안내는 say() 음성으로.
import { createInput } from './input.js';
import { Players, drawSkeleton } from './players.js';
import { sfx, say, loadVoice, unlockAudio } from './audio.js';
import { loadAssets, sprite } from './assets.js';
import { GAMES } from './games/index.js';

const q = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const cv = $('stage'), g = cv.getContext('2d');
const DWELL = 1.0; // 손을 올려두면 선택되는 시간(초). 아이에겐 어려우니 어른이 터치로 고르는 것이 기본

let W = 0, H = 0, u = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight; u = H / 100;
  cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize); resize();

const players = new Players();
let input = null;
const S = { name: 'boot', t: 0, game: null, gs: null, ctx: null, tap: null, hold: 0, lastSec: 0, lostT: 0, pops: [], parts: [] };
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
const present = () => players.list.filter(p => p.present);

// 화면의 (x,y) 반지름 r 원에 누군가 닿았는가 → 닿은 플레이어 또는 null. body=true 면 손뿐 아니라 머리·가슴도 인정.
function touching(x, y, r, body = false) {
  for (const p of present()) {
    if (p.hands.some(h => Math.hypot(h.x - x, h.y - y) < r + p.sw * 0.25)) return p;
    if (body) {
      const chest = { x: p.shoulder.x, y: (p.shoulder.y + p.hip.y) / 2 };
      if ([p.nose, chest].some(o => Math.hypot(o.x - x, o.y - y) < r + p.sw * 0.5)) return p;
    }
  }
  return null;
}
function burst(x, y, color) {
  for (let i = 0; i < 10; i++) { const a = Math.random() * 7, v = u * (20 + Math.random() * 30); S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, color }); }
}

// ── 손으로 누르는 버튼 ───────────────────────────────────────────────────
// 손이 가슴 위로 올라왔을 때만 커서로 인정(내린 손이 버튼을 건드리는 오작동 방지). 터치는 즉시 선택.
function cursors() {
  const out = [];
  for (const p of present()) for (const h of p.hands) if (h.y < p.shoulder.y + p.torso * 0.6) out.push({ x: h.x, y: h.y, color: p.color });
  return out;
}
function runButtons(btns, dt) {
  const cs = cursors();
  let fired = null;
  for (const b of btns) {
    const hot = cs.some(c => inside(c, b));
    let p = hot ? (dwell[b.id] || 0) + dt / DWELL : Math.max(0, (dwell[b.id] || 0) - dt * 2);
    if (S.tap && inside(S.tap, b)) p = 1;
    dwell[b.id] = p;
    if (p >= 1 && !fired) fired = b;
    g.save();
    rrect(b.x, b.y, b.w, b.h, u * 3);
    g.fillStyle = hot ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.16)'; g.fill();
    g.lineWidth = u * 0.7; g.strokeStyle = b.color || '#fff'; g.stroke();
    if (p > 0 && p < 1) { g.clip(); g.fillStyle = 'rgba(255,210,63,.55)'; g.fillRect(b.x, b.y + b.h * (1 - p), b.w, b.h * p); }
    g.restore();
    const cx = b.x + b.w / 2;
    if (b.icon) {
      sprite(g, b.icon[0], b.icon[1], cx, b.y + b.h * 0.5, b.h * 0.62);
    } else text(b.label, cx, b.y + b.h / 2, b.big ? b.h * 0.55 : Math.min(b.h * 0.42, b.w * 0.16));
  }
  for (const c of cs) { g.beginPath(); g.arc(c.x, c.y, u * 2.4, 0, 7); g.fillStyle = c.color; g.fill(); g.lineWidth = u * 0.6; g.strokeStyle = '#fff'; g.stroke(); }
  if (fired) { dwell = {}; sfx.select(); fired.on(); }
}

// ── 상태 전환 ────────────────────────────────────────────────────────────
function go(name) { S.name = name; S.t = 0; S.hold = 0; S.lastSec = 0; dwell = {}; if (name === 'menu') say('menu'); }
function startGame(game) { S.game = game; go('ready'); say(game.id); }
function beginPlay() {
  const game = S.game;
  S.pops = []; S.parts = []; S.lostT = 0;
  const c = S.ctx = {
    get W() { return W; }, get H() { return H; }, get u() { return u; },
    players: players.list, present, touching, score: 0, t: 0, dur: game.duration, sfx, say, text,
    sprite: (key, emoji, x, y, size) => sprite(g, key, emoji, x, y, size),
    add(n, x, y, color = '#ffd23f') { c.score += n; S.pops.push({ x, y, str: '⭐', t: 0 }); burst(x, y, color); },
  };
  S.gs = game.start(c);
  go('play'); sfx.go();
}

// ── 화면별 처리 ──────────────────────────────────────────────────────────
function menu(dt) {
  dim(0.5);
  text('🐜', W / 2, u * 10, u * 11);
  const bw = Math.min(W * 0.21, u * 40), gap = (W - bw * 4) / 5, btns = [];
  GAMES.forEach((gm, i) => btns.push({ id: gm.id, x: gap + i * (bw + gap), y: u * 20, w: bw, h: u * 56, color: gm.color,
    icon: ['icon_' + gm.id, gm.emoji], label: gm.title, on: () => startGame(gm) }));
  btns.push({ id: 'flip', x: W - u * 15, y: u * 2.5, w: u * 12, h: u * 10, label: '🔄', big: 1, on: () => input.flip().catch(console.warn) });
  for (const p of players.list) drawSkeleton(g, p, 0.55);
  runButtons(btns, dt);
}
function ready(dt) {
  dim(0.35);
  sprite(g, 'icon_' + S.game.id, S.game.emoji, W / 2, u * 16, u * 22);
  for (const p of players.list) drawSkeleton(g, p);
  const n = present().length;
  text(n ? '👍' : '👀', W / 2, u * 86, u * 12);
  S.hold = n ? S.hold + dt : 0; // 가만히 서 있기를 요구하지 않는다. 보이기만 하면 2초 뒤 시작
  exitBtn();
  if (S.hold > 2 || q.has('skip')) go('count');
}
function count() {
  dim(0.3);
  for (const p of players.list) drawSkeleton(g, p);
  const left = 3 - Math.floor(S.t);
  if (left !== S.lastSec) { S.lastSec = left; if (left > 0) sfx.tick(); }
  if (left <= 0) return beginPlay();
  text(String(left), W / 2, H / 2, u * 40 * (1.25 - (S.t % 1) * 0.25), '#ffd23f');
}
function hud(dt) {
  const c = S.ctx, k = Math.max(0, 1 - c.t / c.dur), bw = W * 0.36;
  rrect(W / 2 - bw / 2, u * 4.5, bw, u * 3.5, u * 1.7); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); // 남은 시간(숫자 대신 막대)
  if (k > 0.02) { rrect(W / 2 - bw / 2, u * 4.5, bw * k, u * 3.5, u * 1.7); g.fillStyle = '#ffd23f'; g.fill(); }
  text(`⭐ ${c.score}`, u * 4, u * 7, u * 8.5, '#ffd23f', 'left');
  S.parts = S.parts.filter(p => (p.t += dt) < 0.5);
  for (const p of S.parts) { g.globalAlpha = 1 - p.t / 0.5; g.fillStyle = p.color; g.beginPath(); g.arc(p.x + p.vx * p.t, p.y + p.vy * p.t, u * 1.1, 0, 7); g.fill(); }
  S.pops = S.pops.filter(p => (p.t += dt) < 0.8);
  for (const p of S.pops) { g.globalAlpha = 1 - p.t / 0.8; text(p.str, p.x, p.y - p.t * u * 16, u * 7); }
  g.globalAlpha = 1;
}
function exitBtn() { // 터치 전용(놀이 중 손동작으로 눌리면 안 됨)
  const b = { x: W - u * 13, y: u * 2.5, w: u * 10, h: u * 9 };
  g.globalAlpha = 0.6; rrect(b.x, b.y, b.w, b.h, u * 2); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.globalAlpha = 1;
  text('✕', b.x + b.w / 2, b.y + b.h / 2, u * 5);
  if (S.tap && inside(S.tap, b)) go('menu');
}
function play(dt) {
  const c = S.ctx, game = S.game;
  dim(0.3);
  S.lostT = present().length ? 0 : S.lostT + dt;
  const paused = S.lostT > 2; // 아이가 화면 밖으로 나가면 시간이 멈춘다
  if (!paused) { c.t += dt; game.update(S.gs, dt, c); }
  game.draw(S.gs, g, c);
  for (const p of players.list) drawSkeleton(g, p, 0.75);
  hud(paused ? 0 : dt);
  exitBtn();
  if (paused) { dim(0.6); text('👀', W / 2, H / 2, u * 24); if (S.lostT - dt <= 2) say('lost'); }
  if (S.name === 'play' && c.t >= c.dur) { go('result'); sfx.win(); say('done'); }
}
function result(dt) {
  dim(0.6);
  const c = S.ctx, bounce = 1 + Math.abs(Math.sin(S.t * 4)) * 0.06;
  text('🎉👏🎉', W / 2, u * 14, u * 12 * bounce);
  text(`⭐ ${c.score}`, W / 2, u * 40, u * 22);
  if (Math.random() < 0.3) burst(Math.random() * W, Math.random() * H * 0.5, ['#ffd23f', '#ff9ad5', '#7fd8ff', '#7dff9b'][Math.floor(Math.random() * 4)]);
  S.parts = S.parts.filter(p => (p.t += dt) < 0.5);
  for (const p of S.parts) { g.globalAlpha = 1 - p.t / 0.5; g.fillStyle = p.color; g.beginPath(); g.arc(p.x + p.vx * p.t, p.y + p.vy * p.t, u * 1.1, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  for (const p of players.list) drawSkeleton(g, p, 0.5);
  if (S.t < 2.5) return; // 신나서 흔드는 손이 버튼을 바로 누르지 않게
  runButtons([ // 버튼은 든 손이 닿는 높이(화면 위쪽 절반)에만 둔다
    { id: 'again', x: W * 0.03, y: u * 28, w: W * 0.22, h: u * 26, label: '🔁', big: 1, on: () => startGame(S.game) },
    { id: 'menu', x: W * 0.75, y: u * 28, w: W * 0.22, h: u * 26, label: '🏠', big: 1, on: () => go('menu') },
  ], dt);
}

// ── 메인 루프 ────────────────────────────────────────────────────────────
const screens = { menu, ready, count, play, result };
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!input || S.name === 'boot') return;
  players.update(input.frame(W, H), W, H, 2, dt); // 항상 최대 2명. 인원 선택 없음
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
  btn.disabled = true; unlockAudio(); loadVoice(); say('hello'); // iOS 는 탭 직후에 한 번 말해야 이후 음성이 풀린다
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
