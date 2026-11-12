// ================= DRIVE SIMULATOR =================
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const mmss = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const ORD = ["", "1st", "2nd", "3rd", "4th"];
const SINGLE_HIGH = ["cover-3", "cover-1", "cover-0"];
const TWO_HIGH = ["cover-2", "tampa-2", "cover-4", "cover-6", "two-man"];

// How often a defense calls each coverage by situation, then adjusted by level.
const DC_BASE = {
  early: { "cover-3": 3, "cover-4": 2.5, "cover-6": 1.5, "cover-1": 1.5, "cover-2": 1, "tampa-2": 0.6, "cover-0": 0.4, "two-man": 0.4 },
  long:  { "cover-3": 1.5, "cover-4": 1.5, "cover-6": 1.5, "cover-1": 1, "cover-2": 2, "tampa-2": 2.5, "cover-0": 0.7, "two-man": 2.5 },
  short: { "cover-3": 2, "cover-4": 1, "cover-6": 0.5, "cover-1": 3, "cover-2": 0.5, "tampa-2": 0.3, "cover-0": 3, "two-man": 0.5 },
  red:   { "cover-3": 1.5, "cover-4": 1.5, "cover-6": 1, "cover-1": 3, "cover-2": 1, "tampa-2": 0.5, "cover-0": 2, "two-man": 1 }
};
const DC_LEVEL = {
  hs: { "cover-3": 1.5, "cover-6": 0.5, "two-man": 0.4, "tampa-2": 0.6 },
  college: { "cover-4": 1.4, "cover-6": 1.2 },
  nfl: { "cover-1": 1.4, "cover-6": 1.2, "cover-0": 0.8 }
};
function baseScore(playId, covId) {
  const look = lookById(covId);
  if (look.calls.some(c => c[0] === playId)) return 3;
  const w = (WEAK_CALLS[covId] || {})[playId];
  return w ? w[0] : 2;
}

let G = null;
const DS = { mode: "drive", length: "half", pcOn: true, pcTimer: null, showWhy: false };

function hurry() { return G.mode === "2min" || (G.clock <= 120 && (G.quarter === 2 || G.quarter === 4)); }

function sitTextG() {
  const goal = G.ball + G.dist >= 100;
  const field = G.ball < 50 ? `own ${G.ball}` : G.ball === 50 ? "midfield" : `opp ${100 - G.ball}`;
  return `${ORD[G.down]} & ${goal ? "goal" : G.dist}, ${field}`;
}

