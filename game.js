'use strict';

/* ============================================================
   Tamagochi — animal virtuel en pixel art, façon Digimon
   Le temps s'écoule en temps réel, même application fermée.
   ============================================================ */

const SAVE_KEY = 'tamagochi-save-v1';
const DEX_KEY = 'tamagochi-dex-v1';
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
  grumo: [
    '#............#',
    '##..........##',
    '.##.######.##.',
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
    '#.#..........#.#',
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
    '#.##........##.#',
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
    '#..##......##..#',
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
    '..#.#......#.#..',
    '.#...#....#...#.',
    '#.....####.....#',
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
  shot: ['.#.', '###', '.#.'],
};

/* --- Monstres : formes du joueur et adversaires ------------------ */
const MONSTERS = {
  bulle: { name: 'Bulle', sprite: 'baby', stage: 'Bébé', atk: 0, hint: "Éclot de l'œuf" },
  kitsu: { name: 'Kitsu', sprite: 'child', stage: 'Enfant', atk: 1, hint: 'Enfant bien soigné (2 erreurs max)' },
  grumo: { name: 'Grumo', sprite: 'grumo', stage: 'Enfant', atk: 1, hint: 'Enfant négligé (3 erreurs ou +)' },
  lumen: { name: 'Lumen', sprite: 'adult', stage: 'Adulte', atk: 2, hint: 'Adulte équilibré' },
  drakor: { name: 'Drakor', sprite: 'drakor', stage: 'Adulte', atk: 3, hint: '5 victoires ou + en devenant adulte' },
  bouboule: { name: 'Bouboule', sprite: 'bouboule', stage: 'Adulte', atk: 2, hint: 'Peser 25 g ou + en devenant adulte' },
  spectra: { name: 'Spectra', sprite: 'spectra', stage: 'Adulte', atk: 3, hint: '6 erreurs de soin ou +' },
  gluon: { name: 'Gluon', sprite: 'gluon' },
  chauvo: { name: 'Chauvo', sprite: 'chauvo' },
  rocaille: { name: 'Rocaille', sprite: 'rocaille' },
};
const FORM_IDS = ['bulle', 'kitsu', 'grumo', 'lumen', 'drakor', 'bouboule', 'spectra'];
const ENEMY_IDS = ['gluon', 'chauvo', 'grumo', 'rocaille', 'bouboule', 'spectra', 'drakor', 'lumen'];

const STAGES = [
  { id: 'egg', label: 'Œuf', until: 1 * MIN },
  { id: 'baby', label: 'Bébé', until: 24 * HOUR },
  { id: 'child', label: 'Enfant', until: 72 * HOUR },
  { id: 'adult', label: 'Adulte', until: Infinity },
];

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
    nextPoop: now + rand(2, 4) * HOUR,
    mistakes: 0,
    wins: 0,
    losses: 0,
    form: null,
    formStage: 'egg',
    diedAt: null,
    cause: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    // Les anciennes sauvegardes n'ont pas les champs « Digimon »
    return raw ? { mistakes: 0, wins: 0, losses: 0, form: null, formStage: null, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function save() {
  if (!pet) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(pet)); } catch { /* stockage indisponible */ }
}

function loadDex() {
  try {
    return { forms: {}, foes: {}, ...JSON.parse(localStorage.getItem(DEX_KEY) || '{}') };
  } catch {
    return { forms: {}, foes: {} };
  }
}

function saveDex() {
  try { localStorage.setItem(DEX_KEY, JSON.stringify(dex)); } catch { /* stockage indisponible */ }
}

/* --- Simulation (rattrape aussi le temps passé hors-ligne) ------ */
function step(s, t, dt) {
  if (!s.alive || stageOf(s, t).id === 'egg') return;
  const h = dt / HOUR;
  const slow = s.asleep ? 0.35 : 1;
  const before = { hunger: s.hunger, clean: s.clean, sick: s.sick };

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
const INK = '#1d2b1a';
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

function clearLCD(ghostInk) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) px(x, y, ghostInk);
}

function draw() {
  frame++;
  const now = Date.now();
  const dark = pet?.asleep && pet.alive;
  const ink = dark ? '#9fb08a' : INK;
  $('#screen').classList.toggle('dark', !!dark);
  clearLCD(dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)');
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
  const evolving = anim?.type === 'evolve' && frame % 2;
  if (!evolving) blit(sprite, x, y, ink, { closed: pet.asleep, sad, flip });

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
  };
  anim = null;
  showMenu('#battleMenu');
  say(`${battle.foe.name} (niv. ${lvl}) te défie ! ⚔️`, 2500);
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
  buzz(b.dmg ? 50 : 15);
  setPhase('fire');
}

function setPhase(phase) {
  battle.phase = phase;
  battle.t0 = Date.now();
}

