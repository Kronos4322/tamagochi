'use strict';

/* ============================================================
   Tamagochi — animal virtuel en pixel art, façon Digimon
   Le temps s'écoule en temps réel, même application fermée.
   ============================================================ */

const SAVE_KEY = 'tamagochi-save-v1';
const DEX_KEY = 'tamagochi-dex-v1';
const PREFS_KEY = 'tamagochi-prefs-v1';
const STATE_CACHE = 'tamagochi-state';
const COLS = 32, ROWS = 24;
const MIN = 60e3, HOUR = 60 * MIN;
const MAX_OFFLINE = 14 * 24 * HOUR;

/* --- Sprites ---------------------------------------------------
   '#' contour · 'e' œil ouvert (fermé en dormant) · 'E' bas de l'œil
   'm' sourire · 's' bouche triste · 'c' joue
   L'intérieur des formes fermées est rempli et ombré automatiquement. */
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
    '#.c......c.#',
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
    '#..c......c..#',
    '#....mssm....#',
    '#....smms....#',
    '.#..........#.',
    '..##########..',
    '...#......#...',
    '..##......##..',
  ],
  grumo: [
    '#............#',
    '##..........##',
    '.############.',
    '..#........#..',
    '.#..........#.',
    '#..ee....ee..#',
    '#...E....E...#',
    '#............#',
    '#....mssm....#',
    '#....smms....#',
    '.#..........#.',
    '..##########..',
    '..#.#....#.#..',
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
    '#.#.c......c.#.#',
    '.##...mssm...##.',
    '..#...smms...#..',
    '..#..........#..',
    '...#........#...',
    '....########....',
    '....#......#....',
    '...##......##...',
  ],
  drakor: [
    '..#..........#..',
    '..##........##..',
    '...#.######.#...',
    '....#......#....',
    '#..#.e....e.#..#',
    '##.#.E....E.#.##',
    '#.##c......c##.#',
    '#..#..mssm..#..#',
    '.#.#..smms..#.#.',
    '..##........##..',
    '...#..####..#...',
    '...#.#....#.#...',
    '...##......##...',
    '..#..........#..',
    '.##..........##.',
  ],
  bouboule: [
    '......####......',
    '....##....##....',
    '...#........#...',
    '..#..........#..',
    '.#...e....e...#.',
    '.#...E....E...#.',
    '#..............#',
    '#..cc......cc..#',
    '#.....mssm.....#',
    '#.....smms.....#',
    '#..............#',
    '.#............#.',
    '.#............#.',
    '..##........##..',
    '..#.########.#..',
    '..###......###..',
  ],
  spectra: [
    '#......##......#',
    '.#....#..#....#.',
    '..#..#....#..#..',
    '..############..',
    '.#............#.',
    '#..#e......e#..#',
    '#...E......E...#',
    '#..............#',
    '.#...#....#...#.',
    '..#...####...#..',
    '...#........#...',
    '..#.########.#..',
    '.#..#......#..#.',
    '#..##......##..#',
  ],
  gluon: [
    '.....##.....',
    '....#..#....',
    '...#....#...',
    '..#.#..#.#..',
    '.#........#.',
    '#...####...#',
    '#..........#',
    '.##########.',
  ],
  chauvo: [
    '#............#',
    '##..#....#..##',
    '#.#.######.#.#',
    '#..##....##..#',
    '#..#.#..#.#..#',
    '.#.#......#.#.',
    '..##.####.##..',
    '....#....#....',
    '.....####.....',
  ],
  rocaille: [
    '...########...',
    '..#........#..',
    '.#..##..##..#.',
    '.#..........#.',
    '##..######..##',
    '#.#........#.#',
    '#.#........#.#',
    '..##########..',
    '..##......##..',
    '..##......##..',
    '.###......###.',
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
  poop: ['..#....', '.#.#...', '..#.#..', '.#...#.', '#######'],
  meal: ['..###..', '.#...#.', '#.....#', '#######', '#.....#', '.#####.'],
  snack: ['#.###.#', '.#...#.', '#.....#', '.#...#.', '#.###.#'],
  meat: ['.###...', '#...#..', '#....#.', '.#...#.', '..###.#', '.....##'],
  apple: ['...##..', '.##.##.', '#.....#', '#.....#', '#.....#', '.#####.'],
  cake: ['...#...', '..###..', '#######', '#.#.#.#', '#.....#', '#######'],
  mini: ['.#####.', '#.e.e.#', '#..E..#', '#.mmm.#', '.#####.'],
  berry: ['.#.', '#.#', '###'],
  rock: ['#.#', '.#.', '#.#'],
  heart: ['.##.##.', '#..#..#', '#.....#', '.#...#.', '..#.#..', '...#...'],
  skull: ['.###.', '#.#.#', '#####', '.###.', '.#.#.'],
  sparkle: ['..#..', '..#..', '##.##', '..#..', '..#..'],
  z: ['####', '..#.', '.#..', '####'],
  alert: ['#', '#', '#', '.', '#'],
  no: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  arrowL: ['..#..', '.#...', '#####', '.#...', '..#..'],
  arrowR: ['..#..', '...#.', '#####', '...#.', '..#..'],
  ball: ['.###.', '#.###', '##.##', '###.#', '.###.'],
  shot: ['.#.', '#.#', '.#.'],
};

/* --- Monstres : formes du joueur et adversaires ------------------ */
const MONSTERS = {
  bulle: { name: 'Bulle', sprite: 'baby', stage: 'Bébé', atk: 0, hint: "Éclot de l'œuf", likes: 'candy', dislikes: 'meat' },
  kitsu: { name: 'Kitsu', sprite: 'child', stage: 'Enfant', atk: 1, hint: 'Enfant bien soigné (2 erreurs max)', likes: 'fruit', dislikes: 'meat' },
  grumo: { name: 'Grumo', sprite: 'grumo', stage: 'Enfant', atk: 1, hint: 'Enfant négligé (3 erreurs ou +)', likes: 'meat', dislikes: 'fruit' },
  lumen: { name: 'Lumen', sprite: 'adult', stage: 'Adulte', atk: 2, hint: 'Adulte équilibré', likes: 'rice', dislikes: 'cake' },
  drakor: { name: 'Drakor', sprite: 'drakor', stage: 'Adulte', atk: 3, hint: '5 victoires ou + en devenant adulte', likes: 'meat', dislikes: 'candy' },
  bouboule: { name: 'Bouboule', sprite: 'bouboule', stage: 'Adulte', atk: 2, hint: 'Peser 25 g ou + en devenant adulte', likes: 'cake', dislikes: 'fruit' },
  spectra: { name: 'Spectra', sprite: 'spectra', stage: 'Adulte', atk: 3, hint: '6 erreurs de soin ou +', likes: 'candy', dislikes: 'rice' },
  gluon: { name: 'Gluon', sprite: 'gluon' },
  chauvo: { name: 'Chauvo', sprite: 'chauvo' },
  rocaille: { name: 'Rocaille', sprite: 'rocaille' },
};
const FORM_IDS = ['bulle', 'kitsu', 'grumo', 'lumen', 'drakor', 'bouboule', 'spectra'];
const ENEMY_IDS = ['gluon', 'chauvo', 'grumo', 'rocaille', 'bouboule', 'spectra', 'drakor', 'lumen'];

