const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width,
  H = canvas.height;

// ---- Mensaje del Día del Padre (edítalo a tu gusto) ----------------------
const FATHERS_DAY = {
  titulo: "¡Feliz Día del Padre!",
  lineas: [
    "Podrán pasar los años y cambiar los escenarios,",
    "pero hay algo que el tiempo jamás podrá borrar:",
    "",
    "El valor de tus consejos, la fuerza de tu apoyo",
    "y el gran orgullo que siento al decir",
    "que sigo los pasos del mejor hombre del mundo.",
    "",
    "Te quiero con todo el corazón, papá. ❤",
  ],
  firma: "— De parte de quien siempre te admira",
};
// --------------------------------------------------------------------------

const GROUND = 372; // altura del suelo
const GRAVITY = 0.62;
const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  attack: false,
};
let state = "title"; // title | play | victory
let shake = 0;
let t = 0; // tiempo global

// ---------- Entrada (teclado WASD + Shift  y  táctil) ---------------------
const KEYMAP = {
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  ShiftLeft: "attack",
  ShiftRight: "attack",
  Space: "attack",
};
addEventListener("keydown", (e) => {
  const act = KEYMAP[e.code];
  if (act || e.code === "Enter" || e.code === "KeyR") e.preventDefault();
  if (act) {
    if (!input[act]) onPress(act);
    input[act] = true;
  } else if (e.code === "Enter" || e.code === "KeyR") onPress("start");
});
addEventListener("keyup", (e) => {
  const act = KEYMAP[e.code];
  if (act) input[act] = false;
});

// La acción de borde (una vez por pulsación)
function onPress(act) {
  if (state === "title") {
    startGame();
    return;
  }
  if (state === "victory") {
    startGame();
    return;
  }
  if (state === "play") {
    if (act === "attack") player.tryAttack();
    if (act === "up") player.jump();
  }
}

// Tocar / clic sobre el escenario también inicia o reinicia
function tapStage() {
  if (state === "title" || state === "victory") startGame();
  canvas.focus();
}
canvas.addEventListener("click", tapStage);
// Ajusta el buffer del canvas al tamaño CSS real × devicePixelRatio
// para que el dibujo sea nítido a cualquier escala, incluyendo pantallas Retina.
function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  if (!r.width) return; // todavía sin layout
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", () => {
  resizeCanvas();
  canvas.focus();
});

// Botones táctiles en pantalla
function wireTouch() {
  document.querySelectorAll("#touch [data-act]").forEach((btn) => {
    const act = btn.dataset.act;
    const down = (e) => {
      e.preventDefault();
      if (!input[act]) onPress(act);
      input[act] = true;
      btn.classList.add("on");
    };
    const up = (e) => {
      e.preventDefault();
      input[act] = false;
      btn.classList.remove("on");
    };
    btn.addEventListener("touchstart", down, { passive: false });
    btn.addEventListener("touchend", up);
    btn.addEventListener("touchcancel", up);
    btn.addEventListener("mousedown", down);
    btn.addEventListener("mouseup", up);
    btn.addEventListener("mouseleave", up);
  });
}
wireTouch();

// ---------- Personajes ----------------------------------------------------
function makeFighter(x, isHero) {
  return {
    x,
    y: GROUND,
    vx: 0,
    vy: 0,
    w: 34,
    h: 78,
    face: isHero ? 1 : -1,
    onGround: true,
    legPhase: 0,
    moving: false,
    crouch: false,
    swordOut: false,
    hp: isHero ? 4 : 4,
    maxhp: 4,
    state: "idle", // idle | run | jump | attack | block | hurt | dead
    attackT: 0,
    hurtT: 0,
    invuln: 0,
    isHero,
    aiT: 1.4,
    aiState: "wait",
    tryAttack() {
      if (this.state === "attack" || this.state === "hurt" || this.attackT > 0)
        return;
      this.state = "attack";
      this.attackT = 0.34;
      this.swordOut = true;
    },
    jump() {
      if (this.onGround) {
        this.vy = -11.4;
        this.onGround = false;
        this.state = "jump";
      }
    },
  };
}
let player, guard;

// pozo (gap) en el suelo
const PIT = { x: 430, w: 96 };
// posición de combate
const ARENA_X = 760;

function startGame() {
  player = makeFighter(70, true);
  guard = makeFighter(ARENA_X + 120, false);
  guard.face = -1;
  state = "play";
  shake = 0;
  canvas.focus();
}

