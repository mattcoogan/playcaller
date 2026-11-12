// ================= CALL IT QUIZ =================
const TIERS = ["Bad", "Risky", "Good", "Great"];
const PB_GROUPS = [
  ["Quick game", ["slantFlat", "stick", "snag", "mesh", "spacing", "hoss"]],
  ["Dropback", ["smash", "flood", "curlFlat", "levels", "drive", "dagger", "mills", "ycross", "postWheel", "verts"]],
  ["Play-action", ["boot", "yankee"]],
  ["Runs", ["iz", "oz", "duo", "power", "counter", "trap", "toss", "jetSweep", "zoneRead", "qbPower", "draw", "qbDraw"]],
  ["RPO & screens", ["rpoBubble", "rpoGlance", "rbScreen", "tunnel"]]
];
// d: depth (yards) where the main throw or run usually ends up. slow: takes time to develop.
const PMETA = {
  slantFlat: { d: 5 }, stick: { d: 6 }, snag: { d: 6 }, mesh: { d: 6 }, smash: { d: 10 }, flood: { d: 12 },
  dagger: { d: 15, slow: 1 }, mills: { d: 14, slow: 1 }, ycross: { d: 15, slow: 1 }, verts: { d: 20, slow: 1 },
  boot: { d: 10, slow: 1 }, iz: { d: 4 }, oz: { d: 4 }, power: { d: 4 }, zoneRead: { d: 4 }, draw: { d: 4 },
  qbDraw: { d: 4 }, rpoBubble: { d: 4 }, rbScreen: { d: 5 },
  levels: { d: 10 }, drive: { d: 10 }, spacing: { d: 6 }, curlFlat: { d: 9 }, hoss: { d: 7 }, postWheel: { d: 15, slow: 1 },
  yankee: { d: 20, slow: 1 }, tunnel: { d: 4 }, counter: { d: 4 }, duo: { d: 4 }, trap: { d: 4 }, jetSweep: { d: 5 },
  toss: { d: 4 }, qbPower: { d: 4 }, rpoGlance: { d: 6 }
};
const QUICK = ["slantFlat", "stick", "snag", "mesh", "spacing", "hoss", "rpoBubble", "rpoGlance", "rbScreen", "tunnel"];
const SIDELINE = ["smash", "flood", "boot", "slantFlat", "stick", "curlFlat", "hoss", "postWheel"];
const QB_READ = ["zoneRead", "rpoBubble", "rpoGlance", "qbPower"];
// Calls that run into a coverage's strength: [score, reason]. 1 = Risky, 0 = Bad.
// Anything not listed here or in that look's recommended calls grades as Good.
const WEAK_CALLS = {
  "cover-3": {
    smash: [0, "The corner route runs straight into the deep-third corner, who is bailing to exactly that spot."],
    iz: [1, "With a safety walked down, Cover 3 puts 8 defenders in the box. You're a blocker short."],
    power: [1, "Eight defenders in the box means the defense has an extra man to fill the hole."],
    oz: [1, "The rolled-down safety and the curl-flat defender both fit the edge. It's hard to get outside of 8 in the box."],
    qbDraw: [1, "Zone defenders face the QB, so they see the draw right away."],
    mesh: [1, "Crossers are built for man coverage. Against zone they settle, but linebackers sit in those windows."]
  },
  "cover-2": {
    rpoBubble: [0, "The squatting corner is sitting right where the bubble goes."],
    slantFlat: [1, "The corner squats on the flat, and the hook defenders undercut the slant."],
    rbScreen: [1, "The squatting corners are already in the flats, right where the screen is headed."],
    oz: [1, "Cover 2 corners are run-support players on the edge, so outside runs meet an extra defender."]
  },
  "tampa-2": {
    rpoBubble: [0, "The corner squats in the flat, right where the bubble goes."],
    mills: [1, "The Mike runs to the deep middle, which is exactly where the post lands."],
    verts: [1, "The Mike carries one seam and a safety takes the other. There's less room than in regular Cover 2."],
    slantFlat: [1, "The corner sits in the flat and the hook defenders squeeze the slant."]
  },
  "cover-4": {
    verts: [0, "Four deep defenders against four vertical routes. Quarters is built to stop exactly this."],
    smash: [1, "The safety reads the slot and drives on the corner route. Only the hitch is reliably open."],
    iz: [1, "Quarters safeties fit the run from 8-10 yards, so the defense gets extra hats in the run game."],
    power: [1, "Both safeties are close enough to fill fast. You're outnumbered at the point of attack."],
    oz: [1, "Quarters corners and safeties fit the edge quickly."]
  },
  "cover-6": {
    verts: [1, "The Quarters side has two deep defenders over two receivers. Only the Cover 2 side has a seam to attack."],
    power: [1, "The Quarters-side safety fits the run fast."],
    rpoBubble: [1, "Only a good call toward the Quarters side. Toward the Cover 2 side, the corner squats on the bubble."]
  },
  "cover-1": {
    stick: [1, "Settle routes stop right in front of a man defender who's already on the receiver's hip."],
    flood: [1, "Flood is built to overload zones. Against man there's no zone to stretch."],
    smash: [1, "The hitch is a tough throw against a pressed man corner."],
    iz: [1, "With man coverage and a robber, the defense can still put 7 near the box."],
    power: [1, "The robber linebacker is free to fill the hole."],
    rpoBubble: [1, "The nickel is playing man on the slot and runs with the bubble."]
  },
  "cover-0": {
    boot: [0, "Play-action takes time, and an unblocked blitzer gets there first."],
    ycross: [0, "A 15-yard cross takes too long. The QB will be hit before the receiver clears."],
    mills: [0, "Too slow against a full blitz. You don't have the protection to wait for the post."],
    dagger: [0, "The dig at 15 yards needs time the QB won't have against six or more rushers."],
    flood: [1, "Three-level routes take time to develop against a full blitz."],
    iz: [1, "Every defender is near the line, and blitzers shoot gaps before the run gets going."],
    power: [1, "Blitzers can beat the pulling guard to the hole."],
    oz: [1, "A blitzer off the edge can blow it up in the backfield."],
    zoneRead: [1, "The blitz usually accounts for the QB too, so the read is muddy."],
    stick: [1, "Tight man coverage sits right on the stick route."]
  },
  "two-man": {
    verts: [0, "Two safeties over the top plus trailing defenders underneath. Deep shots are what 2-Man takes away."],
    mills: [0, "The post runs right into a deep-half safety, and the dig is undercut by the trailing defender."],
    stick: [1, "Trailing defenders undercut routes that stop."],
    slantFlat: [1, "The trailing defender is already inside, which is where the slant goes."],
    smash: [1, "The corner route runs toward a deep-half safety, and the hitch gets undercut."],
    dagger: [1, "The half-field safety sits on the seam, and the trailing defender undercuts the dig."],
    flood: [1, "It's built to beat zones. Against man there's no zone to overload."]
  }
};

