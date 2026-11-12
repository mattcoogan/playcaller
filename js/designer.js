// ================= PLAY LAB: draw your own plays =================
const LAB = { draft: null, sel: "H", editing: false, msg: "", drag: null, started: false };
const LAB_MODES = [["pass", "Pass"], ["run", "Run"], ["rpo", "RPO"], ["pa", "Play-action"]];
const LAB_HINT = {
  pass: "Pick a receiver, choose a route from the tree, then drag the dots on the field to reshape it.",
  run: "Choose a run scheme. It sets the line blocking and the back's path. Drag the back's path to change the aim point, and give the receivers jobs.",
  rpo: "A run scheme with one receiver running a pass tag. The QB reads a defender and either hands it off or throws the tag.",
  pa: "The back fakes the run. Choose a dropback or a rollout, then build the routes. Deep shots need time, so protection matters."
};

function labPlayLike(d) { return { name: d.name || "Untitled", f: d.f, r: draftRoutes(d) }; }

function labSVG() {
  const d = LAB.draft, f = d.f, play = labPlayLike(d);
  let s = `<svg class="field lab-svg" id="lab-svg" viewBox="0 0 320 216" role="img" aria-label="Play designer field">${fieldBase()}${routeShapes(play)}${offense(f, false)}`;
  for (const role of rolesOf(f)) {
    const [x, y] = FORMS[f][role];
    const on = role === LAB.sel;
    s += `<circle class="lab-hit" data-role="${role}" cx="${SX(x)}" cy="${SY(y)}" r="8" fill="transparent" stroke="${on ? "var(--route)" : "none"}" stroke-width="2"/>`;
  }
  const a = d.assign[LAB.sel];
  if (a) a.pts.forEach(([x, y], i) => {
    s += `<circle class="handle" data-i="${i}" cx="${SX(x)}" cy="${SY(y)}" r="4.6" fill="var(--route)" stroke="var(--field)" stroke-width="1.4"/>`;
  });
  return s + `</svg>`;
}

