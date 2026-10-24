'use strict';

/* ============================================================
   Tamagochi — animal virtuel en pixel art
   Le temps s'écoule en temps réel, même application fermée.
   ============================================================ */

const SAVE_KEY = 'tamagochi-save-v1';
const COLS = 32, ROWS = 24;
const MIN = 60e3, HOUR = 60 * MIN;
const MAX_OFFLINE = 14 * 24 * HOUR;

/* --- Sprites ---------------------------------------------------
   '#' toujours allumé · 'e' œil ouvert (masqué en dormant)
   'E' bas de l'œil (toujours) · 'm' sourire · 's' bouche triste  */
const SPRITES = {
  egg: [
    '....####....',
    '...#....#...',
    '..#......#..',
    '.#..##....#.',
    '.#.#..#...#.',
    '#.........##',
    '#..........#',
    '#...##.....#',
    '#..#..#..#.#',
    '#.......#..#',
    '.#........#.',
    '.#........#.',
    '..#......#..',
    '...######...',
  ],
  eggCrack: [
    '....####....',
    '...#....#...',
    '..#......#..',
    '.#..#.....#.',
    '.#.#.#..#.#.',
    '#.#...##.#.#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '.#........#.',
    '.#........#.',
    '..#......#..',
    '...######...',
  ],
  baby: [
    '....####....',
    '..##....##..',
    '.#........#.',
    '#..e....e..#',
    '#..E....E..#',
    '#..........#',
    '#..mssssm..#',
    '.#.smmmms.#.',
    '..##....##..',
    '....####....',
  ],
  child: [
    '..#........#..',
    '.#.#......#.#.',
    '.#..######..#.',
    '#............#',
    '#...e....e...#',
    '#...E....E...#',
    '#............#',
    '#....mssm....#',
    '#....smms....#',
    '.#..........#.',
    '..##########..',
    '...#......#...',
    '..##......##..',
  ],
  adult: [
    '.......##.......',
    '......#..#......',
    '.......##.......',
    '....########....',
    '...#........#...',
    '..#..........#..',
    '..#..e....e..#..',
    '..#..E....E..#..',
    '#.#..........#.#',
    '.##...mssm...##.',
    '..#...smms...#..',
    '..#..........#..',
    '...#........#...',
    '....########....',
    '....#......#....',
    '...##......##...',
  ],
  ghost: [
    '...######...',
    '..#......#..',
    '.#........#.',
    '#..#....#..#',
    '#..........#',
    '#...####...#',
    '#..........#',
    '#..........#',
    '#.##.##.##.#',
    '##..#..#..##',
  ],
  poop: ['..#....', '.###...', '..###..', '.#####.', '#######'],
  meal: ['..###..', '.#####.', '#######', '.......', '#######', '.#####.'],
  snack: ['#.###.#', '.#####.', '#######', '.#####.', '#.###.#'],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  skull: ['.###.', '#.#.#', '#####', '.###.', '.#.#.'],
  sparkle: ['..#..', '..#..', '##.##', '..#..', '..#..'],
  z: ['####', '..#.', '.#..', '####'],
  alert: ['#', '#', '#', '.', '#'],
  no: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  arrowL: ['..#..', '.#...', '#####', '.#...', '..#..'],
  arrowR: ['..#..', '...#.', '#####', '...#.', '..#..'],
  ball: ['.###.', '#.###', '##.##', '###.#', '.###.'],
};

const STAGES = [
  { id: 'egg', label: 'Œuf', until: 1 * MIN },
  { id: 'baby', label: 'Bébé', until: 24 * HOUR },
  { id: 'child', label: 'Enfant', until: 72 * HOUR },
  { id: 'adult', label: 'Adulte', until: Infinity },
];

const STATS = ['hunger', 'happy', 'energy', 'clean', 'health'];

