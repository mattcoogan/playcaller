// ================= PLAY SHEET: build it, score it, then play it =================
const SHEET_KEY = "pc-sheet-v1";
const SLOTS = 4, SCRIPT_N = 10;
const BUCKETS = [
  { id: "b1",  name: "1st & 10",       sit: "1st & 10, own 35" },
  { id: "b2s", name: "2nd & short",    sit: "2nd & 2, own 45" },
  { id: "b2l", name: "2nd & long",     sit: "2nd & 8, own 40" },
  { id: "b3s", name: "3rd & short",    sit: "3rd & 2, own 45" },
  { id: "b3m", name: "3rd & medium",   sit: "3rd & 5, own 45" },
  { id: "b3l", name: "3rd & long",     sit: "3rd & 9, own 38" },
  { id: "red", name: "Red zone",       sit: "2nd & 6, opp 14" }
];
const COV_SHORT = { "cover-3": "C3", "cover-2": "C2", "tampa-2": "T2", "cover-4": "C4", "cover-6": "C6", "cover-1": "C1", "cover-0": "C0", "two-man": "2M" };
const COV_IDS = Object.keys(COV_SHORT);
const TIER_ABBR = ["Bad", "Risk", "Good", "Great"];
const TIER_2 = ["Bd", "Rk", "Gd", "Gr"];

let SHEET = emptySheet();
function emptySheet() {
  const slots = {}; BUCKETS.forEach(b => slots[b.id] = Array(SLOTS).fill(null));
  return { slots, script: Array(SCRIPT_N).fill(null) };
}
function cleanSheet(raw) {
  const s = emptySheet();
  if (!raw || typeof raw !== "object") return s;
  for (const b of BUCKETS) {
    const a = raw.slots && raw.slots[b.id];
    if (Array.isArray(a)) for (let i = 0; i < SLOTS; i++) s.slots[b.id][i] = typeof a[i] === "string" && PLAYS[a[i]] ? a[i] : null;
  }
  if (Array.isArray(raw.script)) for (let i = 0; i < SCRIPT_N; i++) s.script[i] = typeof raw.script[i] === "string" && PLAYS[raw.script[i]] ? raw.script[i] : null;
  return s;
}
function loadSheet() { try { SHEET = cleanSheet(JSON.parse(localStorage.getItem(SHEET_KEY) || "null")); } catch (e) { SHEET = emptySheet(); } }
function saveSheet() { try { localStorage.setItem(SHEET_KEY, JSON.stringify(SHEET)); } catch (e) {} }
function sheetRemovePlay(id) {
  for (const b of BUCKETS) SHEET.slots[b.id] = SHEET.slots[b.id].map(x => x === id ? null : x);
  SHEET.script = SHEET.script.map(x => x === id ? null : x);
  saveSheet();
}
const sheetCount = () => BUCKETS.reduce((n, b) => n + SHEET.slots[b.id].filter(Boolean).length, 0);

// Which sheet bucket a game situation falls in, and which kind of call the DC expects there.
function bucketFor(down, dist, ball) {
  if (ball >= 80) return BUCKETS[6];
  if (down === 1) return BUCKETS[0];
  if (down === 2) return dist <= 3 ? BUCKETS[1] : BUCKETS[2];
  return dist <= 3 ? BUCKETS[3] : dist <= 6 ? BUCKETS[4] : BUCKETS[5];
}
function sheetHas(bid, id, snapIdx) {
  return SHEET.slots[bid].includes(id) || SHEET.script[snapIdx] === id;
}
const bestForm = id => { const fs = playForms(id); return fs.includes("doubles") ? "doubles" : fs[0]; };
const sitCat = text => { const s = parseSit(text); const ball = /opp (\d+)/.test(text) ? 100 - +text.match(/opp (\d+)/)[1] : 40;
  return s.dist <= 2 ? "short" : ball >= 80 ? "red" : ((s.down >= 3 && s.dist >= 7) || (s.down === 2 && s.dist >= 10)) ? "long" : "early"; };
function covWeight(cov, cat) { return (DC_BASE[cat][cov] || 0) * ((DC_LEVEL[state.level] || {})[cov] || 1); }