function near(a, b) {
  return Math.abs(a.x - b.x) < 230;
}

// ---------- Bucle ---------------------------------------------------------
let last = 0;
function loop(ts) {
  const dt = Math.min((ts - last) / 16.67, 2) || 1;
  last = ts;
  t += dt * 0.016;
  if (state === "play") update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- Lógica --------------------------------------------------------
function update(dt) {
  // ---- jugador ----
  const speed = 3.4;
  player.crouch = input.down && player.onGround && player.state !== "attack";
  player.moving = false;

  if (player.state !== "attack" && player.state !== "hurt" && !player.crouch) {
    if (input.left) {
      player.vx = -speed;
      player.face = -1;
      player.moving = true;
    } else if (input.right) {
      player.vx = speed;
      player.face = 1;
      player.moving = true;
    } else player.vx *= 0.6;
  } else player.vx *= 0.6;

  stepPhysics(player, dt);

  // espada fuera al acercarse al guardia
  player.swordOut = player.swordOut || near(player, guard);

  // timers jugador
  if (player.attackT > 0) {
    player.attackT -= dt * 0.016;
    if (player.attackT <= 0 && player.state === "attack") {
      player.state = "idle";
    }
  }
  if (player.hurtT > 0) {
    player.hurtT -= dt * 0.016;
    if (player.hurtT <= 0 && player.state === "hurt") player.state = "idle";
  }
  if (player.invuln > 0) player.invuln -= dt * 0.016;

  // (la resolución de golpes se hace de forma unificada en resolveCombat)

  // ---- guardia (IA) ----
  if (guard.hp > 0) {
    updateGuardAI(dt);
    if (guard.hurtT > 0) {
      guard.hurtT -= dt * 0.016;
      if (guard.hurtT <= 0) guard.state = "idle";
    }
    if (guard.invuln > 0) guard.invuln -= dt * 0.016;
    if (guard.attackT > 0) {
      guard.attackT -= dt * 0.016;
      if (guard.attackT <= 0 && guard.state === "attack") guard.state = "idle";
    }
    stepPhysics(guard, dt);
  } else {
    guard.vx *= 0.7;
    stepPhysics(guard, dt);
  }

  resolveCombat();

  if (shake > 0) shake *= 0.85;
  updateParticles(dt);
}

function updateGuardAI(dt) {
  if (guard.state === "hurt" || guard.state === "dead") return;
  const dist = player.x - guard.x;
  guard.face = dist > 0 ? 1 : -1;
  guard.aiT -= dt * 0.016;
  const absd = Math.abs(dist);

  if (absd > 90) {
    // acercarse al jugador
    guard.vx = guard.face * 2.0;
    guard.moving = true;
    guard.state = guard.state === "attack" ? guard.state : "run";
  } else {
    guard.vx *= 0.6;
    guard.moving = false;
    if (guard.aiT <= 0 && guard.state !== "attack") {
      guard.tryAttack();
      guard.aiT = 1.1 + Math.random() * 0.8; // ritmo de ataque (indulgente)
    } else if (guard.state !== "attack") {
      guard.state = "idle";
    }
  }
}

function facing(a, b) {
  return (b.x - a.x) * a.face > -10;
}

// ¿está en los fotogramas activos del golpe?
function striking(f) {
  return f.state === "attack" && f.attackT > 0.1 && f.attackT < 0.26;
}

// Resolución unificada de golpes (choque de espadas = parry sin daño)
function resolveCombat() {
  if (guard.hp <= 0) return;
  const inRange = Math.abs(player.x - guard.x) < 76;
  if (!inRange) return;
  const pS = striking(player),
    gS = striking(guard);
  const mid = (player.x + guard.x) / 2;

  // choque: ambos atacan a la vez -> chispas, retroceso, sin daño
  if (pS && gS && player.invuln <= 0 && guard.invuln <= 0) {
    spark(mid, GROUND - 48);
    shake = 7;
    player.vx = -player.face * 3;
    guard.vx = -guard.face * 3;
    player.invuln = 0.35;
    guard.invuln = 0.35;
    return;
  }
  // el jugador golpea al guardia
  if (pS && guard.invuln <= 0 && facing(player, guard)) {
    guard.hp--;
    guard.invuln = 0.55;
    guard.state = "hurt";
    guard.hurtT = 0.4;
    guard.vx = player.face * 3.5;
    spark(mid, GROUND - 46);
    shake = 8;
    if (guard.hp <= 0) {
      guard.state = "dead";
      setTimeout(() => {
        state = "victory";
      }, 900);
    }
    return;
  }
  // el guardia golpea al jugador
  if (gS && player.invuln <= 0 && facing(guard, player)) {
    player.hp--;
    player.invuln = 1.0;
    player.state = "hurt";
    player.hurtT = 0.4;
    player.vx = -guard.face * 4;
    spark(player.x, GROUND - 46);
    shake = 10;
    if (player.hp <= 0) {
      player.hp = 0;
      setTimeout(() => startGame(), 1100);
    }
  }
}

function stepPhysics(f, dt) {
  f.x += f.vx * dt;
  f.vy += GRAVITY * dt;
  f.y += f.vy * dt;

  // suelo, considerando el pozo (solo aplica al jugador y guardia en su zona)
  const overPit = f.x > PIT.x && f.x < PIT.x + PIT.w;
  if (f.y >= GROUND && !overPit) {
    f.y = GROUND;
    f.vy = 0;
    if (!f.onGround && f.state === "jump") f.state = "idle";
    f.onGround = true;
  } else if (f.y >= GROUND && overPit) {
    if (f.isHero) {
      // el héroe cae al pozo -> rescate amable: vuelve justo antes
      f.x = PIT.x - 40;
      f.y = GROUND;
      f.vy = 0;
      f.vx = 0;
      f.onGround = true;
      f.state = "idle";
    } else {
      // el guardia no cae (pisa firme aunque esté sobre el pozo)
      f.y = GROUND;
      f.vy = 0;
      f.onGround = true;
    }
  } else f.onGround = false;

  // límites
  f.x = Math.max(28, Math.min(W - 28, f.x));

  // fase de piernas
  if (f.moving && f.onGround) {
    f.legPhase += 0.28 * dt * Math.sign(f.vx || 1);
  } else f.legPhase *= 0.85;
  if (f.moving && f.onGround && f.state !== "attack" && f.state !== "hurt")
    f.state = "run";
  else if (f.onGround && f.state === "run") f.state = "idle";
}

// ---------- Partículas (chispas) -----------------------------------------
const parts = [];
function spark(x, y) {
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 2 + Math.random() * 4;
    parts.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1,
      life: 1,
      col: Math.random() < 0.5 ? "#ffe9a8" : "#ffb347",
    });
  }
}
function updateParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.25 * dt;
    p.life -= 0.04 * dt;
    if (p.life <= 0) parts.splice(i, 1);
  }
}