function updateBattle(now) {
  const b = battle;
  if (!pet.alive) return endBattle('flee');
  const el = now - b.t0;
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
        buzz(200);
      } else {
        b.hitMe = Math.random() < b.foeHit;
        setPhase('counter');
      }
      break;
    case 'counter':
      setPhase('defend');
      break;
    case 'defend':
      if (b.hitMe) b.me--;
      say(b.hitMe ? 'Aïe !' : 'Esquivé !', 1200);
      if (b.hitMe) buzz(60);
      if (b.me <= 0) setPhase('lose');
      else setPhase('aim');
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
    startAnim('happy', 2000);
    say(`Victoire contre ${foe.name} ! (${pet.wins} au total)`, 3000);
  } else if (result === 'lose') {
    pet.losses++;
    pet.health = clamp(pet.health - 20);
    pet.happy = clamp(pet.happy - 10);
    startAnim('no');
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
    if (i < n) { px(x, 1, INK); px(x + 1, 1, INK); px(x, 2, INK); px(x + 1, 2, INK); }
    else px(x, 2, INK);
  }
}

function drawGauge(b, now) {
  const top = 4, H = 16, v = gaugeValue(b, now);
  const level = Math.round(v * H);
  for (let i = 0; i < H; i++) {
    px(27, top + i, INK);
    px(30, top + i, INK);
    if (H - i <= level) { px(28, top + i, INK); px(29, top + i, INK); }
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
  clearLCD('rgba(0,0,0,.06)');

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
  $('#record').textContent = `⚔️ ${pet.wins} V · ${pet.losses} D   ·   ⚠️ ${pet.mistakes} erreur${pet.mistakes > 1 ? 's' : ''} de soin`;

  document.querySelectorAll('.stat').forEach((el) => {
    const v = pet[el.dataset.key];
    const bar = el.querySelector('b');
    bar.style.width = `${v}%`;
    bar.style.background = v > 50 ? 'var(--good)' : v > 25 ? 'var(--mid)' : 'var(--bad)';
  });

  const isEgg = stage.id === 'egg';
  const busy = anim?.type === 'game' || !!battle;
  document.querySelectorAll('#actions button').forEach((b) => {
    b.disabled = !pet.alive || isEgg || busy || (pet.asleep && b.dataset.act !== 'light');
  });
  $('#lightIcon').textContent = pet.asleep ? '☀️' : '💡';
  $('#lightLabel').textContent = pet.asleep ? 'Réveiller' : 'Dormir';

  const title = (pet.alive && (pet.hunger < 25 || pet.sick || pet.poops > 1)) ? '(!) Tamagochi' : 'Tamagochi';
  if (document.title !== title) document.title = title;
}

function showMenu(id) {
  ['#actions', '#feedMenu', '#gameMenu', '#battleMenu'].forEach((m) => $(m).classList.toggle('hidden', m !== id));
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

/* --- Digidex ---------------------------------------------------- */
function spriteCanvas(sprite, color) {
  const c = document.createElement('canvas');
  const s = 4, n = 16;
  c.width = c.height = n * s;
  const g = c.getContext('2d');
  g.fillStyle = color;
  const ox = Math.floor((n - sprite[0].length) / 2), oy = Math.floor((n - sprite.length) / 2);
  sprite.forEach((row, j) => [...row].forEach((ch, i) => {
    if ('#Eem'.includes(ch)) g.fillRect((ox + i) * s, (oy + j) * s, s - 1, s - 1);
  }));
  return c;
}

function dexCard(id, known, sub) {
  const m = MONSTERS[id];
  const card = document.createElement('div');
  card.className = `card${known ? '' : ' unknown'}`;
  card.append(spriteCanvas(SPRITES[m.sprite], known ? INK : 'rgba(29,43,26,.18)'));
  const name = document.createElement('strong');
  name.textContent = known ? m.name : '???';
  const small = document.createElement('small');
  small.textContent = sub;
  card.append(name, small);
  return card;
}

function openDex() {
  const forms = $('#dexForms'), foes = $('#dexFoes');
  forms.replaceChildren(...FORM_IDS.map((id) =>
    dexCard(id, !!dex.forms[id], dex.forms[id] ? MONSTERS[id].stage : MONSTERS[id].hint)));
  foes.replaceChildren(...[...new Set(ENEMY_IDS)].map((id) =>
    dexCard(id, !!dex.foes[id], dex.foes[id] ? `Vaincu ×${dex.foes[id]}` : 'Jamais vaincu')));
  $('#dexCount').textContent = `${FORM_IDS.filter((id) => dex.forms[id]).length}/${FORM_IDS.length}`;
  $('#dexDialog').showModal();
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
  save();
  say(`L'œuf va bientôt éclore…`, 4000);
});

$('#nameDialog').addEventListener('cancel', (e) => e.preventDefault());
$('#deathDialog').addEventListener('cancel', (e) => e.preventDefault());
$('#deathDialog').addEventListener('close', askName);

let deathShown = false;

function tick() {
  if (!pet) return;
  simulate(pet, Date.now());
  evolve();

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
$('#fireBtn').addEventListener('click', fire);
$('#fleeBtn').addEventListener('click', () => battle && endBattle('flee'));
$('#dexBtn').addEventListener('click', openDex);

$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Abandonner ton Tamagochi et recommencer avec un nouvel œuf ? (Le Digidex est conservé.)')) return;
  localStorage.removeItem(SAVE_KEY);
  pet = null;
  battle = null;
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