function parseSit(text) {
  const m = text.match(/(\d)(?:st|nd|rd|th) & (\d+|goal)/i);
  const down = m ? +m[1] : 1;
  const opp = text.match(/opp (\d+)/i);
  const yard = opp ? +opp[1] : null;
  const dist = m && m[2].toLowerCase() === "goal" ? (yard || 5) : (m ? +m[2] : 10);
  return { down, dist, redzone: yard !== null && yard <= 20 };
}

// ---------- Phase 1: risky and bad matchups for the new plays ----------
const NEW_WEAK = {
  "cover-3": { spacing: [2, null], tunnel: [1, "Cover 3 corners are bailing, but the curl-flat defender is right where the tunnel screen comes inside."],
               counter: [1, "Eight in the box with a rolled-down safety. The pullers run out of people to block."],
               duo: [1, "A walked-down safety gives Cover 3 an extra run defender that duo can't account for."],
               trap: [1, "The extra box defender can fill the trap hole before the back gets there."] },
  "cover-2": { curlFlat: [1, "The squatting corner sits on the flat, and the hook defender walls the curl."],
               hoss: [1, "The squatting corner sits right on the hitch. Only the seam is an option."],
               tunnel: [1, "Squatting corners are already in position to blow up a screen."],
               toss: [1, "Cover 2 corners are force players who set the edge against outside runs."],
               jetSweep: [1, "The squatting corners are in perfect position to force the jet sweep back inside."],
               yankee: [1, "Two deep safeties can each take one of the deep routes."] },
  "tampa-2": { yankee: [1, "Two deep safeties plus the Mike running the middle take away both deep routes."],
               tunnel: [1, "Squatting corners sit right on the screen."],
               toss: [1, "The corners force the edge against outside runs."] },
  "cover-4": { curlFlat: [1, "Quarters corners sit deep over the curl, and the curl-flat defender is ready for the flat."],
               toss: [1, "Quarters safeties are 8-10 yards deep and fit the edge fast."],
               counter: [1, "Both safeties fill the run quickly from 8-10 yards. The pullers get outnumbered."],
               yankee: [1, "Four deep defenders cover the post and the deep over."] },
  "cover-6": { curlFlat: [1, "Toward the Cover 2 side the corner squats on the flat."] },
  "cover-1": { spacing: [0, "Sit routes stop right in front of man defenders who are already on their hips."],
               curlFlat: [1, "Curls against tight man coverage are tough throws with a defender right there."],
               levels: [1, "No rub or traffic. Each receiver has to beat his man one-on-one."],
               duo: [1, "With the robber, the defense can still match your blockers in the box."],
               counter: [1, "The robber linebacker is free to fill the counter."],
               rpoGlance: [1, "The glance runs straight into the robber and the deep safety."] },
  "cover-0": { spacing: [1, "Sit routes are tough against tight man with pressure coming, but at least the ball comes out fast."],
               yankee: [0, "Play-action takes too long. An unblocked blitzer gets home before the deep routes develop."],
               postWheel: [0, "Too slow against a full blitz."],
               levels: [1, "The deeper in-route takes too long with six rushers coming."],
               drive: [1, "The dig takes too long, though the shallow can be a quick answer."],
               curlFlat: [1, "Curls take a 5-step drop. That's too long against an all-out blitz."],
               duo: [0, "Blitzers knife through the double teams before the back can read anything."],
               counter: [0, "The pullers can't get there before the blitz arrives in the backfield."],
               trap: [1, "Blitzers pour into the trap hole along with the trapped defender."],
               toss: [1, "Edge blitzers can beat the pulling guard to the corner."],
               qbPower: [1, "Every gap is accounted for by a blitzer."] },
  "two-man": { spacing: [0, "Trailing defenders undercut sit routes, with safeties over the top."],
               curlFlat: [1, "Trailing defenders undercut the curl."],
               hoss: [1, "Trailing defenders undercut the hitch, and safeties sit on the seams."],
               postWheel: [0, "Deep-half safeties cover both the post and the wheel."],
               yankee: [0, "Two deep safeties take away both deep routes."],
               levels: [1, "Trailing defenders undercut the in-routes."] }
};
for (const [cov, m] of Object.entries(NEW_WEAK)) for (const [k, v] of Object.entries(m)) if (v[1]) (WEAK_CALLS[cov] = WEAK_CALLS[cov] || {})[k] = v;

