// ================= ROUTE TREE, CONCEPT INFERENCE AND CUSTOM PLAYS =================
// Coordinates match the rest of the app: x 0-100 across the field (1 unit = half a yard), y = yards from the line.

const MY_KEY = "pc-myplays-v1";
const clampX = x => Math.max(3, Math.min(97, Math.round(x * 2) / 2));
const r05 = y => Math.round(y * 2) / 2;
const mk = pts => pts.map(([x, y]) => [clampX(x), r05(y)]);

// f(x, o, y0): x = the player's start x, o = +1 if the sideline is to his right and -1 if to his left, y0 = start depth.
const ROUTE_TREE = [
  { id: "hitch",    grp: "Quick",        name: "Hitch (5)",          f: (x, o) => [[x, 5], [x - o * 2, 4.5]] },
  { id: "slant",    grp: "Quick",        name: "Slant",              f: (x, o) => [[x, 2], [x - o * 12, 7]] },
  { id: "flat",     grp: "Quick",        name: "Flat",               f: (x, o) => [[x + o * 16, 2.5]] },
  { id: "bubble",   grp: "Quick",        name: "Bubble (behind the line)", f: (x, o) => [[x + o * 8, -1.5], [x + o * 14, -1]] },
  { id: "quickOut", grp: "Quick",        name: "Quick out (5)",      f: (x, o) => [[x, 5], [x + o * 10, 5]] },
  { id: "stick",    grp: "Quick",        name: "Stick (6)",          f: (x, o) => [[x, 6], [x - o * 3, 6]] },
  { id: "drag",     grp: "Crossers",     name: "Drag / shallow cross", f: (x, o) => [[x - o * 4, 3], [x - o * 60, 3.5]] },
  { id: "deepCross", grp: "Crossers",    name: "Deep cross (12)",    f: (x, o) => [[x, 12], [x - o * 40, 13]] },
  { id: "dig",      grp: "Intermediate", name: "Dig / in (12)",      f: (x, o) => [[x, 12], [x - o * 26, 12]] },
  { id: "curl",     grp: "Intermediate", name: "Curl (11)",          f: (x, o) => [[x, 11], [x - o * 3, 9.5]] },
  { id: "comeback", grp: "Intermediate", name: "Comeback (13)",      f: (x, o) => [[x, 13], [x + o * 3, 10.5]] },
  { id: "out",      grp: "Intermediate", name: "Out (10)",           f: (x, o) => [[x, 10], [x + o * 16, 10]] },
  { id: "post",     grp: "Deep",         name: "Post",               f: (x, o) => [[x, 10], [x - o * 12, 22]] },
  { id: "corner",   grp: "Deep",         name: "Corner",             f: (x, o) => [[x, 10], [x + o * 12, 20]] },
  { id: "seam",     grp: "Deep",         name: "Seam",               f: (x, o) => [[x, 8], [x - o * 4, 23]] },
  { id: "go",       grp: "Deep",         name: "Go / vertical",      f: (x, o) => [[x, 23]] },
  { id: "fade",     grp: "Deep",         name: "Fade",               f: (x, o) => [[x + o * 5, 23]] },
  { id: "sluggo",   grp: "Double moves", name: "Slant-and-go",       f: (x, o) => [[x, 2], [x - o * 6, 5], [x - o * 8, 22]] },
  { id: "outUp",    grp: "Double moves", name: "Out-and-up",         f: (x, o) => [[x, 8], [x + o * 8, 8], [x + o * 10, 22]] },
  { id: "swing",    grp: "Backs",        name: "Swing",              f: (x, o) => [[x + o * 8, -4], [x + o * 22, 1]] },
  { id: "angle",    grp: "Backs",        name: "Angle",              f: (x, o) => [[x + o * 3, 2], [x - o * 10, 7]] },
  { id: "wheel",    grp: "Backs",        name: "Wheel",              f: (x, o) => [[x + o * 24, 1.5], [x + o * 28, 18]] },
  { id: "block",    grp: "Other",        name: "Block / stay in",    t: "block", f: (x, o, y0) => [[x, y0 < -2 ? y0 + 2.5 : 1.5]] }
];
const ROUTE_BY_ID = Object.fromEntries(ROUTE_TREE.map(r => [r.id, r]));
// Roles that have no route list in a given mode are fixed by the scheme.
const RUN_IDS = ["iz", "oz", "duo", "power", "counter", "trap", "toss", "jetSweep", "zoneRead", "qbPower", "draw", "qbDraw"];
const RPO_TAGS = ["bubble", "flat", "hitch", "slant", "stick"];