function labRouteSelect(role) {
  const d = LAB.draft, a = d.assign[role];
  const fixed = (d.mode === "run" || d.mode === "rpo") && (role === "RB" || role === "QB");
  if (role === "QB") return `<p class="mstat">${d.mode === "pa" ? "Use the dropback / rollout buttons above." : "The QB's path comes from the scheme."}</p>`;
  if (fixed) return `<p class="mstat">The back's path comes from ${esc(PLAYS[d.scheme].name)}. Drag its dots to move the aim point.</p>`;
  const groups = {};
  for (const r of ROUTE_TREE) (groups[r.grp] = groups[r.grp] || []).push(r);
  const extra = role === "RB" && d.mode === "pa" ? `<option value="fakeRun" ${a && a.k === "fake" ? "selected" : ""}>Fake handoff</option>` : "";
  const custom = a && a.dragged ? `<option value="__custom" selected disabled>Custom shape (dragged)</option>` : "";
  return `<label class="seg-label" for="lab-route">Route for ${esc(roleLabel(d.f, role))}</label>
    <select id="lab-route">${custom}${extra}${Object.entries(groups).map(([g, rs]) => `<optgroup label="${g}">${rs.map(r => `<option value="${r.id}" ${a && !a.dragged && a.k === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
}

function labConceptHTML() {
  const d = LAB.draft, c = inferConcept(d);
  if (c.id) return `<b>Reads as ${esc(PLAYS[c.id].name)}</b> <span class="mstat">(${Math.round(c.match * 100)}% match, ${esc(c.why)})</span><br><span class="mstat">The game grades it like ${esc(PLAYS[c.id].name)}: same strengths against coverages and the same situations.</span>`;
  return `<b>No close concept match</b> <span class="mstat">(best ${Math.round(c.match * 100)}%)</span><br><span class="mstat">It will be graded as a general play. Try matching a known combination (flood, smash, mesh, stick) to get coverage-specific grading.</span>`;
}

function labMainHTML() {
  const d = LAB.draft, f = d.f;
  const forms = FORM_ORDER.filter(x => !((d.mode === "run" || d.mode === "rpo") && x === "empty"));
  const roles = rolesOf(f);
  const chips = roles.map(r => {
    const a = d.assign[r];
    const label = r === "QB" ? "QB" : roleLabel(f, r);
    const what = a ? (a.dragged ? "custom" : (ROUTE_BY_ID[a.k] ? ROUTE_BY_ID[a.k].name.replace(/ \(.*\)/, "") : a.k === "fake" ? "fake" : a.k === "roll" ? "roll" : a.k)) : "";
    return `<button type="button" class="opt lab-chip${r === LAB.sel ? " picked" : ""}" data-role="${r}"><b>${esc(label)}</b> <span class="mstat">${esc(what)}</span></button>`;
  }).join("");
  const schemeSel = d.mode === "run" || d.mode === "rpo"
    ? `<div><label class="seg-label" for="lab-scheme">Run scheme</label><select id="lab-scheme">${RUN_IDS.filter(id => d.mode === "run" || ["iz", "oz", "duo", "power", "counter", "zoneRead"].includes(id)).map(id => `<option value="${id}" ${d.scheme === id ? "selected" : ""}>${esc(PLAYS[id].name)}</option>`).join("")}</select></div>` : "";
  const roll = d.mode === "pa" ? segHTML("lab-roll", [["drop", "Dropback"], ["left", "Roll left"], ["right", "Roll right"]], d.roll, "QB action") : "";
  return `<div class="sit"><span class="sit-label">Play Lab</span><strong>${LAB.editing ? "Editing play" : "Draw a play"}</strong></div>
    <div class="setrow">
      <div><label class="seg-label" for="lab-name">Play name</label><input id="lab-name" type="text" maxlength="30" value="${esc(d.name)}" placeholder="Name your play"></div>
      ${segHTML("lab-mode", LAB_MODES, d.mode, "Play type")}
      ${segHTML("lab-form", forms.map(x => [x, FORMS[x].label]), f, "Formation")}
      ${schemeSel}${roll}
    </div>
    <p class="hint">${esc(LAB_HINT[d.mode])}</p>
    <div id="lab-canvas">${labSVG()}</div>
    <div class="q"><h3>Players</h3><div class="opts">${chips}</div></div>
    <div class="lab-edit">
      <div>${labRouteSelect(LAB.sel)}</div>
      <div class="tools">
        <button type="button" class="ghost" data-act="addpt">Add point</button>
        <button type="button" class="ghost" data-act="rmpt">Remove last point</button>
        <button type="button" class="ghost" data-act="reset-route">Reset this route</button>
      </div>
    </div>
    <div class="preview lab-concept" id="lab-concept"><div>${labConceptHTML()}</div></div>
    <div class="tools">
      <button type="button" class="primary" data-act="save">${LAB.editing ? "Update play" : "Save to my playbook"}</button>
      ${LAB.editing ? `<button type="button" class="ghost" data-act="save-copy">Save as new copy</button>` : ""}
      <button type="button" class="ghost" data-act="new">${LAB.editing ? "Cancel / new play" : "Clear"}</button>
      <span class="mstat" id="lab-msg" aria-live="polite">${esc(LAB.msg)}</span>
    </div>`;
}

function labSideHTML() {
  const rows = MY_PLAYS.map(p => `<div class="mine">
      ${playSVG(PLAYS[p.id], p.f)}
      <div><b>${esc(p.name)}</b>
        <div class="chips" style="margin:4px 0"><span class="chip t-${PLAYS[p.id].type}">${esc(MODE_NAME[p.mode])}</span>${PLAYS[p.id].concept ? `<span class="chip">≈ ${esc(PLAYS[PLAYS[p.id].concept].name)}</span>` : ""}</div>
        <div class="tools"><button type="button" class="ghost" data-act="edit" data-id="${p.id}">Edit</button>
          <button type="button" class="ghost" data-act="dup" data-id="${p.id}">Copy</button>
          <button type="button" class="ghost" data-act="del" data-id="${p.id}">Delete</button></div></div></div>`).join("");
  return `<h2>My playbook</h2>
    <p>${MY_PLAYS.length ? `${MY_PLAYS.length} play${MY_PLAYS.length === 1 ? "" : "s"}. They show up in your sheet, Call It and the Drive Sim.` : "Nothing yet. Draw a play and save it, then put it on your sheet."}</p>
    ${rows}
    <div class="tools"><a class="ghost" href="#play-sheet">Go to my sheet</a>
      <button type="button" class="ghost" data-act="export">Export</button>
      <button type="button" class="ghost" data-act="import">Import</button></div>`;
}

function labRender() {
  if (!LAB.draft) { LAB.draft = blankDraft("pass", "doubles"); LAB.sel = "H"; }
  if (!LAB.draft.assign[LAB.sel] && !FORMS[LAB.draft.f][LAB.sel]) LAB.sel = skillRoles(LAB.draft.f)[0];
  document.getElementById("lab-main").innerHTML = labMainHTML();
  document.getElementById("lab-side").innerHTML = labSideHTML();
}
function labRefreshLive() {
  const c = document.getElementById("lab-concept"); if (c) c.innerHTML = `<div>${labConceptHTML()}</div>`;
}

function labSetRoute(role, kind) {
  const d = LAB.draft;
  if (kind === "fakeRun") { paBackfield(d); return; }
  d.assign[role] = routeAssign(kind, d.f, role);
}
function labPoint(e) {
  const svg = document.getElementById("lab-svg");
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [Math.max(2, Math.min(98, Math.round((p.x - 10) / 3))), Math.max(-8, Math.min(28, r05((170 - p.y) / 6)))];
}
function labDragMove(e) {
  if (!LAB.drag) return;
  const a = LAB.draft.assign[LAB.drag.role]; if (!a) return;
  a.pts[LAB.drag.i] = labPoint(e); a.dragged = true;
  document.getElementById("lab-canvas").innerHTML = labSVG();
  labRefreshLive();
}
function labDragEnd() {
  window.removeEventListener("pointermove", labDragMove);
  LAB.drag = null; labRender();
}

function labSave(asCopy) {
  const d = LAB.draft;
  d.name = (d.name || "").trim();
  if (!d.name) { LAB.msg = "Give the play a name first."; labRender(); document.getElementById("lab-name").focus(); return; }
  const dup = MY_PLAYS.find(p => p.name.toLowerCase() === d.name.toLowerCase() && p.id !== d.id);
  if (dup && !asCopy) { LAB.msg = "You already have a play with that name."; labRender(); return; }
  if (asCopy) d.id = null;
  const saved = saveDraft(d);
  LAB.draft = JSON.parse(JSON.stringify(saved)); LAB.editing = true;
  LAB.msg = `Saved "${saved.name}".`;
  labRender();
}

function labInit() {
  const main = document.getElementById("lab-main"), side = document.getElementById("lab-side");
  main.addEventListener("pointerdown", e => {
    const h = e.target.closest(".handle");
    if (h) { e.preventDefault(); LAB.drag = { i: +h.dataset.i, role: LAB.sel }; window.addEventListener("pointermove", labDragMove); window.addEventListener("pointerup", labDragEnd, { once: true }); return; }
    const hit = e.target.closest(".lab-hit");
    if (hit) { LAB.sel = hit.dataset.role; labRender(); }
  });
  main.addEventListener("click", e => {
    const chip = e.target.closest(".lab-chip");
    if (chip) { LAB.sel = chip.dataset.role; labRender(); return; }
    const seg = e.target.closest(".seg button");
    const d = LAB.draft;
    if (seg) {
      const id = seg.parentElement.id, v = seg.dataset.v;
      if (id === "lab-mode") { const nm = d.name; changeMode(d, v); d.name = nm; LAB.sel = skillRoles(d.f).includes("H") ? "H" : skillRoles(d.f)[0]; }
      else if (id === "lab-form") changeFormation(d, v);
      else if (id === "lab-roll") { d.roll = v; paBackfield(d); }
      LAB.msg = ""; labRender(); return;
    }
    const act = e.target.closest("[data-act]"); if (!act) return;
    const a = d.assign[LAB.sel];
    switch (act.dataset.act) {
      case "addpt": if (a) { const last = a.pts[a.pts.length - 1], o = sideOf(d.f, LAB.sel) || 1; a.pts.push([clampX(last[0] + o * 4), Math.min(28, r05(last[1] + 3))]); a.dragged = true; labRender(); } break;
      case "rmpt": if (a && a.pts.length > 1) { a.pts.pop(); a.dragged = true; labRender(); } break;
      case "reset-route":
        if (a && ROUTE_BY_ID[a.k]) labSetRoute(LAB.sel, a.k);
        else if (d.mode === "pa") { paBackfield(d); }
        else { const keep = d.name; resetDraft(d); d.name = keep; }
        labRender(); break;
      case "save": labSave(false); break;
      case "save-copy": labSave(true); break;
      case "new": LAB.draft = blankDraft("pass", "doubles"); LAB.editing = false; LAB.sel = "H"; LAB.msg = ""; labRender(); break;
    }
  });
  main.addEventListener("change", e => {
    const d = LAB.draft;
    if (e.target.id === "lab-route") { labSetRoute(LAB.sel, e.target.value); labRender(); }
    else if (e.target.id === "lab-scheme") { applyScheme(d, e.target.value); labRender(); }
  });
  main.addEventListener("input", e => { if (e.target.id === "lab-name") LAB.draft.name = e.target.value; });
  side.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = b.dataset.id, mine = MY_PLAYS.find(p => p.id === id);
    if (b.dataset.act === "edit" && mine) { LAB.draft = JSON.parse(JSON.stringify(mine)); LAB.editing = true; LAB.sel = skillRoles(mine.f)[0]; LAB.msg = ""; labRender(); window.scrollTo({ top: 0 }); }
    else if (b.dataset.act === "dup" && mine) { LAB.draft = JSON.parse(JSON.stringify(mine)); LAB.draft.id = null; LAB.draft.name = mine.name + " 2"; LAB.editing = false; LAB.sel = skillRoles(mine.f)[0]; LAB.msg = "Copy loaded. Rename it and save."; labRender(); window.scrollTo({ top: 0 }); }
    else if (b.dataset.act === "del" && mine) {
      if (b.dataset.armed) { deleteMyPlay(id); if (LAB.draft.id === id) { LAB.draft = blankDraft("pass", "doubles"); LAB.editing = false; } labRender(); }
      else { b.dataset.armed = "1"; b.textContent = "Sure?"; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "Delete"; } }, 2500); }
    }
    else if (b.dataset.act === "export") exportAll();
    else if (b.dataset.act === "import") importPrompt();
  });
}