// ---------- Phase 1: fronts ----------
const FRONTS = {
  over:  { name: "4-3 Over", dl: [["E", 40.5], ["T", 46.5], ["T", 52], ["E", 60]], box: 0,
           tip: "Four down linemen shifted toward the strength. A balanced front with no obvious weakness." },
  under: { name: "4-3 Under", dl: [["E", 39.5], ["T", 48.5], ["T", 54], ["E", 59.5]], box: 0,
           tip: "Linemen shifted away from the strength, with a 3-technique to the weak side." },
  bear:  { name: "Bear", dl: [["E", 38], ["T", 45], ["N", 50], ["T", 55], ["E", 62]], box: 1,
           tip: "The center and both guards are covered by down linemen. There's no one to double-team inside." },
  tite:  { name: "Tite (3-down)", dl: [["E", 44], ["N", 50], ["E", 56]], box: 0,
           tip: "A nose on the center and two 4i-techniques inside the tackles. The interior gaps are squeezed shut." },
  wide:  { name: "Wide 9", dl: [["E", 35], ["T", 46.5], ["T", 53.5], ["E", 65]], box: 0,
           tip: "Defensive ends lined up very wide to rush the passer. The interior is thinner." }
};
const FRONT_W = {
  hs: { over: 3, under: 2, bear: 1, tite: 1, wide: 0.5 },
  college: { over: 2, under: 2, bear: 0.7, tite: 2.5, wide: 1 },
  nfl: { over: 2.5, under: 2, bear: 0.5, tite: 1.5, wide: 2 }
};
const FRONT_MODS = {
  bear: { iz: -1, duo: -1, trap: -1, draw: -1, oz: 1, toss: 1, jetSweep: 1 },
  tite: { iz: -1, duo: -1, power: -1, counter: -1, oz: 1, toss: 1, jetSweep: 1 },
  wide: { trap: 1, draw: 1, iz: 1, oz: -1, toss: -1 },
  under: { counter: 1 }, over: {}
};
const FRONT_WHY = {
  bear: ["Bear covers the center and both guards, so there are no double teams inside.", "The Bear front is weak on the edges."],
  tite: ["Tite's 4i-techniques squeeze the inside gaps and wreck down blocks.", "Tite pinches everything inside, so outside runs get to the edge."],
  wide: ["Wide 9 ends take themselves out of the run on the edge.", "Wide 9 ends rush upfield, opening the inside."],
  under: ["", "The Under front leaves a bubble on the strong side for the counter pullers."]
};
function pickFront(level) {
  const w = FRONT_W[level]; let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(w)) { r -= v; if (r <= 0) return k; }
  return "over";
}