const sideOf = (f, role) => (FORMS[f][role][0] < 50 ? -1 : 1);
const rolesOf = f => Object.keys(FORMS[f]).filter(k => Array.isArray(FORMS[f][k]));
const skillRoles = f => rolesOf(f).filter(k => k !== "QB");
const roleLabel = (f, k) => (FORMS[f].labels && FORMS[f].labels[k]) || k;

function routePts(kind, f, role) {
  const [x, y0] = FORMS[f][role], rt = ROUTE_BY_ID[kind];
  return mk(rt.f(x, sideOf(f, role), y0));
}
function routeAssign(kind, f, role) {
  const rt = ROUTE_BY_ID[kind];
  return { k: kind, pts: routePts(kind, f, role), t: rt.t || "route", dragged: false };
}

// ---------- Drafts ----------
const PA_DEFAULT = { X: "go", H: "dig", Y: "out", Z: "go", RB: "flat" };
function blankDraft(mode, f) {
  const d = { id: null, name: "", mode, f, scheme: "iz", roll: "drop", assign: {}, ol: [] };
  return resetDraft(d);
}
function resetDraft(d) {
  d.assign = {}; d.ol = [];
  const f = d.f, roles = skillRoles(f);
  if (d.mode === "pass") {
    const def = { X: "go", H: "out", Y: "out", Z: "go", RB: "swing" };
    for (const r of roles) d.assign[r] = routeAssign(def[r] || "out", f, r);
    if (!d.assign.RB && roles.includes("RB")) d.assign.RB = routeAssign("block", f, "RB");
  } else if (d.mode === "pa") {
    d.roll = "drop";
    for (const r of roles) d.assign[r] = routeAssign(PA_DEFAULT[r] || "out", f, r);
    paBackfield(d);
  } else {
    if (d.mode === "rpo" && !RUN_IDS.includes(d.scheme)) d.scheme = "iz";
    applyScheme(d, d.scheme || "iz");
  }
  return d;
}
function paBackfield(d) {
  const f = d.f;
  if (FORMS[f].RB) {
    const [rx, ry] = FORMS[f].RB, o = rx < 50 ? -1 : 1;
    d.assign.RB = { k: "fake", pts: mk([[rx - o * 8, ry + 2], [rx - o * 13, ry + 5]]), t: "fake", dragged: false };
  }
  delete d.assign.QB;
  if (d.roll !== "drop") {
    const [qx, qy] = FORMS[f].QB, o = d.roll === "right" ? 1 : -1;
    d.assign.QB = { k: "roll", pts: mk([[qx - o * 4, qy - 1], [qx + o * 17, qy]]), t: "option", dragged: false };
  }
}
// Copy a built-in run play's backfield and line blocking into the draft.
function applyScheme(d, scheme) {
  d.scheme = scheme;
  const base = remapPlay(PLAYS[scheme], d.f);
  const keep = {};
  for (const r of skillRoles(d.f)) if (d.assign[r] && d.assign[r].k !== "block" && d.assign[r].t === "route" && d.mode === "rpo") keep[r] = d.assign[r];
  d.assign = {}; d.ol = [];
  for (const rt of base.r) {
    if (rt.ol !== undefined) { d.ol.push({ ol: rt.ol, pts: rt.pts, t: "block" }); continue; }
    if (!FORMS[d.f][rt.p]) continue;
    const t = rt.t || "route";
    d.assign[rt.p] = { k: t === "route" ? "go" : t, pts: rt.pts, t: t === "route" ? "route" : t, dragged: false, scheme: true };
  }
  for (const r of skillRoles(d.f)) {
    if (!d.assign[r]) d.assign[r] = routeAssign("block", d.f, r);
    else if (r !== "RB" && d.assign[r].t === "route") d.assign[r] = routeAssign(d.mode === "rpo" ? "block" : "go", d.f, r);
  }
  if (d.mode === "rpo") {
    const tagRole = FORMS[d.f].H ? "H" : skillRoles(d.f).find(r => !["RB"].includes(r));
    d.assign[tagRole] = keep[tagRole] || routeAssign("bubble", d.f, tagRole);
  }
  return d;
}
function changeMode(d, mode) { d.mode = mode; if (mode === "run" && !RUN_IDS.includes(d.scheme)) d.scheme = "iz"; return resetDraft(d); }