// Aliments : les friandises (treat) se mangent même le ventre plein… à tes risques
const FOODS = {
  rice: { name: 'Riz', icon: '🍚', sprite: 'meal', desc: '+Faim', hunger: 30, weight: 1, line: 'Miam !' },
  meat: { name: 'Viande', icon: '🍖', sprite: 'meat', desc: '++Faim +Poids', hunger: 45, weight: 3, line: 'Ça cale bien !' },
  fruit: { name: 'Fruit', icon: '🍎', sprite: 'apple', desc: '+Faim +Santé', hunger: 15, health: 10, weight: 0, line: 'Croquant et sain 🍎' },
  candy: { name: 'Bonbon', icon: '🍬', sprite: 'snack', desc: '+Joie +Poids', hunger: 5, happy: 15, weight: 2, treat: true, line: 'Trop bon !! 🍬' },
  cake: { name: 'Gâteau', icon: '🍰', sprite: 'cake', desc: '++Joie ++Poids', hunger: 15, happy: 30, weight: 5, treat: true, line: 'Quel festin ! 🍰' },
};

const STAGES = [
  { id: 'egg', label: 'Œuf', until: 1 * MIN },
  { id: 'baby', label: 'Bébé', until: 24 * HOUR },
  { id: 'child', label: 'Enfant', until: 72 * HOUR },
  { id: 'adult', label: 'Adulte', until: Infinity },
];

// Heure du coucher selon l'âge, réveil à 8 h (horloge du téléphone)
const BEDTIME = { baby: 20, child: 21, adult: 22 };
const WAKE_HOUR = 8;

const SHELLS = ['rose', 'bleu', 'menthe', 'soleil', 'nuit', 'cristal'];

/* --- Utilitaires ------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => a + Math.random() * (b - a);
const buzz = (ms = 25) => navigator.vibrate?.(ms);

function stageOf(s, now = Date.now()) {
  const age = now - s.born;
  return STAGES.find((st) => age < st.until);
}

function isNight(stageId, t) {
  const h = new Date(t).getHours();
  return h >= BEDTIME[stageId] || h < WAKE_HOUR;
}

function formatAge(ms) {
  const d = Math.floor(ms / (24 * HOUR));
  const h = Math.floor((ms % (24 * HOUR)) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}

/* --- Préférences (son, coque, notifications) -------------------- */
const prefs = (() => {
  try {
    return { sound: true, shell: 'rose', notify: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return { sound: true, shell: 'rose', notify: false };
  }
})();

function savePrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* stockage indisponible */ }
}

/* --- Sons 8 bits (Web Audio) ------------------------------------ */
const SFX = {
  tap: [[1200, 0.03]],
  eat: [[523, 0.08], [0, 0.04], [523, 0.08], [0, 0.04], [659, 0.12]],
  happy: [[659, 0.08], [784, 0.08], [1047, 0.16]],
  no: [[220, 0.12], [0, 0.04], [196, 0.2]],
  wash: [[1047, 0.05], [1319, 0.05], [1568, 0.05], [2093, 0.1]],
  heal: [[784, 0.1], [988, 0.1], [1175, 0.18]],
  evolve: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.07], [784, 0.07], [1047, 0.07], [1319, 0.3]],
  fire: [[1400, 0.04], [1000, 0.04], [700, 0.06]],
  hit: [[180, 0.05], [120, 0.12]],
  crit: [[1568, 0.05], [180, 0.06], [100, 0.16]],
  miss: [[500, 0.06], [350, 0.1]],
  win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]],
  lose: [[392, 0.16], [330, 0.16], [262, 0.34]],
  alert: [[1568, 0.06], [0, 0.06], [1568, 0.06]],
  night: [[784, 0.14], [659, 0.14], [523, 0.24]],
  morning: [[523, 0.1], [659, 0.1], [784, 0.2]],
  jump: [[400, 0.04], [600, 0.04], [900, 0.06]],
  catch: [[1319, 0.04], [1760, 0.06]],
  yuck: [[300, 0.08], [250, 0.08], [200, 0.16]],
};
let audio = null;

function sfx(name) {
  if (!prefs.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    return;
  }
  let t = audio.currentTime + 0.01;
  for (const [freq, dur] of SFX[name]) {
    if (freq) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur);
    }
    t += dur;
  }
}

/* --- État du jeu ------------------------------------------------ */
let pet = null;
let battle = null;
let dex = loadDex();

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
    night: false,
    lightsOn: true,
    bedAt: 0,
    lightMistake: false,
    nextPoop: now + rand(2, 4) * HOUR,
    mistakes: 0,
    wins: 0,
    losses: 0,
    tastes: {},
    form: null,
    formStage: 'egg',
    diedAt: null,
    cause: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    // Les anciennes sauvegardes n'ont pas tous les champs
    const defaults = { mistakes: 0, wins: 0, losses: 0, tastes: {}, form: null, formStage: null, night: false, lightsOn: true, bedAt: 0, lightMistake: false };
    return raw ? { ...defaults, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

let lastSnapshot = 0;
function save(force = false) {
  if (!pet) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(pet)); } catch { /* stockage indisponible */ }
  // Copie lisible par le service worker (pour les notifications)
  if ((force || Date.now() - lastSnapshot > MIN) && 'caches' in window) {
    lastSnapshot = Date.now();
    caches.open(STATE_CACHE)
      .then((c) => c.put('state.json', new Response(JSON.stringify(pet))))
      .catch(() => {});
  }
}

function loadDex() {
  try {
    return { forms: {}, foes: {}, best: {}, ...JSON.parse(localStorage.getItem(DEX_KEY) || '{}') };
  } catch {
    return { forms: {}, foes: {}, best: {} };
  }
}

function saveDex() {
  try { localStorage.setItem(DEX_KEY, JSON.stringify(dex)); } catch { /* stockage indisponible */ }
}