/* --- Utilitaires ------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => a + Math.random() * (b - a);
const buzz = (ms = 25) => navigator.vibrate?.(ms);

function stageOf(s, now = Date.now()) {
  const age = now - s.born;
  return STAGES.find((st) => age < st.until);
}

function formatAge(ms) {
  const d = Math.floor(ms / (24 * HOUR));
  const h = Math.floor((ms % (24 * HOUR)) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}

/* --- État du jeu ------------------------------------------------ */
let pet = null;

function newPet(name) {
  const now = Date.now();
  return {
    name,
    born: now,
    last: now,
    alive: true,
    hunger: 80,
    happy: 80,
    energy: 100,
    clean: 100,
    health: 100,
    weight: 5,
    poops: 0,
    sick: false,
    asleep: false,
    nextPoop: now + rand(2, 4) * HOUR,
    diedAt: null,
    cause: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save() {
  if (!pet) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(pet)); } catch { /* stockage indisponible */ }
}

/* --- Simulation (rattrape aussi le temps passé hors-ligne) ------ */
function step(s, t, dt) {
  if (!s.alive || stageOf(s, t).id === 'egg') return;
  const h = dt / HOUR;
  const slow = s.asleep ? 0.35 : 1;

  s.hunger = clamp(s.hunger - 5 * h * slow);
  s.happy = clamp(s.happy - 4 * h * slow);
  s.energy = clamp(s.asleep ? s.energy + 15 * h : s.energy - 4 * h);
  s.clean = clamp(s.clean - (1.5 + s.poops * 4) * h);

  if (!s.asleep && s.energy <= 0) s.asleep = true;

  if (t >= s.nextPoop) {
    s.poops = Math.min(s.poops + 1, 4);
    s.nextPoop = t + rand(2, 4) * HOUR;
  }

  if (!s.sick && (s.poops >= 3 || s.clean < 25 || s.weight > 40 || s.hunger <= 0)) {
    if (Math.random() < 0.2 * h) s.sick = true;
  }

  let damage = 0;
  if (s.hunger <= 0) damage += 4;
  if (s.happy <= 0) damage += 1;
  if (s.clean <= 10) damage += 2;
  if (s.sick) damage += 3;
  s.health = clamp(damage ? s.health - damage * h : s.health + 2 * h);

  if (s.health <= 0) {
    s.alive = false;
    s.diedAt = t;
    s.cause = s.hunger <= 0 ? 'de faim' : s.sick ? 'de maladie' : 'par manque de soins';
  }
}

function simulate(s, now) {
  let t = Math.max(s.last, now - MAX_OFFLINE);
  while (t < now && s.alive) {
    const dt = Math.min(MIN, now - t);
    t += dt;
    step(s, t, dt);
  }
  s.last = now;
}

/* --- Rendu LCD -------------------------------------------------- */
const canvas = $('#lcd');
const ctx = canvas.getContext('2d');
let P = 10;
let frame = 0;
let petX = 10;
let facing = 1;
let anim = null; // { type, until, data }

function resize() {
  const w = canvas.clientWidth * (window.devicePixelRatio || 1);
  P = Math.max(4, Math.floor(w / COLS));
  canvas.width = P * COLS;
  canvas.height = P * ROWS;
}

function px(x, y, on) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  ctx.fillStyle = on;
  const g = Math.max(1, Math.round(P * 0.1));
  ctx.fillRect(x * P + g, y * P + g, P - g, P - g);
}

function blit(sprite, x, y, ink, opts = {}) {
  sprite.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      let on = false;
      if (ch === '#' || ch === 'E') on = true;
      else if (ch === 'e') on = !opts.closed;
      else if (ch === 'm') on = !opts.sad;
      else if (ch === 's') on = !!opts.sad;
      if (on) px(x + (opts.flip ? row.length - 1 - i : i), y + j, ink);
    });
  });
}