// Move a draft to another formation, keeping what the player drew where we can.
function changeFormation(d, nf) {
  const old = d.f;
  if (old === nf) return d;
  const ok = {};
  for (const [role, a] of Object.entries(d.assign)) {
    if (!FORMS[nf][role]) continue;
    const oa = FORMS[old][role], na = FORMS[nf][role];
    if (!a.dragged && ROUTE_BY_ID[a.k] && role !== "QB") { ok[role] = { ...routeAssign(a.k, nf, role), scheme: a.scheme }; continue; }
    const flip = (oa[0] - 50) * (na[0] - 50) < 0 && !["QB", "RB"].includes(role);
    ok[role] = { ...a, pts: mk(a.pts.map(([x, y]) => { let dx = x - oa[0]; if (flip) dx = -dx; return [na[0] + dx, na[1] + (y - oa[1])]; })) };
  }
  d.f = nf;
  if (d.mode === "run" || d.mode === "rpo") { d.assign = ok; return applyScheme(d, d.scheme); }
  for (const r of skillRoles(nf)) if (!ok[r]) ok[r] = routeAssign(d.mode === "pa" ? (PA_DEFAULT[r] || "out") : "block", nf, r);
  d.assign = ok;
  if (d.mode === "pa") paBackfield(d);
  return d;
}

function draftRoutes(d) {
  const r = [];
  for (const role of rolesOf(d.f)) {
    const a = d.assign[role];
    if (a && a.pts && a.pts.length) r.push({ p: role, pts: a.pts, t: a.t || "route" });
  }
  for (const o of d.ol) r.push(o);
  return r;
}

// ---------- Concept inference ----------
// Each receiver's route becomes a token: depth band + direction, so plays can be compared without knowing names.
function fingerprint(play) {
  const f = FORMS[play.f], toks = [];
  for (const r of play.r) {
    if (!r.p || r.p === "QB" || (r.t && r.t !== "route")) continue;
    const st = f[r.p]; if (!st) continue;
    const o = st[0] < 50 ? -1 : 1, last = r.pts[r.pts.length - 1];
    const maxY = Math.max(...r.pts.map(p => p[1]));
    const dx = (last[0] - st[0]) * o;
    const band = maxY <= 4.5 ? "S" : maxY <= 8.5 ? "M" : maxY <= 14 ? "I" : "D";
    const dir = band === "S" && Math.abs(dx) >= 30 ? "X" : Math.abs(dx) < 6 ? "V" : dx > 0 ? "O" : "N";
    toks.push(band + dir);
  }
  return toks;
}
function similarity(a, b) {
  if (!a.length || !b.length) return 0;
  const pool = b.slice(); let hit = 0;
  for (const t of a) { const i = pool.indexOf(t); if (i >= 0) { hit++; pool.splice(i, 1); } }
  return hit / Math.max(a.length, b.length);
}
let CONCEPT_FP = null;
function conceptFPs() {
  if (!CONCEPT_FP) {
    CONCEPT_FP = [];
    for (const [id, p] of Object.entries(PLAYS)) {
      if (p.custom || p.type === "Run" || p.type === "RPO") continue;
      CONCEPT_FP.push([id, fingerprint(p)]);
    }
  }
  return CONCEPT_FP;
}
// Returns { id, match } where id is a built-in play to grade against (or null).
function inferConcept(d) {
  if (d.mode === "run") return { id: d.scheme, match: 1, why: "run scheme" };
  if (d.mode === "rpo") {
    const tag = Object.entries(d.assign).find(([role, a]) => role !== "RB" && role !== "QB" && a.t === "route" && ROUTE_BY_ID[a.k] && a.k !== "block");
    const tagKind = tag ? tag[1].k : null;
    const k = tagKind || "bubble";
    return { id: ["slant", "stick"].includes(k) ? "rpoGlance" : "rpoBubble", match: 1, why: "run-pass option" };
  }
  const play = { f: d.f, r: draftRoutes(d) };
  const mine = fingerprint(play);
  if (d.mode === "pa") {
    if (d.roll !== "drop") return { id: "boot", match: 1, why: "play-action with a rollout" };
    const deep = mine.filter(t => t[0] === "D").length;
    if (deep >= 2) return { id: "yankee", match: 1, why: "play-action with deep shots" };
  }
  let best = { id: null, match: 0 };
  for (const [id, fp] of conceptFPs()) {
    const m = similarity(mine, fp);
    if (m > best.match + 1e-9) best = { id, match: m };
  }
  return best.match >= 0.6 ? { ...best, why: "route combination" } : { id: null, match: best.match, why: "no close match" };
}