/* --- Simulation (rattrape aussi le temps passé hors-ligne) ------ */
function step(s, t, dt) {
  const stageId = stageOf(s, t).id;
  if (!s.alive || stageId === 'egg') return;
  const h = dt / HOUR;
  const before = { hunger: s.hunger, clean: s.clean, sick: s.sick };

  // Jour / nuit sur la vraie horloge
  const night = isNight(stageId, t);
  if (night && !s.night) {
    Object.assign(s, { night: true, asleep: true, lightsOn: true, bedAt: t, lightMistake: false });
  } else if (!night && s.night) {
    Object.assign(s, { night: false, asleep: false, lightsOn: true });
  }
  if (s.night && s.lightsOn && !s.lightMistake && t - s.bedAt > 30 * MIN) {
    s.lightMistake = true;
    s.mistakes++;
  }

  const slow = s.asleep ? 0.35 : 1;
  const badSleep = s.asleep && s.lightsOn && s.night; // dormir avec la lumière, c'est mal dormir
  s.hunger = clamp(s.hunger - 5 * h * slow);
  s.happy = clamp(s.happy - (badSleep ? 6 : 4 * slow) * h);
  s.energy = clamp(s.asleep ? s.energy + (badSleep ? 6 : 15) * h : s.energy - 4 * h);
  s.clean = clamp(s.clean - (1.5 + s.poops * 4) * h);

  if (!s.asleep && s.energy <= 0) s.asleep = true;
  if (s.asleep && !s.night && s.energy >= 100) Object.assign(s, { asleep: false, lightsOn: true });

  if (t >= s.nextPoop) {
    s.poops = Math.min(s.poops + 1, 4);
    s.nextPoop = t + rand(2, 4) * HOUR;
  }

  if (!s.sick && (s.poops >= 3 || s.clean < 25 || s.weight > 40 || s.hunger <= 0)) {
    if (Math.random() < 0.2 * h) s.sick = true;
  }

  // Erreurs de soin : elles orientent l'évolution
  if (before.hunger > 0 && s.hunger <= 0) s.mistakes++;
  if (before.clean >= 10 && s.clean < 10) s.mistakes++;
  if (!before.sick && s.sick) s.mistakes++;

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

function needsCare(s) {
  return s.hunger < 25 || s.happy < 25 || s.clean < 30 || s.sick || s.poops > 0 || (s.night && s.lightsOn);
}

/* --- Évolution à branches --------------------------------------- */
function chooseForm(s, stageId) {
  if (stageId === 'baby') return 'bulle';
  if (stageId === 'child') return s.mistakes <= 2 ? 'kitsu' : 'grumo';
  if (s.mistakes >= 6) return 'spectra';
  if (s.wins >= 5) return 'drakor';
  if (s.weight >= 25) return 'bouboule';
  return 'lumen';
}

function evolve() {
  const st = stageOf(pet).id;
  if (!pet.alive || st === 'egg' || pet.formStage === st) return;
  pet.form = chooseForm(pet, st);
  pet.formStage = st;
  if (!dex.forms[pet.form]) {
    dex.forms[pet.form] = Date.now();
    saveDex();
  }
  const name = MONSTERS[pet.form].name;
  say(st === 'baby' ? `${pet.name} est né·e ! C'est un ${name} 🐣` : `${pet.name} évolue en ${name} ! ✨`, 4500);
  startAnim('evolve', 2500);
  buzz(120);
  save();
}

function petSprite() {
  return SPRITES[MONSTERS[pet.form]?.sprite || stageOf(pet).id];
}

function petPower() {
  return (MONSTERS[pet.form]?.atk || 0) + Math.floor(pet.wins / 4);
}

/* --- Rendu LCD -------------------------------------------------- */
const canvas = $('#lcd');
const ctx = canvas.getContext('2d');
const INK = '29,43,26';
const INK_DARK = '159,176,138';
// Opacité de chaque type de pixel : contour, joue, ombre, remplissage, reflet
const TONES = { '#': 1, E: 1, c: 0.55, d: 0.42, f: 0.24, h: 0.08 };
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

function px(x, y, ink, a = 1) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  ctx.fillStyle = `rgba(${ink},${a})`;
  const g = Math.max(1, Math.round(P * 0.1));
  ctx.fillRect(x * P + g, y * P + g, P - g, P - g);
}

// Ombre portée des pixels, comme sur un vrai écran LCD
function shadowPx(x, y, ink) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  ctx.fillStyle = `rgba(${ink},.13)`;
  const g = Math.max(1, Math.round(P * 0.1));
  ctx.fillRect(x * P + g * 3, y * P + g * 3, P - g, P - g);
}

// Analyse d'un sprite : trouve l'intérieur des formes fermées et choisit
// pour chaque pixel s'il est rempli, ombré (bas / bord droit) ou en reflet.
const analyzed = new Map();
function analyze(sprite) {
  if (analyzed.has(sprite)) return analyzed.get(sprite);
  const H = sprite.length, W = Math.max(...sprite.map((r) => r.length));
  const at = (x, y) => sprite[y]?.[x] ?? '.';
  const outside = new Set();
  const queue = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if ((x === 0 || y === 0 || x === W - 1 || y === H - 1) && at(x, y) === '.') {
        outside.add(y * W + x);
        queue.push([x, y]);
      }
    }
  }
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || outside.has(k) || at(nx, ny) !== '.') continue;
      outside.add(k);
      queue.push([nx, ny]);
    }
  }

  let top = H, bottom = 0, left = W, right = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) === '.' && !outside.has(y * W + x)) {
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        left = Math.min(left, x); right = Math.max(right, x);
      }
    }
  }

  const cells = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = at(x, y);
      if (ch !== '.') { cells.push([x, y, ch]); continue; }
      if (outside.has(y * W + x)) continue;
      const ry = (y - top) / (bottom - top || 1);
      const rx = (x - left) / (right - left || 1);
      const shine = at(x, y - 1) === '#' && ry < 0.4 && rx < 0.5;
      const shade = ry > 0.7 || at(x + 1, y) === '#';
      cells.push([x, y, shine ? 'h' : shade ? 'd' : 'f']);
    }
  }
  const result = { W, cells };
  analyzed.set(sprite, result);
  return result;
}

function blit(sprite, x, y, ink, opts = {}) {
  const { W, cells } = analyze(sprite);
  const visible = opts.cutLeft ? cells.filter(([cx]) => cx >= opts.cutLeft) : cells;
  const pixels = visible.map(([cx, cy, k]) => {
    let a;
    if (k === 'e') a = opts.closed ? TONES.f : 1;
    else if (k === 'm') a = opts.sad ? TONES.f : 1;
    else if (k === 's') a = opts.sad ? 1 : TONES.f;
    else a = TONES[k];
    return [x + (opts.flip ? W - 1 - cx : cx), y + cy, a];
  });
  for (const [X, Y, a] of pixels) if (a === 1) shadowPx(X, Y, ink);
  for (const [X, Y, a] of pixels) px(X, Y, ink, a);
}

function clearLCD(ink, a) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) px(x, y, ink, a);
}