function draw() {
  frame++;
  const now = Date.now();
  const dark = pet?.asleep && pet.alive;
  const ink = dark ? '#9fb08a' : '#1d2b1a';
  const ghostInk = dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';
  $('#screen').classList.toggle('dark', !!dark);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) px(x, y, ghostInk);
  if (!pet) return;

  if (!pet.alive) {
    const bob = frame % 4 < 2 ? 0 : 1;
    blit(SPRITES.ghost, 10, 5 + bob, ink);
    return;
  }

  const stage = stageOf(pet, now);
  if (stage.id === 'egg') {
    const hatching = now - pet.born > stage.until - 15e3;
    const wobble = hatching ? (frame % 2 ? 1 : -1) : (frame % 8 === 0 ? 1 : 0);
    blit(hatching ? SPRITES.eggCrack : SPRITES.egg, 10 + wobble, 6, ink);
    return;
  }

  const sprite = SPRITES[stage.id];
  const w = sprite[0].length;
  const groundY = ROWS - sprite.length - 2;
  const mood = (pet.hunger + pet.happy + pet.health) / 3;
  const sad = mood < 40 || pet.sick;

  // Déplacement façon Tamagotchi : petits pas aléatoires
  if (!anim && !pet.asleep && frame % 2 === 0) {
    if (Math.random() < 0.15) facing = -facing;
    petX = clamp(petX + facing, 1, COLS - w - 10);
  }

  let x = petX, y = groundY;
  if (anim?.type === 'game') x = Math.floor((COLS - w) / 2);
  if (!pet.asleep && frame % 2) y -= 1; // rebond

  const flip = anim?.type === 'game' && anim.data.shown ? anim.data.dir === 'left' : facing < 0;
  blit(sprite, x, y, ink, { closed: pet.asleep, sad, flip });

  // Crottes
  for (let i = 0; i < Math.min(pet.poops, 2); i++) blit(SPRITES.poop, COLS - 8, ROWS - 6 - i * 6, ink);
  if (pet.poops > 2) px(COLS - 1, ROWS - 1, ink);

  if (pet.sick) blit(SPRITES.skull, 1, 1, ink);
  if (pet.asleep) {
    const zy = 2 + (frame % 6 < 3 ? 0 : 1);
    blit(SPRITES.z, x + w, zy, ink);
  }

  const needsCare = pet.hunger < 25 || pet.happy < 25 || pet.clean < 30 || pet.sick || pet.poops > 0;
  if (needsCare && frame % 4 < 2) blit(SPRITES.alert, COLS - 2, 1, ink);

  drawAnim(x, y, w, ink, now);
}

function drawAnim(x, y, w, ink, now) {
  if (!anim) return;
  if (now > anim.until && anim.type !== 'game') { anim = null; return; }
  const t = Math.floor((anim.until - now) / 400);
  switch (anim.type) {
    case 'meal':
    case 'snack': {
      const food = SPRITES[anim.type];
      const bites = Math.max(0, food.length - (4 - t) * 2);
      blit(food.slice(0, bites), x + w + 1, y + 3, ink);
      break;
    }
    case 'happy':
      if (frame % 2) blit(SPRITES.heart, x + w + 1, 1, ink);
      break;
    case 'wash':
      blit(SPRITES.sparkle, 2 + (frame % 3) * 9, 2 + (frame % 2) * 3, ink);
      blit(SPRITES.sparkle, 22 - (frame % 3) * 7, 10 - (frame % 2) * 4, ink);
      break;
    case 'heal':
      blit(SPRITES.sparkle, x + w + 1, 2 + (frame % 2), ink);
      break;
    case 'no':
      if (frame % 2) blit(SPRITES.no, x + w + 1, 2, ink);
      break;
    case 'game':
      blit(SPRITES.ball, 1, 1, ink);
      for (let i = 0; i < anim.data.score; i++) px(8 + i * 2, 2, ink);
      if (anim.data.shown) {
        blit(anim.data.dir === 'left' ? SPRITES.arrowL : SPRITES.arrowR, anim.data.dir === 'left' ? 2 : COLS - 7, 10, ink);
        if (anim.data.win && frame % 2) blit(SPRITES.heart, COLS - 8, 1, ink);
      }
      break;
  }
}