// ---------- Phase 1: pressures ----------
const PRESSURES = {
  "fire-zone":   { name: "Fire zone", rush: 5, under: "cover-3", blitzers: { M: [48, 2.8] },
                   tell: "The Mike creeping toward the A gap, with a safety ready to rotate down late.",
                   note: "Five rushers with a 3-deep, 3-under zone behind it. Hot throws go where the blitzer left." },
  "mike-1":      { name: "Cover 1 Mike blitz", rush: 5, under: "cover-1", blitzers: { M: [50, 2.8] },
                   tell: "Man coverage alignment with the Mike walked up over the center.",
                   note: "Man coverage with the Mike blitzing up the middle. There's no robber to help underneath." },
  "nickel-edge": { name: "Nickel edge pressure", rush: 5, under: "cover-3", blitzers: { NB: [33, 2.6] }, edge: true,
                   tell: "The nickel cheating toward the line from the slot, with his eyes in the backfield.",
                   note: "The nickel blitzes off the edge. The slot he left is open for a quick throw." },
  "sim":         { name: "Simulated pressure", rush: 4, under: "cover-3", sim: true, blitzers: { W: [45, 2.6], M: [55, 2.6] },
                   tell: "Both linebackers mugged in the A gaps, threatening six rushers.",
                   note: "It looks like six are coming, but only four rush. A defensive end drops into coverage." }
};
const PRESSURE_FOR = { "cover-3": ["fire-zone", "nickel-edge", "sim"], "cover-1": ["mike-1"] };
function rushCount(cov, pressure) { return pressure ? PRESSURES[pressure].rush : cov === "cover-0" ? 6 : 4; }

// Box defenders by coverage in the base picture (nickel vs 11 personnel).
// The box: defenders aligned between the tackles plus a one-yard margin (OL spans x 40-60) and within 6 yards of the
// line. Counted from the same alignment that gets drawn, so the number always matches the diagram.
function boxCount(cov, ctx) {
  const defs = [...dlFor(ctx.front), ...adjustDefs(lookById(cov), ctx)];
  return defs.filter(([, x, y]) => x >= 36 && x <= 64 && y <= 6).length;
}
function blockerCount(playId, ctx) {
  let b = 5 + (ctx.form === "twoBack" ? 2 : 0);
  if (QB_READ.includes(playId)) b += 1;
  return b;
}

// Which formations each play can be called from.
const RUNS_NO_EMPTY = ["doubles", "trips", "bunch", "twoBack"];
const SPREAD = ["doubles", "trips", "bunch", "empty"];
const FROM_TWO_BACK = ["boot", "yankee", "flood", "curlFlat", "smash", "slantFlat", "stick", "dagger", "drive", "levels", "postWheel"];
function playForms(playId) {
  const p = PLAYS[playId];
  if (["qbDraw", "qbPower"].includes(playId)) return FORM_ORDER;
  if (p.type === "Run" || playId === "rbScreen") return RUNS_NO_EMPTY;
  if (p.type === "RPO") return ["doubles", "trips", "bunch"];
  if (playId === "tunnel") return SPREAD;
  return FROM_TWO_BACK.includes(playId) ? FORM_ORDER : SPREAD;
}

const PROTECTIONS = [["standard", "Standard"], ["slide", "Slide"], ["max", "Max protect"], ["hot", "Hot (throw quick)"]];
const PROT_INFO = {
  standard: "Five linemen plus the back: six blockers.",
  slide: "The line slides toward the pressure side. Helps against edge blitzes.",
  max: "Keep an extra blocker in: seven blockers, one fewer receiver.",
  hot: "Get the ball out on the quick throw. Beats a free rusher, but gives up the deep routes."
};