// ---------- Scoring ----------
function scoreBucket(b) {
  const ids = SHEET.slots[b.id].filter(Boolean), cat = sitCat(b.sit);
  let tot = 0, wsum = 0;
  const cells = COV_IDS.map(cov => {
    const w = covWeight(cov, cat); wsum += w;
    let best = -1, bid = null;
    for (const id of ids) {
      const g = grade(id, cov, b.sit, { form: bestForm(id), front: "over", pressure: null, prot: "standard" });
      if (g.score > best) { best = g.score; bid = id; }
    }
    if (best >= 0) tot += w * best;
    return { cov, w, best, id: bid };
  });
  return { b, filled: ids.length, score: wsum ? tot / wsum : 0, cells, wsum };
}
function scoreSheet() {
  const rows = BUCKETS.map(scoreBucket);
  const pct = rows.reduce((a, r) => a + r.score, 0) / (rows.length * 3);
  const notes = [];
  const empties = rows.filter(r => !r.filled);
  if (empties.length) notes.push(["bad", `Empty: ${empties.map(r => r.b.name).join(", ")}. In a game you'd have to call off the sheet there (−1 on the grade).`]);
  for (const r of rows) {
    if (!r.filled) continue;
    const holes = r.cells.filter(c => c.w / r.wsum >= 0.1 && c.best <= 1);
    if (holes.length) notes.push(["warn", `${r.b.name} has no good answer to ${holes.map(c => lookById(c.cov).name).slice(0, 3).join(", ")}${holes.length > 3 ? " and more" : ""}.`]);
    const ids = SHEET.slots[r.b.id].filter(Boolean);
    const types = ids.map(id => PLAYS[id].type === "Run" ? "run" : "pass");
    if (ids.length >= 3 && types.every(t => t === types[0])) notes.push(["warn", `Every call in ${r.b.name} is a ${types[0]}. The DC will scout that and sit on it.`]);
    const cs = ids.map(cidOf); if (new Set(cs).size < cs.length) notes.push(["warn", `Two slots in ${r.b.name} are the same concept, which wastes a slot.`]);
  }
  const all = BUCKETS.flatMap(b => SHEET.slots[b.id].filter(Boolean));
  if (all.length) {
    const runs = all.filter(id => PLAYS[id].type === "Run" || PLAYS[id].type === "RPO").length;
    if (!runs) notes.push(["warn", "There are no runs or RPOs on your sheet, so the defense can drop eight into coverage every snap."]);
    if (runs === all.length) notes.push(["warn", "There are no dropback passes on your sheet."]);
  }
  return { rows, pct, notes: notes.slice(0, 7), filled: sheetCount() };
}
function letterFor(p) { return p >= 0.85 ? "A" : p >= 0.75 ? "B" : p >= 0.65 ? "C" : p >= 0.5 ? "D" : "F"; }

function scoreScript() {
  const ids = SHEET.script.filter(Boolean), notes = [];
  if (ids.length < 5) return { pct: 0, notes: [["bad", "Script at least 5 plays to get a read on it."]], n: ids.length };
  const runs = ids.filter(id => PLAYS[id].type === "Run" || PLAYS[id].type === "RPO").length;
  const share = runs / ids.length;
  let pts = 0;
  if (share >= 0.3 && share <= 0.6) pts += 1; else notes.push(["warn", `${Math.round(share * 100)}% of your script is runs. Aim for roughly 30 to 60% so the defense can't sit on one side of the ball.`]);
  const cs = ids.map(cidOf), dup = cs.length - new Set(cs).size;
  if (dup === 0) pts += 1; else notes.push(["warn", `${dup} repeated concept${dup === 1 ? "" : "s"}. A scouting DC adjusts to what he has already seen.`]);
  const shots = ids.filter(id => (PMETA[id] || {}).d >= 14).length;
  if (shots >= 1 && shots <= 3) pts += 1; else notes.push(["warn", shots ? "More than three deep shots in the script is a lot of risk." : "No shot play in the script. Take one early to make the box and the safeties honest."]);
  const quick = ids.slice(0, 3).filter(id => QUICK.includes(cidOf(id))).length;
  if (quick >= 1) pts += 1; else notes.push(["warn", "Open with at least one quick, high-percentage call to get the QB in rhythm."]);
  return { pct: pts / 4, notes, n: ids.length };
}