/* --- Interface -------------------------------------------------- */
let bubbleTimer = null;
function say(text, ms = 2500) {
  const el = $('#bubble');
  el.textContent = text;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => (el.textContent = ''), ms);
}

function updateUI() {
  if (!pet) return;
  const now = Date.now();
  const stage = stageOf(pet, now);
  $('#petName').textContent = pet.name;
  const age = (pet.alive ? now : pet.diedAt) - pet.born;
  $('#petMeta').textContent = pet.alive
    ? `${stage.label} · ${formatAge(age)} · ${Math.round(pet.weight)} g`
    : `Parti(e) à ${formatAge(age)}`;

  document.querySelectorAll('.stat').forEach((el) => {
    const v = pet[el.dataset.key];
    const bar = el.querySelector('b');
    bar.style.width = `${v}%`;
    bar.style.background = v > 50 ? 'var(--good)' : v > 25 ? 'var(--mid)' : 'var(--bad)';
  });

  const isEgg = stage.id === 'egg';
  const busy = anim?.type === 'game';
  document.querySelectorAll('#actions button').forEach((b) => {
    b.disabled = !pet.alive || isEgg || busy || (pet.asleep && b.dataset.act !== 'light');
  });
  $('#lightIcon').textContent = pet.asleep ? '☀️' : '💡';
  $('#lightLabel').textContent = pet.asleep ? 'Réveiller' : 'Dormir';

  const title = (pet.alive && (pet.hunger < 25 || pet.sick || pet.poops > 1)) ? '(!) Tamagochi' : 'Tamagochi';
  if (document.title !== title) document.title = title;
}

function showMenu(id) {
  ['#actions', '#feedMenu', '#gameMenu'].forEach((m) => $(m).classList.toggle('hidden', m !== id));
}

function startAnim(type, ms = 1600, data = {}) {
  anim = { type, until: Date.now() + ms, data };
}

/* --- Actions ---------------------------------------------------- */
const actions = {
  feed() {
    showMenu('#feedMenu');
  },
  play() {
    if (pet.energy < 15) { startAnim('no'); return say(`${pet.name} est trop fatigué·e pour jouer.`); }
    showMenu('#gameMenu');
    startAnim('game', 0, { round: 0, score: 0, shown: false });
    say(`Manche 1/5 — devine où ${pet.name} va regarder !`, 4000);
  },
  wash() {
    if (pet.poops === 0 && pet.clean > 90) { startAnim('no'); return say('Déjà tout propre ✨'); }
    pet.poops = 0;
    pet.clean = 100;
    startAnim('wash');
    say('Tout propre !');
  },
  heal() {
    if (!pet.sick) {
      startAnim('no');
      return say(`${pet.name} n'est pas malade.`);
    }
    pet.sick = false;
    pet.health = clamp(pet.health + 25);
    pet.happy = clamp(pet.happy - 5);
    startAnim('heal');
    say('Beurk… mais ça va mieux !');
  },
  light() {
    pet.asleep = !pet.asleep;
    say(pet.asleep ? 'Bonne nuit… 💤' : 'Debout !');
  },
};

function feed(kind) {
  showMenu('#actions');
  if (kind === 'back') return;
  if (kind === 'meal' && pet.hunger >= 95) {
    startAnim('no');
    return say(`${pet.name} n'a plus faim.`);
  }
  if (kind === 'meal') {
    pet.hunger = clamp(pet.hunger + 30);
    pet.weight += 1;
    say('Miam !');
  } else {
    pet.hunger = clamp(pet.hunger + 8);
    pet.happy = clamp(pet.happy + 15);
    pet.weight += 2;
    if (pet.weight > 40) pet.health = clamp(pet.health - 3);
    say('Trop bon !! 🍬');
  }
  startAnim(kind);
}