// =========================================================================
//  RENDER
// =========================================================================
function render() {
  ctx.save();
  // Escala coordenadas del juego (960×470) al buffer real del canvas.
  // Garantiza nitidez a cualquier tamaño de pantalla y en Retina/HiDPI.
  ctx.scale(canvas.width / W, canvas.height / H);
  if (shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  ctx.clearRect(-20, -20, W + 40, H + 40);
  drawBackground();
  if (state === "title") {
    drawTitle();
    ctx.restore();
    return;
  }
  if (state === "victory") {
    drawBackground();
    drawScene();
    drawVictory();
    ctx.restore();
    return;
  }
  drawScene();
  drawHUD();
  ctx.restore();
}

// ---- Paleta y dibujo de piedra (estilo clásico, gris-azulado) ------------
const ST = {
  hi: "#aeb9c4",
  mid: "#7e8d9c",
  lo: "#586673",
  edge: "#3f4b57",
  mortar: "#1c222a",
  alc: "#070a0f",
};

function brick(x, y, w, h) {
  ctx.fillStyle = ST.mid;
  ctx.fillRect(x, y, w, h);
  // relieve biselado: luz arriba-izquierda, sombra abajo-derecha
  ctx.fillStyle = ST.hi;
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y, 3, h);
  ctx.fillStyle = ST.lo;
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x + w - 3, y, 3, h);
  ctx.fillStyle = ST.edge;
  ctx.fillRect(x + w - 3, y + h - 3, 3, 3);
}
function brickWall(x0, y0, x1, y1) {
  ctx.fillStyle = ST.mortar;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const bw = 94,
    bh = 46,
    g = 3;
  for (let yy = y0, r = 0; yy < y1; yy += bh, r++) {
    const off = (r % 2) * (bw / 2);
    for (let xx = x0 - bw; xx < x1 + bw; xx += bw) {
      const bx = xx + off + g;
      brick(bx, yy + g, bw - g * 2, bh - g * 2);
      // pequeños puntitos decorativos como en el original
      if ((r * 5 + Math.floor(xx / bw)) % 4 === 0) {
        ctx.fillStyle = "rgba(26,32,40,.55)";
        ctx.fillRect(bx + 12, yy + 12, 3, 3);
        ctx.fillRect(bx + 12, yy + 17, 3, 3);
        ctx.fillRect(bx + 17, yy + 17, 3, 3);
      }
    }
  }
}