// ---------- Custom plays ----------
let MY_PLAYS = [];
function loadMyPlays() {
  try { const a = JSON.parse(localStorage.getItem(MY_KEY) || "[]"); MY_PLAYS = Array.isArray(a) ? a.filter(validDraft) : []; } catch (e) { MY_PLAYS = []; }
  MY_PLAYS.forEach(registerCustom);
  syncMyGroup();
}
function saveMyPlays() { try { localStorage.setItem(MY_KEY, JSON.stringify(MY_PLAYS)); } catch (e) {} }
function validDraft(d) {
  return d && typeof d.id === "string" && typeof d.name === "string" && FORMS[d.f] && ["pass", "run", "rpo", "pa"].includes(d.mode) && d.assign && typeof d.assign === "object";
}
function depthOf(d) {
  const ds = [];
  for (const [role, a] of Object.entries(d.assign)) {
    if (a.t !== "route" || role === "QB" || a.k === "block") continue;
    ds.push(Math.max(...a.pts.map(p => p[1])));
  }
  ds.sort((a, b) => b - a);
  return ds.length ? Math.max(2, Math.min(22, Math.round(ds[Math.floor(ds.length / 2)]))) : 5;
}
const MODE_NAME = { pass: "Pass", run: "Run", rpo: "RPO", pa: "Play-action" };
function registerCustom(d) {
  const c = inferConcept(d);
  const known = c.id && PLAYS[c.id] && !PLAYS[c.id].custom ? c.id : null;
  const type = d.mode === "run" ? "Run" : d.mode === "rpo" ? "RPO" : "Pass";
  const dep = depthOf(d);
  const meta = known && PMETA[known] ? { ...PMETA[known] } : { d: type === "Run" ? 4 : dep, slow: dep >= 14 || (d.mode === "pa" && dep >= 10) ? 1 : undefined };
  PLAYS[d.id] = {
    name: d.name || "Untitled", type, f: d.f, diff: "Custom", custom: true, mode: d.mode, concept: known,
    desc: known ? `Your ${MODE_NAME[d.mode].toLowerCase()} design. It reads like ${PLAYS[known].name}, so it's graded the same way.`
                : `Your ${MODE_NAME[d.mode].toLowerCase()} design. It doesn't match a known concept closely, so it's graded as a general play.`,
    read: known ? PLAYS[known].read : "Pick the defender your routes put in conflict and throw away from him.",
    r: draftRoutes(d)
  };
  PMETA[d.id] = meta;
  CONCEPT_FP = null;
  return PLAYS[d.id];
}
function unregisterCustom(id) { delete PLAYS[id]; delete PMETA[id]; CONCEPT_FP = null; }
function syncMyGroup() {
  const i = PB_GROUPS.findIndex(g => g[0] === "My plays");
  const ids = MY_PLAYS.map(p => p.id);
  if (i >= 0) { if (ids.length) PB_GROUPS[i][1] = ids; else PB_GROUPS.splice(i, 1); }
  else if (ids.length) PB_GROUPS.push(["My plays", ids]);
}
function saveDraft(d) {
  const copy = JSON.parse(JSON.stringify(d));
  if (!copy.id) copy.id = "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const i = MY_PLAYS.findIndex(p => p.id === copy.id);
  if (i >= 0) MY_PLAYS[i] = copy; else MY_PLAYS.push(copy);
  registerCustom(copy); syncMyGroup(); saveMyPlays();
  return copy;
}
function deleteMyPlay(id) {
  MY_PLAYS = MY_PLAYS.filter(p => p.id !== id);
  unregisterCustom(id); syncMyGroup(); saveMyPlays();
  if (typeof sheetRemovePlay === "function") sheetRemovePlay(id);
}