function guess(dir) {
  const g = anim?.data;
  if (!g || g.shown) return;
  g.dir = Math.random() < 0.5 ? 'left' : 'right';
  g.win = g.dir === dir;
  g.shown = true;
  g.round++;
  if (g.win) g.score++;
  say(g.win ? 'Gagné ! 🎉' : 'Raté…', 1200);
  buzz(g.win ? 60 : 20);

  setTimeout(() => {
    if (g.round < 5) {
      g.shown = false;
      say(`Manche ${g.round + 1}/5 — gauche ou droite ?`, 4000);
      return;
    }
    const won = g.score >= 3;
    pet.happy = clamp(pet.happy + (won ? 30 : 10));
    pet.energy = clamp(pet.energy - 10);
    pet.weight = Math.max(1, pet.weight - 1);
    showMenu('#actions');
    startAnim(won ? 'happy' : 'no', 2000);
    say(won ? `Victoire ${g.score}/5 ! ${pet.name} est ravi·e 💛` : `Perdu ${g.score}/5… mais c'était amusant.`, 3500);
    save();
    updateUI();
  }, 1100);
}

/* --- Cycle de vie ----------------------------------------------- */
function askName() {
  const dlg = $('#nameDialog');
  $('#nameInput').value = '';
  dlg.showModal();
}

$('#nameForm').addEventListener('submit', () => {
  const name = $('#nameInput').value.trim() || 'Pixel';
  pet = newPet(name);
  petX = 10;
  anim = null;
  showMenu('#actions');
  save();
  say(`L'œuf va bientôt éclore…`, 4000);
});

$('#nameDialog').addEventListener('cancel', (e) => e.preventDefault());
$('#deathDialog').addEventListener('cancel', (e) => e.preventDefault());
$('#deathDialog').addEventListener('close', askName);

let deathShown = false;
let lastStage = null;

function tick() {
  if (!pet) return;
  simulate(pet, Date.now());
  const stage = stageOf(pet).id;
  if (lastStage && stage !== lastStage && pet.alive) {
    say(stage === 'baby' ? `${pet.name} est né·e ! 🐣` : `${pet.name} a grandi ! ✨`, 4000);
    buzz(80);
  }
  lastStage = stage;

  if (!pet.alive && !deathShown) {
    deathShown = true;
    anim = null;
    showMenu('#actions');
    $('#deathText').textContent = `${pet.name} est parti·e ${pet.cause}, à l'âge de ${formatAge(pet.diedAt - pet.born)}.`;
    setTimeout(() => $('#deathDialog').showModal(), 1500);
  }
  if (pet.alive) deathShown = false;
  updateUI();
}

/* --- Événements ------------------------------------------------- */
document.querySelectorAll('[data-act]').forEach((b) =>
  b.addEventListener('click', () => { buzz(); actions[b.dataset.act](); save(); updateUI(); }));
document.querySelectorAll('[data-food]').forEach((b) =>
  b.addEventListener('click', () => { buzz(); feed(b.dataset.food); save(); updateUI(); }));
document.querySelectorAll('[data-guess]').forEach((b) =>
  b.addEventListener('click', () => guess(b.dataset.guess)));

$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Abandonner ton Tamagochi et recommencer avec un nouvel œuf ?')) return;
  localStorage.removeItem(SAVE_KEY);
  pet = null;
  lastStage = null;
  askName();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(); else tick();
});
window.addEventListener('pagehide', save);
window.addEventListener('resize', resize);

/* --- Démarrage -------------------------------------------------- */
resize();
pet = load();
if (pet) {
  lastStage = stageOf(pet).id;
  const away = Date.now() - pet.last;
  tick();
  if (pet.alive && away > 10 * MIN) say(`Te revoilà ! Absent·e ${formatAge(away)}.`, 3500);
} else {
  askName();
}

setInterval(draw, 400);
setInterval(tick, 1000);
setInterval(save, 5000);
draw();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