function drawBackground() {
  // muro de piedra completo
  brickWall(0, 0, W, GROUND);

  // nichos oscuros con antorchas (recesos negros)
  const torchX = [180, W / 2 - 10, W - 300];
  torchX.forEach((tx) => {
    const aw = 116,
      ay = 150,
      ah = GROUND - 34 - ay;
    // sombra/marco exterior del nicho
    ctx.fillStyle = "#0e1218";
    ctx.fillRect(tx - aw / 2 - 4, ay - 4, aw + 8, ah + 8);
    ctx.fillStyle = ST.alc;
    ctx.fillRect(tx - aw / 2, ay, aw, ah);
    // degradado interior (profundidad)
    const ig = ctx.createLinearGradient(0, ay, 0, ay + ah);
    ig.addColorStop(0, "rgba(40,52,66,.35)");
    ig.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ig;
    ctx.fillRect(tx - aw / 2, ay, aw, ah);
  });

  // arco de salida a la derecha
  ctx.save();
  const ax = W - 118,
    ay = GROUND,
    aw = 92,
    ah = 196;
  ctx.fillStyle = "#070a0f";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax, ay - ah + 46);
  ctx.quadraticCurveTo(ax + aw / 2, ay - ah - 24, ax + aw, ay - ah + 46);
  ctx.lineTo(ax + aw, ay);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ST.edge;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = "rgba(90,110,130,.4)";
  ctx.lineWidth = 4;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(ax + (i * aw) / 5, ay);
    ctx.lineTo(ax + (i * aw) / 5, ay - ah + 12);
    ctx.stroke();
  }
  ctx.restore();

  // antorchas (delante de los nichos)
  torchX.forEach((tx) => drawTorch(tx, 236));

  // suelo de losas gris-azuladas
  const fg = ctx.createLinearGradient(0, GROUND, 0, H);
  fg.addColorStop(0, ST.mid);
  fg.addColorStop(0.18, ST.lo);
  fg.addColorStop(1, "#10151b");
  ctx.fillStyle = fg;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  // borde superior iluminado del suelo
  ctx.fillStyle = ST.hi;
  ctx.fillRect(0, GROUND, W, 3);
  ctx.fillStyle = ST.mortar;
  ctx.fillRect(0, GROUND + 22, W, 3);
  // juntas de las losas
  ctx.strokeStyle = ST.mortar;
  ctx.lineWidth = 3;
  for (let cx = 0; cx < W; cx += 118) {
    ctx.beginPath();
    ctx.moveTo(cx, GROUND);
    ctx.lineTo(cx - 22, H);
    ctx.stroke();
  }

  // el pozo con pinchos
  ctx.fillStyle = "#04060a";
  ctx.fillRect(PIT.x, GROUND, PIT.w, H - GROUND);
  ctx.fillStyle = ST.mortar;
  ctx.fillRect(PIT.x - 3, GROUND, 3, H - GROUND);
  ctx.fillRect(PIT.x + PIT.w, GROUND, 3, H - GROUND);
  ctx.fillStyle = "rgba(170,185,200,.4)";
  for (let sx = PIT.x + 8; sx < PIT.x + PIT.w - 6; sx += 14) {
    ctx.beginPath();
    ctx.moveTo(sx, GROUND + 32);
    ctx.lineTo(sx + 6, GROUND + 6);
    ctx.lineTo(sx + 12, GROUND + 32);
    ctx.fill();
  }

  // viñeta
  const v = ctx.createRadialGradient(
    W / 2,
    H * 0.46,
    200,
    W / 2,
    H * 0.46,
    W * 0.72,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function drawTorch(x, y) {
  const fl = 1 + Math.sin(t * 9 + x) * 0.16;
  // resplandor
  const gl = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, 96 * fl);
  gl.addColorStop(0, "rgba(255,170,70,.5)");
  gl.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.arc(x, y - 10, 96 * fl, 0, 7);
  ctx.fill();
  // soporte metálico
  ctx.fillStyle = "#9aa3ad";
  ctx.fillRect(x - 3, y + 4, 6, 30);
  ctx.fillStyle = "#cfd6dd";
  ctx.fillRect(x - 3, y + 4, 2, 30);
  ctx.fillStyle = "#6b7480";
  ctx.fillRect(x - 7, y + 2, 14, 5);
  // llama de dos tonos
  ctx.fillStyle = "#ff7a1a";
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 9, 20 * fl, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#ffb13a";
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 6, 14 * fl, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#ffe98a";
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 3, 8 * fl, 0, 0, 7);
  ctx.fill();
}