function grade(playId, covId, sitText, ctx = {}) {
  const look = lookById(covId), p = PLAYS[playId], meta = PMETA[playId], sit = parseSit(sitText);
  const rec = look.calls.find(c => c[0] === playId);
  const weak = (WEAK_CALLS[covId] || {})[playId];
  let score, why;
  if (rec) { score = 3; why = rec[2]; }
  else if (weak) { score = weak[0]; why = weak[1]; }
  else {
    score = 2;
    why = p.type === "Run"
      ? `A reasonable run, but ${look.name} doesn't give you a clear numbers advantage for it.`
      : `It can work, but it doesn't attack the weak spots of ${look.name}.`;
  }
  const mods = [], flags = {};
  const add = (d, t) => mods.push({ d, t });
  const isRun = p.type === "Run";
  const isPassy = !isRun;
  const isQuick = QUICK.includes(playId) || p.type === "Screen";
  // Situation
  if (sit.dist >= 7 && sit.down >= 3) {
    if (isRun && !["draw", "qbDraw"].includes(playId)) add(-1, `On ${sit.down === 3 ? "3rd" : "4th"} & ${sit.dist}, a run rarely gets to the first-down marker.`);
    else if (!isRun && meta.d < sit.dist - 1 && ctx.prot !== "hot") add(-1, `Its main throw lands around ${meta.d} yards, short of the ${sit.dist} you need.`);
  }
  if (sit.dist <= 2 && meta.slow) add(-1, `You only need ${sit.dist}. A slow-developing concept wastes a high-percentage down.`);
  if (sit.redzone && meta.d >= 14) add(-1, "Inside the 20 there's little room behind the defense for deep concepts.");
  // Run game: numbers and front
  if (isRun && playId !== "qbDraw" && playId !== "draw") {
    const box = boxCount(covId, ctx), blk = blockerCount(playId, ctx), un = box - blk;
    if (un <= 0) add(1, `Light box: ${box} defenders near the ball against ${blk} blockers.`);
    else if (un >= 2) add(-1, `Loaded box: ${box} defenders against ${blk} blockers. Someone is unblocked.`);
  }
  if (isRun && ctx.front) {
    const fm = (FRONT_MODS[ctx.front] || {})[playId];
    if (fm) add(fm, FRONT_WHY[ctx.front][fm < 0 ? 0 : 1] || `The ${FRONTS[ctx.front].name} front affects this run.`);
  }
  // Pressure and protection
  const rush = rushCount(covId, ctx.pressure);
  const pr = ctx.pressure ? PRESSURES[ctx.pressure] : null;
  if (isPassy) {
    const prot = ctx.prot || "standard";
    let cap = prot === "max" ? 7 : 6;
    if (ctx.form === "empty") cap -= 1;
    if (ctx.form === "twoBack") cap += 1;
    const effRush = rush - (prot === "slide" && pr && pr.edge ? 1 : 0);
    const unblocked = effRush - cap;
    if (prot === "hot" && !isQuick) {
      if (rush >= 5) add(1, "Hot throw: the ball is out before the free rusher gets home.");
      else add(-1, `Only ${rush} rushed. Throwing hot cut off the deeper routes for nothing.`);
    } else if (unblocked > 0) {
      if (isQuick || p.type === "RPO") add(1, `${rush} rushers, but the ball comes out before they get home.`);
      else { add(-1, `${rush} rushers against ${cap} blockers. Someone is unblocked.`); flags.unblocked = true; }
    } else if (pr && !pr.sim && prot === "max" && meta.slow) {
      add(1, "Max protect picked up the blitz, and fewer defenders are left in coverage.");
    }
    if (prot === "max" && rush === 4 && !isQuick) add(-1, pr && pr.sim ? "It was a simulated pressure: only 4 rushed. Max protect left 3 receivers against 7 in coverage." : "Only 4 rushed. Max protect took a receiver out of the play for no reason.");
    if (prot === "slide" && pr && pr.edge && unblocked <= 0 && !isQuick) add(1, "Sliding to the nickel's side picked up the edge pressure.");
    if (ctx.form === "bunch" && ["cover-1", "cover-0", "two-man"].includes(covId) && prot !== "hot") add(1, "Bunch alignment creates natural rubs against man coverage.");
  } else if (rush >= 5 && ["draw", "qbDraw"].includes(playId)) {
    add(1, "Blitzers run themselves past the draw.");
  }
  const total = mods.reduce((a, m) => a + m.d, 0);
  const final = Math.max(0, Math.min(3, score + total));
  return { score: final, base: score, why, mods, flags };
}

// Rebuild a play's routes from its home formation into another formation.
function remapPlay(play, form) {
  if (!form || form === play.f) return play;
  const home = FORMS[play.f], to = FORMS[form];
  const r = play.r.map(rt => {
    if (!rt.p) return rt;
    const a = home[rt.p], b = to[rt.p];
    if (!a || !b) return rt;
    const flip = (a[0] - 50) * (b[0] - 50) < 0 && !["QB", "RB"].includes(rt.p);
    const pts = rt.pts.map(([x, y]) => {
      let dx = x - a[0]; if (flip) dx = -dx;
      return [Math.max(2, Math.min(98, b[0] + dx)), b[1] + (y - a[1])];
    });
    return { ...rt, pts };
  });
  return { ...play, f: form, r };
}