function draw() {
  frame++;
  const now = Date.now();
  const dark = pet?.alive && pet.asleep && !pet.lightsOn;
  const ink = dark ? INK_DARK : INK;
  $('#screen').classList.toggle('dark', !!dark);
  clearLCD(dark ? '255,255,255' : INK, dark ? 0.04 : 0.06);
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

  const sprite = petSprite();
  const w = sprite[0].length;
  const groundY = ROWS - sprite.length - 2;
  const mood = (pet.hunger + pet.happy + pet.health) / 3;
  const sad = mood < 40 || pet.sick;

  // Déplacement façon Tamagotchi : petits pas aléatoires
  if (!anim && !pet.asleep && frame % 2 === 0) {
    if (Math.random() < 0.15) facing = -facing;
    petX = clamp(petX + facing, 1, COLS - w - 10);
  }
  petX = Math.min(petX, Math.max(1, COLS - w - 10));

  let x = petX, y = groundY;
  if (anim?.type === 'game') x = Math.floor((COLS - w) / 2);
  if (!pet.asleep && frame % 2) y -= 1; // rebond

  const flip = anim?.type === 'game' && anim.data.shown ? anim.data.dir === 'left' : facing < 0;
  const blinking = frame % 11 === 0;
  const evolving = anim?.type === 'evolve' && frame % 2;
  if (!evolving) blit(sprite, x, y, ink, { closed: pet.asleep || blinking, sad, flip });

  // Crottes
  for (let i = 0; i < Math.min(pet.poops, 2); i++) blit(SPRITES.poop, COLS - 8, ROWS - 6 - i * 6, ink);
  if (pet.poops > 2) px(COLS - 1, ROWS - 1, ink);

  if (pet.sick) blit(SPRITES.skull, 1, 1, ink);
  if (pet.asleep) {
    const zy = 2 + (frame % 6 < 3 ? 0 : 1);
    blit(SPRITES.z, x + w, zy, ink);
  }

  if (needsCare(pet) && frame % 4 < 2) blit(SPRITES.alert, COLS - 2, 1, ink);

  drawAnim(x, y, w, ink, now);
}