// ---------- Scouting memory (used by the Drive Sim) ----------
function scoutRecord(scout, bid, id) { (scout[bid] = scout[bid] || {})[id] = (scout[bid][id] || 0) + 1; }
function scoutN(scout, bid) { return Object.values(scout[bid] || {}).reduce((a, c) => a + c, 0); }

// ---------- Export / import ----------
function exportAll() {
  const data = { app: "playcaller", v: 1, plays: MY_PLAYS, sheet: SHEET };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "playcaller-playbook.json"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  SH.msg = "Exported your playbook and sheet."; labMsg(SH.msg); sheetRender();
}
function importPrompt() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
  inp.addEventListener("change", () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { importData(JSON.parse(rd.result)); } catch (e) { SH.msg = "That file couldn't be read as a playbook."; labMsg(SH.msg); sheetRender(); } };
    rd.readAsText(f);
  });
  inp.click();
}
function importData(o) {
  if (!o || o.app !== "playcaller" || !Array.isArray(o.plays)) throw new Error("bad file");
  let n = 0;
  for (const raw of o.plays) {
    if (!validDraft(raw)) continue;
    const d = JSON.parse(JSON.stringify(raw)); d.id = String(d.id).replace(/[^\w-]/g, "").slice(0, 24) || "u_" + Date.now().toString(36);
    if (!d.id.startsWith("u_")) d.id = "u_" + d.id;
    d.name = String(d.name).slice(0, 30);
    const i = MY_PLAYS.findIndex(p => p.id === d.id);
    if (i >= 0) MY_PLAYS[i] = d; else MY_PLAYS.push(d);
    try { registerCustom(d); n++; } catch (e) { MY_PLAYS = MY_PLAYS.filter(p => p.id !== d.id); }
  }
  syncMyGroup(); saveMyPlays();
  if (o.sheet) { SHEET = cleanSheet(o.sheet); saveSheet(); }
  SH.msg = `Imported ${n} play${n === 1 ? "" : "s"}${o.sheet ? " and the sheet" : ""}.`;
  labMsg(SH.msg); if (typeof labRender === "function" && LAB.started) labRender(); sheetRender();
}
function labMsg(t) { LAB.msg = t; }

// ---------- UI ----------
const SH = { view: "grid", pick: null, sel: null, filter: "all", msg: "" };
const SH_FILTERS = [["all", "All"], ["Pass", "Pass"], ["Run", "Run"], ["RPO", "RPO / screen"], ["mine", "Mine"]];