function dcPick() {
  const cat = G.dist <= 2 ? "short" : G.ball >= 80 ? "red" : ((G.down >= 3 && G.dist >= 7) || (G.down === 2 && G.dist >= 10)) ? "long" : "early";
  const w = { ...DC_BASE[cat] };
  for (const [k, m] of Object.entries(DC_LEVEL[state.level])) w[k] *= m;
  const notes = [];
  const rec = G.recent.slice(-6);
  if (rec.length >= 3) {
    for (const r of rec) for (const c of Object.keys(w)) {
      const s = baseScore(r, c);
      if (s === 3) w[c] *= 0.82; else if (s <= 1) w[c] *= 1.12;
    }
    const runs = rec.filter(id => PLAYS[id].type === "Run").length;
    const passes = rec.length - runs;
    if (rec.length >= 5 && runs >= 4) { SINGLE_HIGH.forEach(c => w[c] *= 1.4); notes.push(`You've run on ${runs} of your last ${rec.length} plays, so the DC is loading the box with a single-high safety.`); }
    if (rec.length >= 5 && passes >= 5) { TWO_HIGH.forEach(c => w[c] *= 1.3); notes.push(`You've thrown on ${passes} of your last ${rec.length} plays, so the DC is keeping two safeties deep.`); }
    const counts = {}; rec.forEach(id => counts[id] = (counts[id] || 0) + 1);
    const [topId, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (n >= 3) {
      Object.keys(w).forEach(c => { if (baseScore(topId, c) === 3) w[c] *= 0.5; });
      notes.push(`You've called ${PLAYS[topId].name} ${n} times in your last ${rec.length} plays. The DC is calling coverages that take it away.`);
    }
  }
  if (hurry() && G.mode !== "drive") { ["cover-2", "tampa-2", "cover-4"].forEach(c => w[c] *= 1.4); notes.push("Late in the half, the defense leans on two-deep coverages to protect the sidelines and the deep ball."); }
  const ids = Object.keys(w).filter(c => c !== G.lastCov || chance(0.5));
  let r = Math.random() * ids.reduce((s, c) => s + w[c], 0);
  let cov = ids[ids.length - 1];
  for (const c of ids) { r -= w[c]; if (r <= 0) { cov = c; break; } }
  // Pressure: more likely on long and short yardage, and in the red zone.
  let pressure = null;
  const prRate = ({ long: 0.3, short: 0.22, red: 0.25, early: 0.12 }[cat]) * (state.level === "hs" ? 0.8 : 1);
  if (cov !== "cover-0" && chance(prRate)) {
    pressure = Object.keys(PRESSURES)[ri(0, Object.keys(PRESSURES).length - 1)];
    cov = PRESSURES[pressure].under;
  }
  return { cov, notes, pressure };
}

function simOutcome(playId, score, flags = {}, prot = "standard") {
  const p = PLAYS[playId], meta0 = PMETA[playId];
  const meta = prot === "hot" && !QUICK.includes(playId) && p.type !== "Run" ? { d: Math.min(meta0.d, 6) } : meta0;
  if (p.type === "Run") {
    if (chance(0.015)) return { kind: "fumble", yards: ri(0, 3) };
    let y = Math.round([0.3, 1.8, 3.4, 4.8][score] + gauss() * 3);
    if (chance([0.005, 0.015, 0.035, 0.06][score])) y += ri(10, 40);
    y = Math.max(-4, y);
    return { kind: "run", yards: y, oob: playId === "oz" && chance(0.15) };
  }
  let [comp, inc, sack] = [[0.34, 0.44, 0.14], [0.46, 0.39, 0.10], [0.57, 0.33, 0.07], [0.67, 0.26, 0.05]][score];
  if (meta.slow) { comp -= 0.08; inc += 0.08; }
  if (QUICK.includes(playId) || prot === "hot") { comp += sack / 2; sack /= 2; }
  if (prot === "max") { comp += sack / 2; sack /= 2; }
  if (flags.unblocked) { const extra = Math.min(comp - 0.15, sack * 1.5); comp -= extra; sack += extra; }
  const r = Math.random();
  if (r < comp) {
    let y = meta.slow ? meta.d + ri(-2, 6) : meta.d + ri(-3, 1);
    y += ri(0, [1, 2, 4, 6][score]);
    if (chance([0.01, 0.025, 0.05, 0.09][score])) y += ri(10, 35);
    return { kind: "complete", yards: Math.max(0, y), oob: SIDELINE.includes(playId) && chance(0.3) };
  }
  if (r < comp + inc) return { kind: "inc", yards: 0 };
  if (r < comp + inc + sack) return { kind: "sack", yards: -ri(4, 9) };
  return { kind: "int", yards: meta.d };
}

// Game clock. Returns true if this tick hit the NFL two-minute warning.
function tick(sec) {
  const before = G.clock;
  G.clock = Math.max(0, G.clock - sec);
  if (state.level === "nfl" && (G.quarter === 2 || G.quarter === 4) && before > 120 && G.clock <= 120 && G.clock > 0) {
    G.clock = 120; G.running = false; G.flash.push("Two-minute warning. The clock stops.");
  }
}

function newGame() {
  const qLen = state.level === "hs" ? 720 : 900;
  G = { mode: DS.mode, length: DS.length, qLen, quarter: 1, clock: qLen, us: 0, them: 0, to: 3, running: false,
        ball: 25, down: 1, dist: 10, phase: "call", cov: null, dcNotes: [], picked: null, last: null,
        recent: [], lastCov: null, form: "doubles", prot: "standard", front: "over", pressure: null, motion: false, drive: null, drives: [], oppLog: [], allNotes: new Set(), flash: [], over: false, oppSecondHalf: false, scenario: null };
  if (G.mode === "2min") {
    const sc = [{ us: 17, them: 21, note: "Down 4 with 2:00 left. You need a touchdown." },
                { us: 20, them: 23, note: "Down 3 with 2:00 left. A field goal ties it, a touchdown wins it." },
                { us: 24, them: 24, note: "Tied with 2:00 left. Any score wins it." }][ri(0, 2)];
    Object.assign(G, { us: sc.us, them: sc.them, quarter: 4, clock: 120, to: ri(1, 3), scenario: sc.note });
  }
  startDrive(25);
}

function startDrive(ball) {
  Object.assign(G, { ball, down: 1, dist: Math.min(10, 100 - ball), running: false, picked: null, last: null, showFourth: false });
  G.drive = { start: ball, startClock: G.clock, startQ: G.quarter, plays: [], result: null, pts: 0 };
  nextSnap();
}

function nextSnap() {
  const { cov, notes, pressure } = dcPick();
  G.cov = cov; G.lastCov = cov; G.dcNotes = notes; G.picked = null;
  G.pressure = pressure; G.front = pickFront(state.level); G.motion = false;
  G.phase = "call"; DS.showWhy = false;
  G.showFourth = G.down === 4;
  dsRender(); pcStart();
}

// ----- real-time play clock -----
function pcStart() {
  pcStop();
  if (!DS.pcOn || !G || G.phase !== "call") return;
  G.pc = 40; G.pcPaused = false; pcPaint();
  DS.pcTimer = setInterval(() => {
    if (!G || G.pcPaused || G.phase !== "call") return;
    if (document.getElementById("view-drive").hidden) return;
    G.pc--; pcPaint();
    if (G.pc <= 0) delayOfGame();
  }, 1000);
}
function pcStop() { clearInterval(DS.pcTimer); DS.pcTimer = null; }
function pcPaint() {
  const el = document.getElementById("pc-box"); if (!el) return;
  el.classList.toggle("pc-low", G.pc <= 10);
  el.querySelector("b").textContent = G.pcPaused ? `${G.pc} ⏸` : G.pc;
  const btn = el.querySelector("button"); if (btn) btn.textContent = G.pcPaused ? "Resume" : "Pause";
}
function delayOfGame() {
  pcStop();
  const back = Math.min(5, G.ball - 1);
  G.ball -= back; G.dist += back;
  G.flash.push(`Delay of game. The play clock hit zero: back ${back} yards, replay ${ORD[G.down]} down.`);
  dsRender(); pcStart();
}

// ----- snapping a play -----
function preSnapRunoff() {
  if (!G.running) return true;
  tick(hurry() ? ri(14, 22) : ri(26, 36));
  if (G.clock <= 0) { G.flash.push("The clock ran out before you got the snap off."); clockZero(); return false; }
  return true;
}

function snapPlay(playId) {
  pcStop();
  const sit = sitTextG();
  if (!preSnapRunoff()) return;
  const ctx = { form: G.form, front: G.front, pressure: G.pressure, prot: PLAYS[playId].type === "Run" ? "standard" : G.prot };
  const g = grade(playId, G.cov, sit, ctx);
  const o = simOutcome(playId, g.score, g.flags, ctx.prot);
  const p = PLAYS[playId];
  G.recent.push(playId); if (G.recent.length > 8) G.recent.shift();
  G.dcNotes.forEach(n => G.allNotes.add(n));
  tick(p.type === "Run" ? ri(4, 7) : ri(5, 8));
  const entry = { sit, play: playId, cov: G.cov, g, o, ctx, notes: G.dcNotes.slice(), text: "" };
  G.drive.plays.push(entry);
  G.last = entry;
  let ended = null;
  const startBall = G.ball;
  if (o.kind === "run" || o.kind === "complete" || o.kind === "sack") {
    const nb = G.ball + o.yards;
    if (nb >= 100) {
      entry.text = `${o.kind === "run" ? "Run" : "Complete"} for ${100 - startBall} yard${100 - startBall === 1 ? "" : "s"}. TOUCHDOWN!`;
      ended = ["Touchdown", 7];
    } else if (nb <= 0) {
      entry.text = o.kind === "sack" ? "Sacked in the end zone. Safety." : "Tackled in the end zone. Safety.";
      ended = ["Safety", 0]; G.them += 2;
    } else {
      G.ball = nb;
      const verb = o.kind === "run" ? "Run" : o.kind === "complete" ? "Complete" : "Sacked";
      const yd = Math.abs(o.yards);
      entry.text = o.kind === "sack" ? `Sacked for a loss of ${yd}.` :
        o.yards < 0 ? `${verb} for a loss of ${yd}.` : o.yards === 0 ? `${verb} for no gain.` : `${verb} for ${yd} yard${yd === 1 ? "" : "s"}.`;
      if (o.yards >= G.dist) { G.down = 1; G.dist = Math.min(10, 100 - G.ball); entry.text += " First down!"; }
      else { G.down++; G.dist -= o.yards; }
      G.running = !o.oob;
      if (o.oob) entry.text += " Out of bounds, clock stopped.";
    }
  } else if (o.kind === "inc") {
    entry.text = "Incomplete. Clock stopped.";
    G.down++; G.running = false;
  } else if (o.kind === "int") {
    entry.text = "Intercepted!";
    ended = ["Interception", 0]; G.turnSpot = Math.min(99, G.ball + o.yards);
  } else if (o.kind === "fumble") {
    entry.text = `Fumble after ${o.yards} yard${o.yards === 1 ? "" : "s"}. The defense recovers.`;
    ended = ["Fumble", 0]; G.turnSpot = Math.min(99, G.ball + o.yards);
  }
  if (!ended && G.down > 4) { entry.text += " Turnover on downs."; ended = ["Turnover on downs", 0]; G.turnSpot = G.ball; }
  G.phase = "result";
  if (ended) { G.pendingEnd = ended; }
  else if (G.clock <= 0) { G.pendingClock = true; }
  dsRender();
}

function continueAfterResult() {
  if (G.pendingEnd) { const [r, pts] = G.pendingEnd; G.pendingEnd = null; endDrive(r, pts); return; }
  if (G.pendingClock) { G.pendingClock = false; clockZero(); return; }
  nextSnap();
}

// ----- clock running out -----
function lastQuarter() { return G.mode === "game" ? { quarter: 1, half: 2, game: 4 }[G.length] : 4; }
function clockZero() {
  pcStop();
  const q = G.quarter;
  if (q >= lastQuarter()) { endDrive("Clock ran out", 0, true); return; }
  if (q === 2) { endDrive("End of half", 0); return; }
  G.quarter++; G.clock = G.qLen;
  G.flash.push(`End of the ${ORD[q]} quarter. The drive continues.`);
  nextSnap();
}

// ----- 4th down choices -----
function fgInfo() {
  const dist = 100 - G.ball + 17;
  const k = { hs: 0.025, college: 0.018, nfl: 0.012 }[state.level];
  const max = { hs: 45, college: 55, nfl: 60 }[state.level];
  return { dist, max, p: Math.max(0.05, Math.min(0.99, 0.99 - Math.max(0, dist - 25) * k)) };
}
function doPunt() {
  pcStop();
  if (!preSnapRunoff()) return;
  tick(ri(6, 9));
  const net = ri(34, 46);
  const land = G.ball + net;
  G.turnSpot = land >= 100 ? 80 : land;
  G.last = { punt: true, text: land >= 100 ? `Punt into the end zone. Touchback.` : `Punt, ${net} yards net. Downed at the opponent's ${100 - land}.` };
  G.phase = "result"; G.pendingEnd = ["Punt", 0]; dsRender();
}
function doFG() {
  pcStop();
  if (!preSnapRunoff()) return;
  tick(ri(4, 6));
  const f = fgInfo();
  const good = chance(f.p);
  G.last = { kick: true, text: good ? `The ${f.dist}-yard field goal is GOOD.` : `The ${f.dist}-yard field goal is no good.` };
  G.turnSpot = Math.max(20, G.ball - 7);
  G.phase = "result"; G.pendingEnd = good ? ["Field goal", 3] : ["Missed field goal", 0]; dsRender();
}

// ----- clock tools -----
function useTimeout() { if (G.to > 0 && G.running) { G.to--; G.running = false; G.flash.push(`Timeout. ${G.to} left. The clock is stopped.`); dsRender(); pcStart(); } }
function doSpike() {
  if (!G.running) return;
  pcStop();
  tick(ri(4, 8));
  G.drive.plays.push({ sit: sitTextG(), spike: true, text: "Spiked to stop the clock." });
  G.down++; G.running = false;
  if (G.clock <= 0) { clockZero(); return; }
  if (G.down > 4) { G.turnSpot = G.ball; endDrive("Turnover on downs", 0); return; }
  G.flash.push("Ball spiked. The clock is stopped."); nextSnap();
}
function doKneel() {
  pcStop();
  if (!preSnapRunoff()) return;
  tick(ri(2, 3));
  G.drive.plays.push({ sit: sitTextG(), kneel: true, text: "QB kneels." });
  G.ball = Math.max(1, G.ball - 1); G.down++; G.dist++; G.running = true;
  if (G.clock <= 0) { clockZero(); return; }
  if (G.down > 4) { G.turnSpot = G.ball; endDrive("Turnover on downs", 0); return; }
  nextSnap();
}

// ----- drive and game flow -----
function endDrive(result, pts, clockOut) {
  pcStop();
  G.us += pts;
  const d = G.drive;
  d.result = result; d.pts = pts;
  d.yards = (result === "Touchdown" ? 100 : G.ball) - d.start;
  d.time = (d.startQ === G.quarter ? d.startClock - G.clock : d.startClock + (G.quarter - d.startQ - 1) * G.qLen + (G.qLen - G.clock));
  G.drives.push(d);
  if (G.mode === "drive") { G.phase = "over"; dsRender(); return; }
  if (G.mode === "2min") { G.phase = "over"; dsRender(); return; }
  if (clockOut || (G.clock <= 0 && G.quarter >= lastQuarter())) { G.phase = "over"; dsRender(); return; }
  // Opponent gets the ball.
  const scoreKick = ["Touchdown", "Field goal", "Safety"].includes(result);
  let oppStart = scoreKick ? 25 : Math.max(1, 100 - (G.turnSpot || 75));
  if (result === "End of half" || (G.clock <= 0 && G.quarter === 2)) {
    G.quarter = 3; G.clock = G.qLen; G.to = 3; G.oppSecondHalf = true; oppStart = 25;
    G.oppLog.push({ q: 3, text: "Halftime. The opponent receives the second-half kickoff." });
  }
  runOpponent(oppStart);
}

function runOpponent(start) {
  const pTD = Math.min(0.6, 0.22 + (start - 25) * 0.006);
  const roll = Math.random();
  let res = roll < pTD ? "TD" : roll < pTD + 0.17 ? "FG" : roll < pTD + 0.17 + 0.08 ? "TO" : roll < pTD + 0.17 + 0.13 ? "DOWNS" : "PUNT";
  let time = ri(120, 330);
  let halfEnded = false, gameEnded = false;
  const q0 = G.quarter;
  if (time < G.clock) {
    G.clock -= time;
  } else if ((G.quarter === 1 || G.quarter === 3) && G.quarter < lastQuarter()) {
    const over = time - G.clock; G.quarter++; G.clock = Math.max(1, G.qLen - over);
  } else {
    // Their drive reaches the end of the half or game.
    time = G.clock; G.clock = 0;
    if (res !== "TD" && res !== "FG") res = "CLOCK";
    else if (chance(0.5)) res = "CLOCK";
    if (G.quarter >= lastQuarter()) gameEnded = true; else halfEnded = true;
  }
  const label = { TD: "Opponent touchdown", FG: "Opponent field goal", PUNT: "Opponent punts", TO: "Your defense forces a turnover", DOWNS: "Your defense stops them on 4th down", CLOCK: "Opponent runs out the clock" }[res];
  if (res === "TD") G.them += 7; if (res === "FG") G.them += 3;
  G.oppLog.push({ q: q0, text: `${label} (started at ${start <= 50 ? "their " + start : "your " + (100 - start)}, ${mmss(time)} drive).` });
  let ourStart = { TD: 25, FG: 25, PUNT: ri(12, 32), TO: ri(25, 50), DOWNS: ri(30, 55), CLOCK: 25 }[res];
  G.nextStart = ourStart;
  G.oppResult = `${label}.`;
  if (gameEnded) { G.phase = "over"; dsRender(); return; }
  if (halfEnded) {
    G.quarter = 3; G.clock = G.qLen; G.to = 3;
    if (!G.oppSecondHalf) { G.oppSecondHalf = true; G.oppLog.push({ q: 3, text: "Halftime. The opponent receives the second-half kickoff." }); runOpponent(25); return; }
    G.nextStart = 25;
  }
  G.phase = "driveover"; dsRender();
}

// ----- rendering -----
function fieldStrip() {
  const X = y => 24 + y * 5.52;
  let s = `<rect x="0" y="0" width="600" height="46" rx="6" fill="var(--field)"/>
    <rect x="0" y="0" width="24" height="46" fill="var(--accent)" opacity="0.5"/><rect x="576" y="0" width="24" height="46" fill="var(--def)" opacity="0.45"/>`;
  for (let y = 10; y < 100; y += 10) {
    s += `<line x1="${X(y)}" x2="${X(y)}" y1="4" y2="42" stroke="var(--chalk-dim)"/>`;
    s += `<text x="${X(y)}" y="40" text-anchor="middle" font-size="9" fill="var(--chalk)" opacity="0.7" font-family="var(--font-body)">${y <= 50 ? y : 100 - y}</text>`;
  }
  const fd = G.ball + G.dist;
  if (fd < 100) s += `<line x1="${X(fd)}" x2="${X(fd)}" y1="2" y2="44" stroke="#ffd23f" stroke-width="3"/>`;
  s += `<line x1="${X(G.ball)}" x2="${X(G.ball)}" y1="2" y2="44" stroke="#5fb0ff" stroke-width="3"/>`;
  s += `<ellipse cx="${X(G.ball)}" cy="18" rx="7" ry="4.5" fill="#a0522d" stroke="#fff" stroke-width="1"/>`;
  return `<svg class="strip" viewBox="0 0 600 46" role="img" aria-label="Ball on ${esc(sitTextG())}">${s}</svg>`;
}

function scoreboard() {
  const showClock = true;
  return `<div class="board">
    <div><span class="l">You</span><b>${G.us}</b></div>
    <div><span class="l">Opponent</span><b>${G.them}</b></div>
    ${showClock ? `<div><span class="l">${ORD[G.quarter] || "OT"} qtr</span><b>${mmss(G.clock)}</b><span class="dot ${G.running ? "" : "stopped"}" title="${G.running ? "Clock running" : "Clock stopped"}"></span><span class="mstat"> ${G.running ? "running" : "stopped"}</span></div>` : ""}
    ${G.phase === "call" || G.phase === "result" ? `<div><span class="l">Down</span><b>${ORD[G.down]} & ${G.ball + G.dist >= 100 ? "Goal" : G.dist}</b></div>
    <div><span class="l">Ball on</span><b>${G.ball < 50 ? "Own " + G.ball : G.ball === 50 ? "50" : "Opp " + (100 - G.ball)}</b></div>` : ""}
    ${G.mode !== "drive" ? `<div><span class="l">Timeouts</span><b>${G.to}</b></div>` : ""}
    ${DS.pcOn && G.phase === "call" ? `<div id="pc-box"><span class="l">Play clock</span><b>${G.pc ?? 40}</b><br><button type="button" class="ghost" id="pc-pause">Pause</button></div>` : ""}
  </div>`;
}

function playbookHTML() {
  return `<div class="pb" id="ds-pb">${playbookButtons("ds", G.form, G.picked, false)}</div>`;
}

function whyHTML(e) {
  const look = lookById(e.cov);
  const top = bestCalls(e.cov, e.sit, e.ctx, e.play);
  return `<div class="fb-grid">
    <div>${lookSVG(look, e.ctx)}<p class="fb-caption">It was ${esc(look.name)}${e.ctx.pressure ? ` (${esc(PRESSURES[e.ctx.pressure].name)})` : ""} out of a ${esc(FRONTS[e.ctx.front].name)} front, ${boxCount(e.cov, e.ctx)} in the box.</p></div>
    <div>
      <h4>Your call</h4>
      <p>${esc(e.g.why)}</p>
      ${e.g.mods.length ? `<h4>Adjustments</h4><ul>${e.g.mods.map(m => `<li>${m.d > 0 ? "▲" : "▼"} ${esc(m.t)}</li>`).join("")}</ul>` : ""}
      ${pressureNote(e.ctx)}
      <h4>How to read ${esc(look.name)}</h4>
      <ul>${TR[e.cov].tells.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <h4>${top.length ? (e.g.score === 3 ? "Other great calls here" : "Best calls here") : "Best call"}</h4>
      ${top.length ? `<ul class="best-list">${top.map(t => `<li><span class="tier tier-${t.score}">${TIERS[t.score]}</span> <b>${esc(PLAYS[t.id].name)}</b><br>${esc(t.why)}</li>`).join("")}</ul>` : "<p>Your call was the best available.</p>"}
      ${e.notes && e.notes.length ? `<h4>Why the DC called ${esc(look.name)}</h4><ul>${e.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
    </div></div>`;
}

function setupHTML() {
  const card = (m, title, desc) => `<button type="button" class="mode" data-m="${m}" aria-pressed="${DS.mode === m}"><b>${title}</b><span>${desc}</span></button>`;
  return `<div class="sit"><span class="sit-label">Drive Simulator</span><strong>Pick a mode</strong></div>
    <p style="margin:0;max-width:65ch">Call every play. The defense picks coverages based on the situation, your level, and your own tendencies. Each call's grade sets the odds, so a great call usually works but nothing is guaranteed.</p>
    <div class="modes">
      ${card("drive", "Single drive", "Start at your own 25. Score a touchdown or a field goal.")}
      ${card("2min", "Two-minute drill", "2:00 left in the 4th, trailing or tied. Manage the clock and timeouts to win.")}
      ${card("game", "Full game", "Several drives against a simulated opponent. You choose the length.")}
    </div>
    ${DS.mode === "game" ? `<div><span class="seg-label" id="len-label">Game length</span><div class="seg" role="group" aria-labelledby="len-label" id="len-seg">
      ${[["quarter", "One quarter"], ["half", "One half"], ["game", "Full game"]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${DS.length === v}">${l}</button>`).join("")}</div></div>` : ""}
    <div><span class="seg-label" id="pc-label">40-second play clock (real time)</span><div class="seg" role="group" aria-labelledby="pc-label" id="pc-seg">
      <button type="button" data-v="on" aria-pressed="${DS.pcOn}">On</button><button type="button" data-v="off" aria-pressed="${!DS.pcOn}">Off</button></div></div>
    <button type="button" class="primary" id="ds-start">Start ${DS.mode === "drive" ? "the drive" : DS.mode === "2min" ? "the drill" : "the game"}</button>`;
}

function callHTML() {
  const flash = G.flash.length ? G.flash.map(f => `<p class="banner">${esc(f)}</p>`).join("") : "";
  G.flash = [];
  if (G.showFourth) {
    const f = fgInfo();
    const canFG = f.dist <= f.max;
    return `${flash}<div class="q"><h3>4th & ${G.ball + G.dist >= 100 ? "goal" : G.dist}. What's the call?</h3>
      <div class="fourth">
        <button type="button" class="mode" id="go4"><b>Go for it</b><span>Call a play. Come up short and it's a turnover on downs.</span></button>
        <button type="button" class="mode" id="punt" ${G.ball >= 65 ? "disabled" : ""}><b>Punt</b><span>${G.ball >= 65 ? "Too close to punt." : "Flip the field. About 40 yards net."}</span></button>
        <button type="button" class="mode" id="fg" ${canFG ? "" : "disabled"}><b>Field goal</b><span>${canFG ? `${f.dist} yards · about ${Math.round(f.p * 100)}% at this level.` : `${f.dist} yards is out of range (max about ${f.max} at this level).`}</span></button>
      </div></div>`;
  }
  const p = G.picked ? PLAYS[G.picked] : null;
  return `${flash}
    <div class="setrow">${segHTML("ds-form", FORM_ITEMS(), G.form, "Formation")}
      <button type="button" class="ghost" id="ds-motion" ${G.motion ? "disabled" : ""}>Send jet motion</button></div>
    ${presnapSVG(G.cov, { form: G.form, front: G.front, pressure: G.pressure }, "ds-svg")}
    <div class="snapbar"><span><b>${esc(sitTextG())}.</b> ${frontLine({ front: G.front })}. Read the coverage and the box, then make the call.</span></div>
    ${G.motion ? `<p class="hint">${esc(motionHint(G.cov))}</p>` : ""}
    <div class="tools">
      ${G.mode !== "drive" ? `<button type="button" class="ghost" id="t-to" ${G.to > 0 && G.running ? "" : "disabled"}>Timeout (${G.to})</button>
      <button type="button" class="ghost" id="t-spike" ${G.running ? "" : "disabled"}>Spike</button>
      <button type="button" class="ghost" id="t-kneel">Kneel</button>` : ""}
      <span class="mstat">${G.running ? `Clock is running. About ${hurry() ? "15-20" : "25-35"} seconds will come off before the snap.` : "Clock is stopped until the snap."}</span>
    </div>
    <div class="q"><h3>Your call</h3>${playbookHTML()}</div>
    ${p ? `<div class="preview">${playSVG(p, G.form)}<div>
      <div class="chips" style="margin:0"><span class="chip t-${p.type}">${p.type}</span><span class="chip">${esc(FORMS[G.form].label)}</span></div>
      <h3 style="margin-top:6px">${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      ${p.type !== "Run" ? `<div style="margin-top:10px">${segHTML("ds-prot", PROTECTIONS, G.prot, "Protection")}<p class="mstat" style="margin-top:4px">${esc(PROT_INFO[G.prot])}</p></div>` : ""}
      <button type="button" class="primary" id="ds-snap">Snap it</button></div></div>` : ""}`;
}

function resultHTML() {
  const e = G.last;
  const flash = G.flash.length ? G.flash.map(f => `<p class="banner">${esc(f)}</p>`).join("") : "";
  G.flash = [];
  const nextLabel = G.pendingEnd ? "End of drive" : G.pendingClock ? "Clock hits 0:00" : "Next play";
  if (e.punt || e.kick) return `${flash}<div class="result"><h3>${esc(e.text)}</h3><button type="button" class="primary" id="ds-next">${nextLabel}</button></div>`;
  const look = lookById(e.cov);
  const short = e.g.why.split(/(?<=\.)\s/)[0];
  return `${flash}<div class="result">
    <div class="row"><span class="tier tier-${e.g.score}">${TIERS[e.g.score]}</span><span class="mstat">${esc(PLAYS[e.play].name)} vs ${esc(look.name)}</span></div>
    <h3>${esc(e.text)}</h3>
    <p>${esc(short)}${e.g.mods.length ? " " + esc(e.g.mods[0].t) : ""}</p>
    ${luckLine(e)}
    ${e.notes.length ? `<p class="mstat">DC adjustment: ${esc(e.notes[0])}</p>` : ""}
    <div class="row"><button type="button" class="primary" id="ds-next">${nextLabel}</button><button type="button" class="ghost" id="ds-why" aria-expanded="${DS.showWhy}">${DS.showWhy ? "Hide breakdown" : "See why?"}</button></div>
    ${DS.showWhy ? whyHTML(e) : ""}
  </div>`;
}

function luckLine(e) {
  const bad = ["int", "fumble", "sack", "inc"].includes(e.o.kind) || ((e.o.kind === "run" || e.o.kind === "complete") && e.o.yards <= 1);
  const good = (e.o.kind === "run" || e.o.kind === "complete") && (e.o.yards >= 10 || /TOUCHDOWN|First down/.test(e.text));
  if (e.g.score >= 2 && bad) return `<p class="mstat">Right idea, bad result. Good calls still fail sometimes. Keep trusting the read.</p>`;
  if (e.g.score <= 1 && good) return `<p class="mstat">You got away with one. Against ${esc(lookById(e.cov).name)} that call usually struggles.</p>`;
  return "";
}

function driveRows(d) {
  return d.plays.map((e, i) => e.spike || e.kneel
    ? `<tr><td class="n">${i + 1}</td><td>${esc(e.sit)}</td><td colspan="3">${esc(e.text)}</td></tr>`
    : `<tr><td class="n">${i + 1}</td><td>${esc(e.sit)}</td><td>${esc(PLAYS[e.play].name)}</td><td>${esc(lookById(e.cov).name)}</td><td><span class="tier tier-${e.g.score}" style="font-size:.8rem">${TIERS[e.g.score]}</span> ${esc(e.text)}</td></tr>`).join("");
}

function recapStats(drives) {
  const calls = drives.flatMap(d => d.plays.filter(e => e.g));
  const avg = calls.length ? (calls.reduce((s, e) => s + e.g.score, 0) / calls.length).toFixed(1) : "–";
  const great = calls.filter(e => e.g.score === 3).length;
  const runs = calls.filter(e => PLAYS[e.play].type === "Run").length;
  const worst = calls.slice().sort((a, b) => a.g.score - b.g.score)[0];
  let miss = "";
  if (worst && worst.g.score <= 1) {
    const best = bestCalls(worst.cov, worst.sit, worst.ctx, null)[0];
    miss = `<h4>Biggest missed opportunity</h4><p>On ${esc(worst.sit)} you called ${esc(PLAYS[worst.play].name)} into ${esc(lookById(worst.cov).name)} (${TIERS[worst.g.score]}). ${esc(PLAYS[best.id].name)} was the better call: ${esc(best.why)}</p>`;
  }
  const notes = [...G.allNotes];
  return `<div class="scorebox" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">
      <div><b>${calls.length}</b><span>Plays called</span></div>
      <div><b>${avg}</b><span>Avg grade (of 3)</span></div>
      <div><b>${great}</b><span>Great calls</span></div>
      <div><b>${calls.length ? Math.round(runs / calls.length * 100) : 0}%</b><span>Run calls</span></div>
    </div>
    <div class="fb-grid" style="grid-template-columns:1fr"><div>
      ${miss}
      <h4>What the defense noticed</h4>
      ${notes.length ? `<ul>${notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : "<p>You stayed balanced enough that the DC never had to adjust to your tendencies.</p>"}
    </div></div>`;
}

function overHTML() {
  const d = G.drives[G.drives.length - 1];
  let headline, sub = "";
  if (G.mode === "drive") {
    headline = d.pts ? `${d.result}! ${d.pts} points` : `Drive over: ${d.result}`;
    sub = `${d.plays.length} play${d.plays.length === 1 ? "" : "s"}, ${Math.max(0, d.yards)} yards, ${mmss(d.time)} of clock.`;
  } else {
    const diff = G.us - G.them;
    headline = diff > 0 ? `You win, ${G.us}-${G.them}` : diff < 0 ? `You lose, ${G.us}-${G.them}` : `Tied, ${G.us}-${G.them}`;
    sub = G.mode === "2min" ? `Your drive: ${d.result.toLowerCase()} after ${d.plays.length} play${d.plays.length === 1 ? "" : "s"} and ${Math.max(0, d.yards)} yards.` + (diff === 0 ? " Heading to overtime." : "")
      : `${G.drives.length} drives, ${G.drives.reduce((s, x) => s + x.pts, 0)} points.`;
  }
  const tables = G.drives.map((x, i) => `<h4>Drive ${i + 1}: ${esc(x.result)}${x.pts ? ` (+${x.pts})` : ""} · ${x.plays.length} play${x.plays.length === 1 ? "" : "s"}, ${Math.max(0, x.yards)} yards</h4>
    <div class="tbl-wrap"><table class="recap"><thead><tr><th>#</th><th>Situation</th><th>Call</th><th>Coverage</th><th>Result</th></tr></thead><tbody>${driveRows(x)}</tbody></table></div>`).join("");
  return `<div class="result">
      <p class="final">${esc(headline)}</p>
      <p>${esc(sub)}</p>
      ${recapStats(G.drives)}
      <div class="fb-grid" style="grid-template-columns:1fr"><div>${tables}</div></div>
      <div class="row"><button type="button" class="primary" id="ds-again">Play again</button><button type="button" class="ghost" id="ds-menu">Change mode</button></div>
    </div>`;
}

function driveOverHTML() {
  const d = G.drives[G.drives.length - 1];
  return `<div class="result">
    <h3>Drive over: ${esc(d.result)}${d.pts ? ` (+${d.pts})` : ""}</h3>
    <p>${d.plays.length} play${d.plays.length === 1 ? "" : "s"}, ${Math.max(0, d.yards)} yards, ${mmss(d.time)} of clock.</p>
    <h4 style="margin:6px 0 0;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Meanwhile</h4>
    <ul style="margin:0;padding-left:18px">${G.oppLog.slice(-2).map(o => `<li>${esc(o.text)}</li>`).join("")}</ul>
    <p><b>Your ball at the ${G.nextStart < 50 ? "own " + G.nextStart : "opp " + (100 - G.nextStart)}.</b> ${ORD[G.quarter]} quarter, ${mmss(G.clock)} left. Score: You ${G.us}, Opponent ${G.them}.</p>
    <div class="tbl-wrap"><table class="recap"><thead><tr><th>#</th><th>Situation</th><th>Call</th><th>Coverage</th><th>Result</th></tr></thead><tbody>${driveRows(d)}</tbody></table></div>
    <button type="button" class="primary" id="ds-nextdrive">Start next drive</button>
  </div>`;
}

function dsSide() {
  const side = document.getElementById("ds-side");
  if (!G) {
    side.innerHTML = `<h2>How it works</h2>
      <p>Each snap, the defense shows a pre-snap look. Read it, pick a play and snap it.</p>
      <p>Your call's grade (Great, Good, Risky or Bad) sets the odds of the result. Then the DC adjusts to your tendencies: run too much and the box gets loaded, and repeat a play and the defense takes it away.</p>
      <p>The game clock moves with every play. Incompletions and out-of-bounds plays stop it. The 40-second play clock runs in real time and can be paused.</p>`;
    return;
  }
  const d = G.drive;
  const items = d ? d.plays.slice().reverse().map(e => e.g
    ? `<li class="g${e.g.score}"><span class="s">${esc(e.sit)}</span>${esc(PLAYS[e.play].name)} vs ${esc(lookById(e.cov).name)}: ${esc(e.text)}</li>`
    : `<li><span class="s">${esc(e.sit)}</span>${esc(e.text)}</li>`).join("") : "";
  side.innerHTML = `<h2>This drive</h2>
    ${G.scenario ? `<p class="banner">${esc(G.scenario)}</p>` : ""}
    ${items ? `<ul class="log">${items}</ul>` : "<p>No plays yet.</p>"}
    ${G.mode === "game" && G.oppLog.length ? `<h2 style="font-size:1.1rem">Game log</h2><ul class="log">${G.drives.map((x, i) => `<li><span class="s">Your drive ${i + 1}</span>${esc(x.result)}${x.pts ? ` (+${x.pts})` : ""}</li>`).join("")}${G.oppLog.map(o => `<li><span class="s">Opponent</span>${esc(o.text)}</li>`).join("")}</ul>` : ""}
    <button type="button" class="ghost" id="ds-quit">${G.phase === "over" ? "Back to modes" : "Quit to modes"}</button>`;
  document.getElementById("ds-quit").addEventListener("click", () => { pcStop(); G = null; dsRender(); });
}

function dsRender() {
  const main = document.getElementById("ds-main");
  if (!G) {
    main.innerHTML = setupHTML();
    main.querySelectorAll(".mode").forEach(b => b.addEventListener("click", () => { DS.mode = b.dataset.m; dsRender(); }));
    const len = document.getElementById("len-seg");
    if (len) len.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { DS.length = b.dataset.v; dsRender(); }));
    document.getElementById("pc-seg").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { DS.pcOn = b.dataset.v === "on"; dsRender(); }));
    document.getElementById("ds-start").addEventListener("click", newGame);
    dsSide(); return;
  }
  let body = "";
  if (G.phase === "call") body = callHTML();
  else if (G.phase === "result") body = resultHTML();
  else if (G.phase === "driveover") body = driveOverHTML();
  else body = overHTML();
  main.innerHTML = `${scoreboard()}${G.phase === "call" || G.phase === "result" ? fieldStrip() : ""}${body}`;

  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  on("pc-pause", () => { G.pcPaused = !G.pcPaused; pcPaint(); });
  on("go4", () => { G.showFourth = false; dsRender(); pcPaint(); });
  on("punt", doPunt); on("fg", doFG);
  on("t-to", useTimeout); on("t-spike", doSpike); on("t-kneel", doKneel);
  on("ds-snap", () => snapPlay(G.picked));
  on("ds-motion", () => { G.motion = true; if (G.pc !== undefined && DS.pcOn) G.pc = Math.max(1, G.pc - 4); dsRender(); pcPaint(); });
  bindSeg("ds-form", v => { G.form = v; if (G.picked && !playForms(G.picked).includes(v)) G.picked = null; dsRender(); pcPaint(); });
  bindSeg("ds-prot", v => { G.prot = v; dsRender(); pcPaint(); });
  on("ds-next", continueAfterResult);
  on("ds-why", () => { DS.showWhy = !DS.showWhy; dsRender(); });
  on("ds-nextdrive", () => startDrive(G.nextStart));
  on("ds-again", () => newGame());
  on("ds-menu", () => { G = null; dsRender(); });
  main.querySelectorAll("#ds-pb .opt").forEach(b => b.addEventListener("click", () => { G.picked = b.dataset.v; dsRender(); pcPaint(); const s = document.getElementById("ds-snap"); if (s) s.focus({ preventScroll: true }); }));
  if (G.phase === "call") pcPaint();
  dsSide();
}