function drawAnim(x, y, w, ink, now) {
  if (!anim) return;
  if (now > anim.until && anim.type !== 'game') { anim = null; return; }
  switch (anim.type) {
    case 'eat': {
      // L'aliment disparaît bouchée par bouchée, côté monstre d'abord
      const food = SPRITES[FOODS[anim.data.food].sprite];
      const k = 1 - (anim.until - now) / anim.ms;
      const cut = Math.floor(k * 1.3 * food[0].length);
      if (cut < food[0].length) blit(food, x + w + 1, y + 3, ink, { cutLeft: cut });
      else if (anim.data.like && frame % 2) blit(SPRITES.heart, x + w + 1, 1, ink);
      break;
    }
    case 'happy':
      if (frame % 2) blit(SPRITES.heart, x + w + 1, 1, ink);
      break;
    case 'wash':
      blit(SPRITES.sparkle, 2 + (frame % 3) * 9, 2 + (frame % 2) * 3, ink);
      blit(SPRITES.sparkle, 22 - (frame % 3) * 7, 10 - (frame % 2) * 4, ink);
      break;
    case 'evolve':
      blit(SPRITES.sparkle, 1 + (frame % 2) * 3, 2, ink);
      blit(SPRITES.sparkle, COLS - 6 - (frame % 2) * 3, 4, ink);
      blit(SPRITES.sparkle, COLS - 10, ROWS - 7 + (frame % 2), ink);
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

/* --- Combat -----------------------------------------------------
   Scène A : ton monstre à gauche + jauge de tir.
   Scène B : l'adversaire à droite. Les tirs passent d'une scène à l'autre. */
const PHASE_MS = { intro: 1300, fire: 450, impact: 1000, counter: 450, defend: 1000, win: 1800, lose: 1800 };
const SCENE_B = ['intro', 'impact', 'counter'];

function startBattle() {
  const st = stageOf(pet).id;
  if (st === 'baby') { startAnim('no'); return say(`${pet.name} est trop petit·e pour combattre.`); }
  if (pet.sick) { startAnim('no'); return say(`${pet.name} est malade, soigne-le d'abord 💊`); }
  if (pet.energy < 20) { startAnim('no'); return say(`${pet.name} est trop fatigué·e pour combattre.`); }
  if (pet.hunger < 20) { startAnim('no'); return say(`${pet.name} a trop faim pour combattre.`); }

  const power = petPower();
  const lvl = 1 + Math.floor(pet.wins / 2) + (Math.random() < 0.3 ? 1 : 0);
  const foeId = ENEMY_IDS[Math.min(lvl - 1, ENEMY_IDS.length - 1)];
  const meMax = st === 'adult' ? 4 : 3;
  const foeMax = Math.min(5, 2 + Math.floor(lvl / 2));
  battle = {
    foeId,
    foe: MONSTERS[foeId],
    lvl,
    me: meMax,
    meMax,
    foeHp: foeMax,
    foeMax,
    threshold: clamp(0.6 - 0.06 * power, 0.35, 0.6),
    foeHit: clamp(0.3 + 0.08 * (lvl - power * 1.5), 0.15, 0.75),
    period: 1100 - Math.min(500, lvl * 60),
    phase: 'intro',
    t0: Date.now(),
    dmg: 0,
    hitMe: false,
    landed: false,
  };
  anim = null;
  showMenu('#battleMenu');
  say(`${battle.foe.name} (niv. ${lvl}) te défie ! ⚔️`, 2500);
  sfx('alert');
  buzz(80);
}

function gaugeValue(b, now) {
  return (1 - Math.cos((2 * Math.PI * (now - b.t0)) / b.period)) / 2;
}

function fire() {
  const b = battle;
  if (!b || b.phase !== 'aim') return;
  const v = gaugeValue(b, Date.now());
  b.dmg = v >= 0.92 ? 2 : v >= b.threshold ? 1 : 0;
  say(b.dmg === 2 ? 'Coup critique ! 💥' : b.dmg ? 'Touché !' : 'Raté…', 1500);
  sfx('fire');
  buzz(b.dmg ? 50 : 15);
  setPhase('fire');
}

function setPhase(phase) {
  battle.phase = phase;
  battle.t0 = Date.now();
  battle.landed = false;
}

function updateBattle(now) {
  const b = battle;
  if (!pet.alive) return endBattle('flee');
  const el = now - b.t0;

  // Son à l'arrivée du projectile
  if (!b.landed && el >= 450 && (b.phase === 'impact' || b.phase === 'defend')) {
    b.landed = true;
    if (b.phase === 'impact') sfx(b.dmg === 2 ? 'crit' : b.dmg ? 'hit' : 'miss');
    else sfx(b.hitMe ? 'hit' : 'miss');
  }

  if (b.phase === 'aim' || el < PHASE_MS[b.phase]) return;

  switch (b.phase) {
    case 'intro':
      setPhase('aim');
      say('Tire quand la jauge est haute !', 2500);
      break;
    case 'fire':
      setPhase('impact');
      break;
    case 'impact':
      b.foeHp = Math.max(0, b.foeHp - b.dmg);
      if (b.foeHp <= 0) {
        setPhase('win');
        say(`${b.foe.name} est K.O. ! 🏆`, 2500);
        sfx('win');
        buzz(200);
      } else {
        b.hitMe = Math.random() < b.foeHit;
        setPhase('counter');
        sfx('fire');
      }
      break;
    case 'counter':
      setPhase('defend');
      break;
    case 'defend':
      if (b.hitMe) b.me--;
      say(b.hitMe ? 'Aïe !' : 'Esquivé !', 1200);
      if (b.hitMe) buzz(60);
      if (b.me <= 0) {
        setPhase('lose');
        sfx('lose');
      } else {
        setPhase('aim');
      }
      break;
    case 'win':
    case 'lose':
      endBattle(b.phase);
      break;
  }
}

function endBattle(result) {
  const { foe, foeId } = battle;
  battle = null;
  showMenu('#actions');
  pet.energy = clamp(pet.energy - 20);
  pet.hunger = clamp(pet.hunger - 10);

  if (result === 'win') {
    pet.wins++;
    pet.happy = clamp(pet.happy + 20);
    pet.weight = Math.max(1, pet.weight - 2);
    dex.foes[foeId] = (dex.foes[foeId] || 0) + 1;
    saveDex();
    startAnim('happy', 2000, {}, false);
    say(`Victoire contre ${foe.name} ! (${pet.wins} au total)`, 3000);
  } else if (result === 'lose') {
    pet.losses++;
    pet.health = clamp(pet.health - 20);
    pet.happy = clamp(pet.happy - 10);
    startAnim('no', 1600, {}, false);
    if (Math.random() < 0.35) {
      pet.sick = true;
      say(`${pet.name} est blessé·e… soigne-le vite 💊`, 3500);
    } else {
      say(`Défaite contre ${foe.name}…`, 3000);
    }
  } else {
    pet.happy = clamp(pet.happy - 5);
    say('Tu as pris la fuite 🏳️');
  }
  save();
  updateUI();
}

function drawShot(fromX, toX, y, el, dur, miss) {
  const k = Math.min(1, el / dur);
  blit(SPRITES.shot, Math.round(fromX + (toX - fromX) * k), miss ? y - Math.round(7 * k) : y, INK);
}

function drawPips(n, max, right) {
  for (let i = 0; i < max; i++) {
    const x = right ? COLS - 3 - i * 3 : 1 + i * 3;
    const a = i < n ? 1 : 0.2;
    px(x, 1, INK, a); px(x + 1, 1, INK, a); px(x, 2, INK, a); px(x + 1, 2, INK, a);
  }
}

function drawGauge(b, now) {
  const top = 4, H = 16, v = gaugeValue(b, now);
  const level = Math.round(v * H);
  for (let i = 0; i < H; i++) {
    px(27, top + i, INK);
    px(30, top + i, INK);
    const filled = H - i <= level;
    px(28, top + i, INK, filled ? 1 : 0.12);
    px(29, top + i, INK, filled ? 1 : 0.12);
  }
  px(25, top + H - Math.round(b.threshold * H), INK);
  px(25, top + H - Math.round(0.92 * H), INK);
  px(24, top + H - Math.round(0.92 * H), INK);
}

function drawBattle(now) {
  const b = battle;
  const el = now - b.t0;
  const blink = Math.floor(now / 120) % 2;
  $('#screen').classList.remove('dark');
  clearLCD(INK, 0.06);

  if (SCENE_B.includes(b.phase)) {
    const sprite = SPRITES[b.foe.sprite];
    const fw = sprite[0].length;
    const ex = COLS - fw - 1, ey = ROWS - sprite.length - 2, sy = ey + 5;
    const hurt = b.phase === 'impact' && b.dmg && el > 450;
    if (!(hurt && blink)) blit(sprite, ex, ey, INK, { flip: true });
    drawPips(hurt ? Math.max(0, b.foeHp - b.dmg) : b.foeHp, b.foeMax, true);
    if (b.phase === 'intro' && blink) blit(SPRITES.no, 2, 2, INK);
    if (b.phase === 'impact') {
      if (b.dmg && el < 450) drawShot(-3, ex - 2, sy, el, 450, false);
      else if (b.dmg) blit(SPRITES.sparkle, ex - 2, sy - 1, INK);
      else if (el < 700) drawShot(-3, COLS, sy, el, 700, true);
    }
    if (b.phase === 'counter') drawShot(ex - 3, -4, sy, el, PHASE_MS.counter, false);
    return;
  }

  const sprite = petSprite();
  const pw = sprite[0].length;
  const py = ROWS - sprite.length - 2, sy = py + 5;
  const hurt = b.phase === 'defend' && b.hitMe && el > 450;
  if (!((hurt || b.phase === 'lose') && blink)) blit(sprite, 1, py, INK, { sad: b.phase === 'lose' });
  drawPips(hurt ? b.me - 1 : b.me, b.meMax, false);

  if (b.phase === 'aim') drawGauge(b, now);
  if (b.phase === 'fire') drawShot(pw + 1, COLS, sy, el, PHASE_MS.fire, false);
  if (b.phase === 'defend') {
    if (b.hitMe && el < 450) drawShot(COLS, pw, sy, el, 450, false);
    else if (b.hitMe) blit(SPRITES.sparkle, pw - 1, sy - 1, INK);
    else if (el < 700) drawShot(COLS, -4, sy, el, 700, true);
  }
  if (b.phase === 'win' && blink) blit(SPRITES.heart, COLS - 9, 2, INK);
}

/* --- Interface -------------------------------------------------- */
let bubbleTimer = null;
function say(text, ms = 2500) {
  const el = $('#bubble');
  el.textContent = text;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => (el.textContent = ''), ms);
}

function lightButton() {
  if (pet.night) return pet.lightsOn ? ['🌙', 'Éteindre'] : ['💡', 'Allumer'];
  return pet.asleep ? ['☀️', 'Réveiller'] : ['💤', 'Sieste'];
}

function updateUI() {
  if (!pet) return;
  const now = Date.now();
  const stage = stageOf(pet, now);
  const form = MONSTERS[pet.form];
  $('#petName').textContent = pet.name;
  const age = (pet.alive ? now : pet.diedAt) - pet.born;
  $('#petMeta').textContent = pet.alive
    ? `${form ? `${form.name} (${stage.label})` : stage.label} · ${formatAge(age)} · ${Math.round(pet.weight)} g`
    : `Parti(e) à ${formatAge(age)}`;
  const clock = new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const sky = stage.id !== 'egg' && isNight(stage.id, now) ? '🌙' : '☀️';
  $('#record').textContent = `${sky} ${clock}   ·   ⚔️ ${pet.wins} V · ${pet.losses} D   ·   ⚠️ ${pet.mistakes}`;

  document.querySelectorAll('.stat').forEach((el) => {
    const v = pet[el.dataset.key];
    const bar = el.querySelector('b');
    bar.style.width = `${v}%`;
    bar.style.background = v > 50 ? 'var(--good)' : v > 25 ? 'var(--mid)' : 'var(--bad)';
  });

  const isEgg = stage.id === 'egg';
  const busy = anim?.type === 'game' || !!battle || !!minigame;
  document.querySelectorAll('#actions button').forEach((b) => {
    b.disabled = !pet.alive || isEgg || busy || (pet.asleep && b.dataset.act !== 'light');
  });
  const [icon, label] = lightButton();
  $('#lightIcon').textContent = icon;
  $('#lightLabel').textContent = label;

  const title = (pet.alive && (pet.hunger < 25 || pet.sick || pet.poops > 1)) ? '(!) Tamagochi' : 'Tamagochi';
  if (document.title !== title) document.title = title;
}

function showMenu(id) {
  ['#actions', '#feedMenu', '#playMenu', '#gameMenu', '#catchMenu', '#jumpMenu', '#battleMenu'].forEach((m) => $(m).classList.toggle('hidden', m !== id));
}

const ANIM_SFX = { eat: 'eat', happy: 'happy', no: 'no', wash: 'wash', heal: 'heal', evolve: 'evolve' };
function startAnim(type, ms = 1600, data = {}, sound = true) {
  anim = { type, until: Date.now() + ms, ms, data };
  if (sound && ANIM_SFX[type]) sfx(ANIM_SFX[type]);
}

/* --- Actions ---------------------------------------------------- */
const actions = {
  feed() {
    renderFeedMenu();
    showMenu('#feedMenu');
  },
  play() {
    if (pet.energy < 15) { startAnim('no'); return say(`${pet.name} est trop fatigué·e pour jouer.`); }
    const best = (id) => (dex.best[id] ? ` · record ${dex.best[id]}` : '');
    $('#bestCatch').textContent = `Attrape-fruits${best('catch')}`;
    $('#bestJump').textContent = `Saut${best('jump')}`;
    showMenu('#playMenu');
  },
  fight() {
    startBattle();
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
    if (pet.night) {
      pet.lightsOn = !pet.lightsOn;
      say(pet.lightsOn ? 'Lumière allumée… il fait encore nuit !' : 'Bonne nuit… 💤');
      return;
    }
    pet.asleep = !pet.asleep;
    pet.lightsOn = !pet.asleep;
    say(pet.asleep ? 'Petite sieste… 💤' : 'Debout !');
  },
};

/* --- Alimentation ----------------------------------------------- */
function renderFeedMenu() {
  const buttons = Object.entries(FOODS).map(([id, f]) => {
    const b = document.createElement('button');
    const taste = pet.tastes[`${pet.form}:${id}`];
    b.innerHTML = `<span>${f.icon}</span>${f.name}<small>${f.desc}</small>`;
    if (taste) b.insertAdjacentHTML('beforeend', `<i class="taste">${taste === 'like' ? '❤️' : '🤢'}</i>`);
    b.addEventListener('click', () => { buzz(); sfx('tap'); feed(id); save(); updateUI(); });
    return b;
  });
  const back = document.createElement('button');
  back.innerHTML = '<span>↩</span>Retour';
  back.addEventListener('click', () => { sfx('tap'); showMenu('#actions'); });
  $('#feedMenu').replaceChildren(...buttons, back);
}

function feed(id) {
  showMenu('#actions');
  const food = FOODS[id];
  const form = MONSTERS[pet.form] || {};
  const full = pet.hunger >= 95;
  if (full && !food.treat) {
    startAnim('no');
    return say(`${pet.name} n'a plus faim.`);
  }

  // Chaque forme a ses goûts : on les découvre en lui donnant à manger
  const taste = form.likes === id ? 'like' : form.dislikes === id ? 'dislike' : null;
  if (taste) pet.tastes[`${pet.form}:${id}`] = taste;
  if (taste === 'dislike' && Math.random() < 0.5) {
    pet.happy = clamp(pet.happy - 5);
    startAnim('no', 1600, {}, false);
    sfx('yuck');
    return say(`Beurk ! ${pet.name} déteste ça 🤢`);
  }

  pet.hunger = clamp(pet.hunger + food.hunger);
  pet.happy = clamp(pet.happy + (food.happy || 0) + (taste === 'like' ? 15 : 0) - (taste === 'dislike' ? 10 : 0));
  pet.health = clamp(pet.health + (food.health || 0));
  pet.weight += food.weight;
  if (pet.weight > 40) pet.health = clamp(pet.health - 3);
  startAnim('eat', 1800, { food: id, like: taste === 'like' });

  if (full && Math.random() < 0.3) {
    pet.sick = true;
    say(`${pet.name} a trop mangé… indigestion 🤢`, 3500);
  } else if (taste === 'like') {
    say(`${food.name}, son plat préféré ! 😍`);
  } else if (taste === 'dislike') {
    say(`${pet.name} mange en grimaçant…`);
  } else {
    say(food.line);
  }
}

/* --- Mini-jeux en temps réel ------------------------------------ */
let minigame = null;
const GROUND = ROWS - 6; // ligne du haut du petit avatar

function startCatch() {
  const now = Date.now();
  const g = {
    type: 'catch', t0: now, end: now + 25e3, x: 12, lives: 3, score: 0,
    items: [], nextSpawn: now + 600, lastFall: now, hold: 0, lastMove: 0, hurtUntil: 0,
  };
  g.update = () => {
    const t = Date.now(), el = t - g.t0;
    if (g.hold && t - g.lastMove > 70) { g.x = clamp(g.x + g.hold, 0, COLS - 7); g.lastMove = t; }
    if (t >= g.nextSpawn && t < g.end - 1200) {
      g.items.push({ x: Math.floor(rand(0, COLS - 3)), y: 1, bomb: Math.random() < 0.18 + el / 150e3 });
      g.nextSpawn = t + Math.max(330, 760 - el / 45);
    }
    const fall = Math.max(60, 140 - el / 300);
    const rows = Math.floor((t - g.lastFall) / fall);
    if (rows > 0) {
      g.lastFall += rows * fall;
      g.items.forEach((it) => (it.y += rows));
    }
    g.items = g.items.filter((it) => {
      const touches = it.y + 2 >= GROUND && it.y <= GROUND + 2 && it.x + 2 >= g.x && it.x <= g.x + 6;
      if (!touches) return it.y < ROWS;
      if (it.bomb) {
        g.lives--;
        g.hurtUntil = t + 600;
        sfx('hit');
        buzz(80);
      } else {
        g.score++;
        sfx('catch');
        say(`🍎 ${g.score}`, 30e3);
      }
      return false;
    });
    if (t >= g.end || g.lives <= 0) finishGame('catch', g.score);
  };
  g.draw = () => {
    const t = Date.now();
    clearLCD(INK, 0.06);
    const left = Math.max(0, Math.round((COLS * (g.end - t)) / 25e3));
    for (let x = 0; x < left; x++) px(x, 0, INK, 0.5);
    drawPips(g.lives, 3, false);
    g.items.forEach((it) => blit(it.bomb ? SPRITES.rock : SPRITES.berry, it.x, it.y, INK));
    if (!(t < g.hurtUntil && Math.floor(t / 100) % 2)) blit(SPRITES.mini, g.x, GROUND, INK);
  };
  minigame = g;
  showMenu('#catchMenu');
  say('Attrape les fruits, évite les cailloux ✖', 3000);
}

function startJump() {
  const now = Date.now();
  const JUMP_MS = 800, JUMP_H = 9;
  const g = {
    type: 'jump', t0: now, score: 0, obstacles: [], nextSpawn: now + 1400,
    lastMove: now, jumpAt: 0, overAt: 0, shift: 0,
  };
  const top = (t) => {
    const k = (t - g.jumpAt) / JUMP_MS;
    return k >= 0 && k < 1 ? GROUND - Math.round(JUMP_H * 4 * k * (1 - k)) : GROUND;
  };
  g.jump = () => {
    const t = Date.now();
    if (g.overAt || t - g.jumpAt < JUMP_MS) return;
    g.jumpAt = t;
    sfx('jump');
  };
  g.update = () => {
    const t = Date.now();
    if (g.overAt) {
      if (t - g.overAt > 900) finishGame('jump', g.score);
      return;
    }
    // Défilement basé sur le temps réel (indépendant de la cadence de la boucle)
    const speed = Math.max(30, 75 - g.score * 2);
    const cells = Math.floor((t - g.lastMove) / speed);
    if (cells > 0) {
      g.lastMove += cells * speed;
      g.shift += cells;
      g.obstacles.forEach((o) => (o.x -= cells));
    }
    if (t >= g.nextSpawn) {
      g.obstacles.push({ x: COLS, w: Math.random() < 0.5 ? 2 : 3, h: Math.random() < 0.6 ? 2 : 3 });
      g.nextSpawn = t + rand(900, 1700) * Math.max(0.55, 1 - g.score * 0.02);
    }
    const y = top(t);
    for (const o of g.obstacles) {
      if (!o.passed && o.x + o.w < 3) {
        o.passed = true;
        g.score++;
        sfx('catch');
        say(`🦘 ${g.score}`, 30e3);
      }
      const overlapX = o.x <= 8 && o.x + o.w - 1 >= 4; // hitbox un peu plus petite que le dessin
      const overlapY = y + 4 >= ROWS - 1 - o.h;
      if (overlapX && overlapY && !g.overAt) {
        g.overAt = t;
        sfx('hit');
        buzz(120);
      }
    }
    g.obstacles = g.obstacles.filter((o) => o.x > -4);
  };
  g.draw = () => {
    const t = Date.now();
    clearLCD(INK, 0.06);
    for (let x = 0; x < COLS; x++) px(x, ROWS - 1, INK, (x + g.shift) % 4 === 0 ? 1 : 0.4);
    for (const o of g.obstacles) {
      for (let i = 0; i < o.w; i++) for (let j = 0; j < o.h; j++) px(o.x + i, ROWS - 2 - j, INK, j === o.h - 1 || i === 0 ? 1 : 0.5);
    }
    if (!(g.overAt && Math.floor(t / 100) % 2)) blit(SPRITES.mini, 3, top(t), INK, { closed: !!g.overAt });
  };
  minigame = g;
  showMenu('#jumpMenu');
  say('Saute par-dessus les rochers !', 2500);
}

function finishGame(type, score) {
  minigame = null;
  showMenu('#actions');
  const best = dex.best[type] || 0;
  const record = score > best;
  if (record) {
    dex.best[type] = score;
    saveDex();
  }
  const fun = clamp(score * (type === 'catch' ? 3 : 4), 5, 35);
  pet.happy = clamp(pet.happy + fun);
  pet.energy = clamp(pet.energy - 10);
  pet.weight = Math.max(1, pet.weight - 1);
  if (type === 'catch') pet.hunger = clamp(pet.hunger + Math.min(15, score)); // il mange ce qu'il attrape
  const good = score >= 5;
  startAnim(good ? 'happy' : 'no', 2000, {}, false);
  sfx(good ? 'win' : 'lose');
  say(`${record ? '🏆 Nouveau record ! ' : ''}Score : ${score}${record || !best ? '' : ` (record : ${best})`}`, 4000);
  save();
  updateUI();
}

function startGame(id) {
  if (id === 'back') return showMenu('#actions');
  if (id === 'catch') return startCatch();
  if (id === 'jump') return startJump();
  showMenu('#gameMenu');
  startAnim('game', 0, { round: 0, score: 0, shown: false });
  say(`Manche 1/5 — devine où ${pet.name} va regarder !`, 4000);
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
  sfx(g.win ? 'happy' : 'miss');
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

/* --- Digidex ---------------------------------------------------- */
function spriteCanvas(sprite, known) {
  const c = document.createElement('canvas');
  const s = 4, n = 16;
  c.width = c.height = n * s;
  const g = c.getContext('2d');
  const ox = Math.floor((n - sprite[0].length) / 2), oy = Math.floor((n - sprite.length) / 2);
  for (const [x, y, k] of analyze(sprite).cells) {
    const a = known ? (TONES[k] ?? (k === 's' ? TONES.f : 1)) : 0.18;
    g.fillStyle = `rgba(${INK},${a})`;
    g.fillRect((ox + x) * s, (oy + y) * s, s - 1, s - 1);
  }
  return c;
}

function dexCard(id, known, sub) {
  const m = MONSTERS[id];
  const card = document.createElement('div');
  card.className = `card${known ? '' : ' unknown'}`;
  card.append(spriteCanvas(SPRITES[m.sprite], known));
  const name = document.createElement('strong');
  name.textContent = known ? m.name : '???';
  const small = document.createElement('small');
  small.textContent = sub;
  card.append(name, small);
  return card;
}

function openDex() {
  $('#dexForms').replaceChildren(...FORM_IDS.map((id) =>
    dexCard(id, !!dex.forms[id], dex.forms[id] ? MONSTERS[id].stage : MONSTERS[id].hint)));
  $('#dexFoes').replaceChildren(...ENEMY_IDS.map((id) =>
    dexCard(id, !!dex.foes[id], dex.foes[id] ? `Vaincu ×${dex.foes[id]}` : 'Jamais vaincu')));
  $('#dexCount').textContent = `${FORM_IDS.filter((id) => dex.forms[id]).length}/${FORM_IDS.length}`;
  $('#dexDialog').showModal();
}

/* --- Réglages : coque, son, notifications ----------------------- */
function applyShell() {
  document.documentElement.dataset.shell = prefs.shell;
  document.querySelectorAll('[data-shell-pick]').forEach((b) =>
    b.classList.toggle('picked', b.dataset.shellPick === prefs.shell));
}

function notifSupport() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'none';
  return Notification.permission;
}

function updateNotifUI() {
  const btn = $('#notifBtn'), note = $('#notifNote');
  const state = notifSupport();
  btn.disabled = state === 'none' || state === 'denied' || (prefs.notify && state === 'granted');
  btn.textContent = prefs.notify && state === 'granted' ? '🔔 Notifications activées' : '🔔 Activer les notifications';
  note.textContent =
    state === 'none' ? "Ce navigateur ne gère pas les notifications. Sur iPhone, ajoute d'abord l'appli à l'écran d'accueil." :
    state === 'denied' ? 'Notifications bloquées : autorise-les dans les réglages du navigateur.' :
    'Prévient quand ton monstre a besoin de toi. Fonctionne surtout sur Android avec l’appli installée.';
}

async function enableNotifications() {
  if (notifSupport() === 'none') return updateNotifUI();
  const perm = await Notification.requestPermission();
  prefs.notify = perm === 'granted';
  savePrefs();
  updateNotifUI();
  if (!prefs.notify) return;
  const reg = await navigator.serviceWorker.ready;
  try {
    // Vérification périodique en arrière-plan (Chrome Android, appli installée)
    if ('periodicSync' in reg) await reg.periodicSync.register('tamagochi-check', { minInterval: HOUR });
  } catch { /* non autorisé par le navigateur */ }
  save(true);
  reg.showNotification('Tamagochi', { body: 'Notifications activées 🔔', icon: 'icons/icon-192.png', tag: 'tamagochi' });
}

let lastNotify = 0;
async function notifyIfNeeded() {
  // Appli en arrière-plan mais encore active : on prévient directement
  if (!prefs.notify || !document.hidden || !pet?.alive || Notification.permission !== 'granted') return;
  if (!needsCare(pet) || Date.now() - lastNotify < 2 * HOUR) return;
  lastNotify = Date.now();
  const reg = await navigator.serviceWorker.ready;
  reg.showNotification(`${pet.name} a besoin de toi !`, { body: 'Viens voir ce qui se passe 👀', icon: 'icons/icon-192.png', tag: 'tamagochi' });
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
  battle = null;
  showMenu('#actions');
  save(true);
  say(`L'œuf va bientôt éclore…`, 4000);
});