function drawScene() {
  // sombras
  drawShadow(player);
  if (guard.hp > 0 || guard.state === "dead") drawShadow(guard);
  drawFighter(guard);
  drawFighter(player);
  // chispas
  parts.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.col;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1;
}

function drawShadow(f) {
  if (!f.onGround) return;
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(f.x, GROUND + 6, 24, 6, 0, 0, 7);
  ctx.fill();
}

// ---- Dibujo del personaje (vectorial con volumen y contorno) -------------
function drawFighter(f) {
  const hero = {
    skin: "#e7b98c",
    skinSh: "#c8966a",
    hair: "#ecc24c",
    hairSh: "#b78f2e",
    tunic: "#f1ece1",
    tunicSh: "#d3ccb9",
    pants: "#e8e2d3",
    pantsSh: "#c4bda9",
    sash: "#9c3b3b",
    gold: "#d8af46",
    steel: "#dbe1e8",
    steelSh: "#9aa2ac",
    out: "#2a2418",
  };
  const grd = {
    skin: "#d3a878",
    skinSh: "#a9794f",
    hair: "#9aa1ab",
    hairSh: "#6c727b",
    tunic: "#73282f",
    tunicSh: "#4c181f",
    pants: "#3c3338",
    pantsSh: "#241e22",
    sash: "#1d1d22",
    gold: "#b9943a",
    steel: "#cdd3da",
    steelSh: "#868d96",
    out: "#160e11",
  };
  const c = f.isHero ? hero : grd;

  // helpers de trazo con contorno
  const seg = (pts, w, col) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = c.out;
    ctx.lineWidth = w + 3.5;
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
  };
  const poly = (pts, col) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.lineJoin = "round";
    ctx.strokeStyle = c.out;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fill();
  };
  const dot = (x, y, r, col) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.strokeStyle = c.out;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fill();
  };
  const foot = (fx, fy, col) =>
    poly(
      [
        { x: fx - 3, y: fy - 3 },
        { x: fx + 10, y: fy - 3 },
        { x: fx + 10, y: fy + 1 },
        { x: fx - 3, y: fy + 1 },
      ],
      col,
    );

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.face, 1);
  if (f.invuln > 0 && Math.floor(t * 20) % 2 === 0) ctx.globalAlpha = 0.55;
  if (f.state === "dead") {
    ctx.rotate(-1.3);
    ctx.translate(-8, -2);
    ctx.globalAlpha = 0.92;
  }

  const run = f.state === "run";
  const crouch = f.crouch ? 16 : 0;
  const bob = run ? Math.abs(Math.sin(f.legPhase)) * -3 : 0;
  const hipY = -32 + crouch + bob;
  const shoulderY = hipY - 30 + crouch * 0.4;
  const lean = f.state === "attack" ? 7 : run ? 4 : f.state === "hurt" ? -4 : 1;

  // postura de piernas según estado
  const legPose = (frontLeg) => {
    let ft, kn;
    if (f.state === "jump") {
      ft = { x: frontLeg ? 10 : -10, y: -12 };
      kn = { x: frontLeg ? 11 : -3, y: hipY * 0.55 - 2 };
    } else if (crouch) {
      ft = { x: frontLeg ? 16 : -13, y: 0 };
      kn = { x: frontLeg ? 16 : -2, y: hipY * 0.35 };
    } else if (run) {
      const s = Math.sin(f.legPhase + (frontLeg ? 0 : Math.PI));
      ft = { x: s * 14, y: -Math.max(0, s) * 7 };
      kn = { x: s * 6 + 4, y: hipY * 0.5 - 2 };
    } else {
      ft = { x: frontLeg ? 7 : -7, y: 0 };
      kn = { x: frontLeg ? 5 : -3, y: hipY * 0.5 };
    }
    return { ft, kn };
  };
  const FL = legPose(true),
    BL = legPose(false);

  // 1) PIERNA TRASERA (en sombra)
  seg(
    [
      { x: 0, y: hipY },
      { x: BL.kn.x, y: BL.kn.y },
      { x: BL.ft.x, y: BL.ft.y },
    ],
    9,
    c.pantsSh,
  );
  foot(BL.ft.x, BL.ft.y, c.pantsSh);

  // 2) BRAZO TRASERO
  const bSh = { x: lean - 3, y: shoulderY + 2 };
  let bEl, bHa;
  if (f.state === "attack") {
    bEl = { x: lean - 12, y: shoulderY + 4 };
    bHa = { x: lean - 22, y: shoulderY + 9 };
  } else {
    const sw = run ? Math.sin(f.legPhase + Math.PI) * 7 : 0;
    bEl = { x: lean - 4, y: shoulderY + 10 };
    bHa = { x: lean - 4 + sw, y: shoulderY + 22 };
  }
  seg([bSh, bEl, bHa], 6.5, c.tunicSh);

  // 3) TORSO (túnica con volumen)
  poly(
    [
      { x: -7, y: hipY + 1 },
      { x: lean - 9, y: shoulderY + 3 },
      { x: lean + 9, y: shoulderY - 2 },
      { x: 9, y: hipY + 1 },
    ],
    c.tunic,
  );
  // sombra interior del torso
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-7, hipY + 1);
  ctx.lineTo(lean - 9, shoulderY + 3);
  ctx.lineTo(lean - 2, shoulderY + 2);
  ctx.lineTo(1, hipY + 1);
  ctx.closePath();
  ctx.fillStyle = c.tunicSh;
  ctx.globalAlpha *= 0.6;
  ctx.fill();
  ctx.restore();
  // faldón de la túnica
  poly(
    [
      { x: -9, y: hipY - 3 },
      { x: 11, y: hipY - 3 },
      { x: 14, y: hipY + 13 },
      { x: -12, y: hipY + 13 },
    ],
    c.tunic,
  );

  // 4) PIERNA DELANTERA (iluminada)
  seg(
    [
      { x: 0, y: hipY },
      { x: FL.kn.x, y: FL.kn.y },
      { x: FL.ft.x, y: FL.ft.y },
    ],
    9,
    c.pants,
  );
  foot(FL.ft.x, FL.ft.y, c.pants);

  // 5) FAJÍN
  poly(
    [
      { x: -8, y: hipY - 4 },
      { x: lean + 7, y: hipY - 10 },
      { x: lean + 9, y: hipY - 4 },
      { x: -7, y: hipY + 2 },
    ],
    c.sash,
  );
  if (f.isHero) {
    const flu = Math.sin(t * 5) * 3; // cola del fajín ondeando
    poly(
      [
        { x: -7, y: hipY - 2 },
        { x: -13, y: hipY + 11 + flu },
        { x: -8, y: hipY + 13 + flu },
        { x: -3, y: hipY + 2 },
      ],
      c.sash,
    );
  }

  // 6) CABEZA
  const hx = lean + 5,
    hy = shoulderY - 13;
  seg(
    [
      { x: lean + 2, y: shoulderY - 1 },
      { x: hx, y: hy + 7 },
    ],
    6,
    c.skin,
  ); // cuello
  // cara
  ctx.beginPath();
  ctx.ellipse(hx, hy, 8.5, 9.5, 0, 0, 7);
  ctx.strokeStyle = c.out;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.fillStyle = c.skin;
  ctx.fill();
  ctx.fillStyle = c.skinSh;
  ctx.beginPath();
  ctx.ellipse(hx - 3.5, hy, 4, 9, 0, 0, 7);
  ctx.fill(); // mejilla en sombra
  // nariz, ceja, ojo (mirando hacia +x)
  poly(
    [
      { x: hx + 8, y: hy - 1 },
      { x: hx + 12, y: hy + 2 },
      { x: hx + 8, y: hy + 3 },
    ],
    c.skin,
  );
  ctx.fillStyle = c.out;
  ctx.fillRect(hx + 2.5, hy - 2, 2.5, 2.5);
  ctx.fillRect(hx + 2, hy - 5, 5, 1.6);
  if (f.isHero) {
    // pelo rubio
    ctx.beginPath();
    ctx.moveTo(hx - 9, hy + 3);
    ctx.quadraticCurveTo(hx - 11, hy - 13, hx + 2, hy - 12);
    ctx.quadraticCurveTo(hx + 11, hy - 11, hx + 10, hy - 1);
    ctx.lineTo(hx + 5, hy - 4);
    ctx.quadraticCurveTo(hx, hy - 9, hx - 5, hy - 5);
    ctx.closePath();
    ctx.strokeStyle = c.out;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = c.hair;
    ctx.fill();
    ctx.fillStyle = c.hairSh;
    ctx.fillRect(hx - 9, hy - 1, 4, 5);
  } else {
    // casco metálico + nasal + penacho rojo
    ctx.beginPath();
    ctx.arc(hx, hy - 1, 10.5, Math.PI * 0.98, Math.PI * 2.02);
    ctx.strokeStyle = c.out;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#8b929b";
    ctx.fill();
    ctx.fillStyle = "#b8bec6";
    ctx.fillRect(hx - 9, hy - 4, 18, 3);
    poly(
      [
        { x: hx + 7, y: hy - 3 },
        { x: hx + 10, y: hy + 5 },
        { x: hx + 7, y: hy + 5 },
      ],
      "#9aa1ab",
    ); // nasal
    poly(
      [
        { x: hx - 3, y: hy - 12 },
        { x: hx + 1, y: hy - 12 },
        { x: hx - 1, y: hy - 22 },
        { x: hx - 5, y: hy - 20 },
      ],
      "#b23b3b",
    ); // penacho
  }

  // 7) BRAZO DELANTERO + ESPADA
  const sh = { x: lean + 2, y: shoulderY + 1 };
  let el, ha, ang;
  if (f.state === "attack") {
    el = { x: lean + 16, y: shoulderY + 1 };
    ha = { x: lean + 34, y: shoulderY - 2 };
    ang = Math.PI / 2;
  } else if (f.blocking) {
    el = { x: lean + 10, y: shoulderY - 8 };
    ha = { x: lean + 14, y: shoulderY - 26 };
    ang = 0;
  } else if (f.swordOut) {
    el = { x: lean + 12, y: shoulderY + 9 };
    ha = { x: lean + 24, y: shoulderY + 1 };
    ang = 0.92;
  } else {
    const sw = run ? Math.sin(f.legPhase) * 8 : 0;
    el = { x: lean + 5, y: shoulderY + 9 };
    ha = { x: lean + 6 + sw, y: shoulderY + 20 };
    ang = null;
  }
  seg([sh, el], 6.5, c.tunic); // manga
  seg([el, ha], 5.5, c.skin); // antebrazo
  dot(ha.x, ha.y, 3.4, c.skin); // mano

  if (ang !== null) {
    ctx.save();
    ctx.translate(ha.x, ha.y);
    ctx.rotate(ang);
    // empuñadura
    poly(
      [
        { x: -2.5, y: 0 },
        { x: 2.5, y: 0 },
        { x: 2.5, y: 8 },
        { x: -2.5, y: 8 },
      ],
      c.sash,
    );
    // guarda dorada
    poly(
      [
        { x: -7, y: -2 },
        { x: 7, y: -2 },
        { x: 7, y: 1 },
        { x: -7, y: 1 },
      ],
      c.gold,
    );
    // hoja
    poly(
      [
        { x: -2.5, y: -2 },
        { x: 2.5, y: -2 },
        { x: 1, y: -46 },
        { x: -1, y: -46 },
      ],
      c.steel,
    );
    ctx.fillStyle = c.steelSh;
    ctx.beginPath();
    ctx.moveTo(0.4, -3);
    ctx.lineTo(2, -3);
    ctx.lineTo(0.6, -44);
    ctx.closePath();
    ctx.fill(); // filo en sombra
    // pomo
    dot(0, 9, 2.6, c.gold);
    ctx.restore();
  }

  ctx.restore();
}
function shade(hex, m) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) * m,
    g = ((n >> 8) & 255) * m,
    b = (n & 255) * m;
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// ---- HUD: corazones de vida ---------------------------------------------
function drawHUD() {
  drawHearts(18, 16, player.hp, "#e0563b", "TÚ");
  if (guard.hp > 0)
    drawHearts(
      W - 18 - guard.maxhp * 26,
      16,
      guard.hp,
      "#9b3030",
      "GUARDIA",
      true,
    );
}
function drawHearts(x, y, hp, col, label, right = false) {
  ctx.font = "14px Cinzel";
  ctx.fillStyle = "#d8c79a";
  ctx.textAlign = right ? "right" : "left";
  ctx.fillText(label, right ? x + 4 * 26 - 4 : x, y - 2);
  for (let i = 0; i < 4; i++) {
    const hx = x + i * 26 + 8,
      hy = y + 20;
    ctx.fillStyle = i < hp ? col : "rgba(255,255,255,.12)";
    heart(hx, hy, 8);
  }
  ctx.textAlign = "left";
}
function heart(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.7);
  ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.5, y - s, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.4, x, y + s * 0.7);
  ctx.fill();
}