function pickTarget() {
  if (!SH.pick) return null;
  return SH.pick.kind === "slot"
    ? { label: `${BUCKETS.find(b => b.id === SH.pick.bid).name}, slot ${SH.pick.idx + 1}`, sit: BUCKETS.find(b => b.id === SH.pick.bid).sit, cur: SHEET.slots[SH.pick.bid][SH.pick.idx] }
    : { label: `Script play ${SH.pick.idx + 1}`, sit: "1st & 10, own 25", cur: SHEET.script[SH.pick.idx] };
}
function slotBtn(kind, bid, idx, id) {
  const on = SH.pick && SH.pick.kind === kind && SH.pick.idx === idx && (kind === "script" || SH.pick.bid === bid);
  const p = id && PLAYS[id];
  return `<button type="button" class="slot${on ? " on" : ""}${p ? "" : " empty"}" data-kind="${kind}" data-bid="${bid}" data-idx="${idx}">${
    p ? `<b>${esc(p.name)}</b><span class="chip t-${p.type}">${p.type}</span>` : `<span class="mstat">+ Add play</span>`}</button>`;
}
function chooserHTML() {
  const t = pickTarget(); if (!t) return "";
  const ids = Object.keys(PLAYS).filter(id => {
    const p = PLAYS[id];
    if (SH.filter === "all") return true;
    if (SH.filter === "mine") return p.custom;
    if (SH.filter === "RPO") return p.type === "RPO" || p.type === "Screen";
    return p.type === SH.filter;
  });
  const groups = PB_GROUPS.map(([g, list]) => [g, list.filter(id => ids.includes(id))]).filter(([, l]) => l.length);
  const sel = SH.sel && PLAYS[SH.sel] ? SH.sel : null;
  let prev = "";
  if (sel) {
    const p = PLAYS[sel];
    const chips = COV_IDS.map(cov => { const g = grade(sel, cov, t.sit, { form: bestForm(sel), front: "over", pressure: null, prot: "standard" });
      return `<span class="hm hm-${g.score}" title="${esc(g.why)}">${COV_SHORT[cov]} ${TIER_ABBR[g.score]}</span>`; }).join("");
    prev = `<div class="preview">${playSVG(p, bestForm(sel))}<div>
      <div class="chips" style="margin:0"><span class="chip t-${p.type}">${p.type}</span>${p.custom ? `<span class="chip">Mine</span>` : ""}</div>
      <h3 style="margin-top:6px">${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      <p class="mstat" style="margin-top:8px">Grade vs each coverage in ${esc(t.sit.split(",")[0])}:</p><div class="hm-row">${chips}</div>
      <div class="tools" style="margin-top:10px"><button type="button" class="primary" data-act="put">Put on sheet</button>
        ${t.cur ? `<button type="button" class="ghost" data-act="clear">Clear slot</button>` : ""}<button type="button" class="ghost" data-act="cancel">Cancel</button></div></div></div>`;
  }
  return `<div class="chooser"><h3>Choose a play for ${esc(t.label)}</h3>
    ${segHTML("sh-filter", SH_FILTERS, SH.filter, "Show")}
    ${groups.map(([g, list]) => `<div class="pb-group"><h4>${esc(g)}</h4><div class="opts">${list.map(id => `<button type="button" class="opt${SH.sel === id ? " picked" : ""}${t.cur === id ? " best" : ""}" data-play="${id}">${esc(PLAYS[id].name)}</button>`).join("")}</div></div>`).join("") || `<p class="mstat">Nothing matches. ${SH.filter === "mine" ? "Draw a play in the Play Lab first." : ""}</p>`}
    ${prev || `<div class="tools"><button type="button" class="ghost" data-act="cancel">Cancel</button>${t.cur ? `<button type="button" class="ghost" data-act="clear">Clear slot</button>` : ""}</div>`}</div>`;
}
function sheetMainHTML() {
  const rows = SH.view === "grid"
    ? `<div class="buckets">${BUCKETS.map(b => `<div class="bucket"><h3>${esc(b.name)}</h3><span class="mstat">${esc(b.sit)}</span>
        <div class="slots">${SHEET.slots[b.id].map((id, i) => slotBtn("slot", b.id, i, id)).join("")}</div></div>`).join("")}</div>`
    : `<p class="mstat">The first plays you call on a drive. In the game, each snap of a drive can be called from the script as well as from the situation slots.</p>
       <div class="slots script">${SHEET.script.map((id, i) => `<div class="sn"><span class="mstat">${i + 1}</span>${slotBtn("script", "", i, id)}</div>`).join("")}</div>`;
  return `<div class="sit"><span class="sit-label">Play Sheet</span><strong>Build your call sheet</strong></div>
    <p style="margin:0;max-width:65ch">Fill the slots for each situation. You only get ${SLOTS} per situation, so every slot has to earn its place. Then play drives against a defense that scouts what you call.</p>
    ${segHTML("sh-view", [["grid", "By situation"], ["script", "Opening script"]], SH.view, "View")}
    ${SH.msg ? `<p class="banner">${esc(SH.msg)}</p>` : ""}
    ${rows}${chooserHTML()}`;
}
function heatHTML(sc) {
  return `<div class="tbl-wrap"><table class="heat"><thead><tr><th></th>${COV_IDS.map(c => `<th title="${esc(lookById(c).name)}">${COV_SHORT[c]}</th>`).join("")}</tr></thead><tbody>${
    sc.rows.map(r => `<tr><th>${esc(r.b.name)}</th>${r.cells.map(c => c.best < 0
      ? `<td class="hm hm-x" title="No play on the sheet">–</td>`
      : `<td class="hm hm-${c.best}" title="${esc(PLAYS[c.id].name)}: ${TIERS[c.best]} vs ${esc(lookById(c.cov).name)}">${TIER_2[c.best]}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function sheetSideHTML() {
  const sc = scoreSheet(), ss = scoreScript();
  const noteList = (ns) => ns.length ? `<ul class="notes">${ns.map(([k, t]) => `<li class="${k}">${esc(t)}</li>`).join("")}</ul>` : "";
  return `<h2>Sheet grade</h2>
    <div class="scorebox"><div><b>${sc.filled ? letterFor(sc.pct) : "–"}</b><span>${sc.filled ? Math.round(sc.pct * 100) + "% vs the defenses you'll see" : "Empty sheet"}</span></div>
      <div><b>${sc.filled}/${BUCKETS.length * SLOTS}</b><span>Slots filled</span></div></div>
    <p>Each cell is your best call in that situation against that coverage (Gr great, Gd good, Rk risky, Bd bad). Coverages are weighted by how often a DC calls them.</p>
    ${sc.filled ? heatHTML(sc) : ""}
    ${noteList(sc.notes)}
    <h2 style="font-size:1.1rem">Opening script</h2>
    <p>${ss.n ? `${Math.round(ss.pct * 100)}% (${ss.n} plays)` : "Not started."}</p>${noteList(ss.notes)}
    <div class="tools">
      <button type="button" class="primary" data-act="play" ${sc.filled ? "" : "disabled"}>Play my sheet</button>
      <button type="button" class="ghost" data-act="export">Export</button>
      <button type="button" class="ghost" data-act="import">Import</button>
      <button type="button" class="ghost" data-act="wipe">Clear sheet</button>
    </div>
    <p class="mstat">${sc.filled ? "" : "Add plays to unlock the game. "}Saved in this browser. Export to back it up or share it.</p>`;
}
function sheetRender() {
  const m = document.getElementById("sheet-main"), s = document.getElementById("sheet-side");
  if (!m) return;
  m.innerHTML = sheetMainHTML(); s.innerHTML = sheetSideHTML();
}
function sheetInit() {
  const m = document.getElementById("sheet-main"), s = document.getElementById("sheet-side");
  m.addEventListener("click", e => {
    const slot = e.target.closest(".slot");
    if (slot) {
      const kind = slot.dataset.kind, idx = +slot.dataset.idx, bid = slot.dataset.bid;
      SH.pick = { kind, bid, idx }; SH.msg = "";
      SH.sel = (kind === "slot" ? SHEET.slots[bid][idx] : SHEET.script[idx]) || null;
      sheetRender(); const c = m.querySelector(".chooser"); if (c) c.scrollIntoView({ block: "nearest", behavior: "smooth" }); return;
    }
    const pl = e.target.closest("[data-play]");
    if (pl) { SH.sel = pl.dataset.play; sheetRender(); return; }
    const seg = e.target.closest(".seg button");
    if (seg) {
      if (seg.parentElement.id === "sh-view") { SH.view = seg.dataset.v; SH.pick = null; SH.sel = null; }
      else if (seg.parentElement.id === "sh-filter") SH.filter = seg.dataset.v;
      sheetRender(); return;
    }
    const act = e.target.closest("[data-act]"); if (!act || !SH.pick) return;
    const p = SH.pick;
    const set = v => { if (p.kind === "slot") SHEET.slots[p.bid][p.idx] = v; else SHEET.script[p.idx] = v; };
    if (act.dataset.act === "put" && SH.sel) { set(SH.sel); saveSheet(); SH.pick = null; SH.sel = null; }
    else if (act.dataset.act === "clear") { set(null); saveSheet(); SH.pick = null; SH.sel = null; }
    else if (act.dataset.act === "cancel") { SH.pick = null; SH.sel = null; }
    sheetRender();
  });
  s.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    if (b.dataset.act === "export") exportAll();
    else if (b.dataset.act === "import") importPrompt();
    else if (b.dataset.act === "play") { DS.useSheet = true; location.hash = "drive-sim"; }
    else if (b.dataset.act === "wipe") {
      if (b.dataset.armed) { SHEET = emptySheet(); saveSheet(); SH.pick = null; SH.msg = "Sheet cleared. Your drawn plays are still in your playbook."; sheetRender(); }
      else { b.dataset.armed = "1"; b.textContent = "Sure?"; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "Clear sheet"; } }, 2500); }
    }
  });
}