$('#nameDialog').addEventListener('cancel', (e) => e.preventDefault());
$('#deathDialog').addEventListener('cancel', (e) => e.preventDefault());
$('#deathDialog').addEventListener('close', askName);

let deathShown = false;
let wasNight = null;
let neededCare = false;

function tick() {
  if (!pet) return;
  simulate(pet, Date.now());
  evolve();

  if (wasNight !== null && pet.alive && pet.night !== wasNight) {
    if (pet.night) {
      say(`🌙 ${pet.name} s'endort… éteins la lumière !`, 5000);
      sfx('night');
    } else {
      say(`☀️ Bonjour ! ${pet.name} se réveille.`, 4000);
      sfx('morning');
    }
  }
  wasNight = pet.night;

  const care = pet.alive && needsCare(pet);
  if (care && !neededCare && !document.hidden && !battle) sfx('alert');
  neededCare = care;
  notifyIfNeeded();

  if (!pet.alive && !deathShown) {
    deathShown = true;
    anim = null;
    battle = null;
    minigame = null;
    showMenu('#actions');
    sfx('lose');
    $('#deathText').textContent = `${pet.name} est parti·e ${pet.cause}, à l'âge de ${formatAge(pet.diedAt - pet.born)}.`;
    setTimeout(() => $('#deathDialog').showModal(), 1500);
  }
  if (pet.alive) deathShown = false;
  updateUI();
}