// ---- Pantalla de título --------------------------------------------------
function drawTitle() {
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0dcae";
  ctx.font = "900 46px 'Cinzel Decorative', serif";
  ctx.fillText("El Palacio del Tiempo", W / 2, H / 2 - 58);
  ctx.font = "18px Cinzel";
  ctx.fillStyle = "#c7b485";
  ctx.fillText("Atraviesa la mazmorra y vence al guardián.", W / 2, H / 2 - 18);
  // botón parpadeante
  if (Math.floor(t * 1.6) % 2 === 0) {
    ctx.fillStyle = "#ffe27a";
    ctx.font = "22px 'MedievalSharp', serif";
    ctx.fillText("▶  Presiona ENTER  ·  o toca la pantalla", W / 2, H / 2 + 34);
  }
  ctx.font = "13px Cinzel";
  ctx.fillStyle = "#9c8b63";
  ctx.fillText(
    "A D  moverse   ·   W saltar   ·   S agacharse   ·   Shift  golpear",
    W / 2,
    H / 2 + 78,
  );
  ctx.textAlign = "left";
}

// ---- Pantalla de victoria (mensaje Día del Padre) ------------------------
let vAlpha = 0;
function drawVictory() {
  vAlpha = Math.min(1, vAlpha + 0.02);
  // velo
  ctx.fillStyle = `rgba(10,6,3,${0.82 * vAlpha})`;
  ctx.fillRect(0, 0, W, H);

  // partículas doradas flotando
  for (let i = 0; i < 26; i++) {
    const px = ((i * 89 + t * 16 * ((i % 3) + 1)) % (W + 40)) - 20;
    const py = ((i * 61 + t * 9 * ((i % 2) + 1)) % (H + 40)) - 20;
    ctx.globalAlpha = 0.18 * vAlpha * (0.5 + Math.sin(t + i) * 0.5);
    ctx.fillStyle = "#e9c46a";
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = vAlpha;

  ctx.textAlign = "center";
  // marco decorativo
  ctx.strokeStyle = `rgba(201,154,60,${vAlpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 300, 60, 600, H - 130);
  ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - 292, 68, 584, H - 146);

  ctx.fillStyle = "#f6e6b8";
  ctx.font = "900 40px 'Cinzel Decorative', serif";
  ctx.fillText(FATHERS_DAY.titulo, W / 2, 138);

  ctx.font = "20px 'Cinzel', serif";
  ctx.fillStyle = "#ecd9ac";
  let yy = 190;
  FATHERS_DAY.lineas.forEach((l) => {
    if (l.includes("❤")) {
      ctx.fillStyle = "#e0563b";
      ctx.font = "22px 'Cinzel', serif";
      ctx.fillText(l, W / 2, yy);
      ctx.fillStyle = "#ecd9ac";
      ctx.font = "20px 'Cinzel', serif";
    } else ctx.fillText(l, W / 2, yy);
    yy += l === "" ? 14 : 30;
  });

  ctx.fillStyle = "#bba36e";
  ctx.font = "italic 16px 'Cinzel', serif";
  ctx.fillText(FATHERS_DAY.firma, W / 2, yy + 18);

  if (Math.floor(t * 1.6) % 2 === 0) {
    ctx.fillStyle = "#9c8b63";
    ctx.font = "14px 'MedievalSharp', serif";
    ctx.fillText(
      "Presiona  R  o toca la pantalla para jugar de nuevo",
      W / 2,
      H - 40,
    );
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}