/* --- Événements ------------------------------------------------- */
document.querySelectorAll('[data-act]').forEach((b) =>
  b.addEventListener('click', () => { buzz(); sfx('tap'); actions[b.dataset.act](); save(); updateUI(); }));
document.querySelectorAll('[data-game]').forEach((b) =>
  b.addEventListener('click', () => { buzz(); sfx('tap'); startGame(b.dataset.game); updateUI(); }));
document.querySelectorAll('[data-guess]').forEach((b) =>
  b.addEventListener('click', () => guess(b.dataset.guess)));

// Attrape-fruits : maintenir ◀ ▶ (ou toucher une moitié de l'écran) pour bouger
function holdMove(dir) {
  if (minigame?.type !== 'catch') return;
  minigame.hold = dir;
  if (dir) {
    minigame.x = clamp(minigame.x + dir, 0, COLS - 7);
    minigame.lastMove = Date.now();
  }
}
for (const [id, dir] of [['#catchLeft', -1], ['#catchRight', 1]]) {
  const b = $(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); holdMove(dir); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => holdMove(0)));
}
$('#jumpBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); minigame?.jump?.(); });
canvas.addEventListener('pointerdown', (e) => {
  if (minigame?.type === 'jump') minigame.jump();
  if (minigame?.type === 'catch') {
    const r = canvas.getBoundingClientRect();
    holdMove(e.clientX - r.left < r.width / 2 ? -1 : 1);
  }
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => canvas.addEventListener(ev, () => holdMove(0)));
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.key === 'ArrowLeft') holdMove(-1);
  if (e.key === 'ArrowRight') holdMove(1);
  if (e.key === ' ' || e.key === 'ArrowUp') { minigame?.jump?.(); if (battle) fire(); }
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') holdMove(0);
});
$('#fireBtn').addEventListener('click', fire);
$('#fleeBtn').addEventListener('click', () => battle && endBattle('flee'));
$('#dexBtn').addEventListener('click', openDex);

$('#settingsBtn').addEventListener('click', () => {
  $('#soundToggle').checked = prefs.sound;
  updateNotifUI();
  $('#settingsDialog').showModal();
});
document.querySelectorAll('[data-shell-pick]').forEach((b) =>
  b.addEventListener('click', () => { prefs.shell = b.dataset.shellPick; savePrefs(); applyShell(); sfx('tap'); }));
$('#soundToggle').addEventListener('change', (e) => {
  prefs.sound = e.target.checked;
  savePrefs();
  sfx('happy');
});
$('#notifBtn').addEventListener('click', enableNotifications);

$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Abandonner ton Tamagochi et recommencer avec un nouvel œuf ? (Le Digidex est conservé.)')) return;
  localStorage.removeItem(SAVE_KEY);
  pet = null;
  battle = null;
  wasNight = null;
  $('#settingsDialog').close();
  askName();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(true); else tick();
});
window.addEventListener('pagehide', () => save(true));
window.addEventListener('resize', resize);

/* --- Démarrage -------------------------------------------------- */
applyShell();
resize();
pet = load();
if (pet) {
  const away = Date.now() - pet.last;
  tick();
  if (pet.alive && away > 10 * MIN) say(`Te revoilà ! Absent·e ${formatAge(away)}.`, 3500);
} else {
  askName();
}

// Rendu fluide pendant les combats, rythme LCD classique sinon
let lastDraw = 0;
setInterval(() => {
  const now = Date.now();
  if (battle) {
    updateBattle(now);
    if (battle) return drawBattle(now);
  }
  if (minigame) {
    $('#screen').classList.remove('dark');
    minigame.update();
    if (minigame) return minigame.draw();
  }
  if (now - lastDraw >= 400) {
    lastDraw = now;
    draw();
  }
}, 50);
setInterval(tick, 1000);
setInterval(save, 5000);
draw();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
