const CKEY = "pc-callit-v1";
let C = { reps: 0, points: 0, great: 0, streak: 0, best: 0, byCov: {} };
try { const raw = localStorage.getItem(CKEY); if (raw) { const p = JSON.parse(raw); if (p && typeof p.reps === "number") C = p; } } catch (e) {}
function saveC() { try { localStorage.setItem(CKEY, JSON.stringify(C)); } catch (e) {} }

const Q = { rep: null, lastId: null, resetArmed: false, form: "doubles", prot: "standard" };

function ciNewRep() {
  let id, pressure = null;
  if (chance(0.25)) {
    pressure = Object.keys(PRESSURES)[ri(0, Object.keys(PRESSURES).length - 1)];
    id = PRESSURES[pressure].under;
  } else {
    const pool = LOOKS.filter(l => l.id !== Q.lastId);
    id = pool[Math.floor(Math.random() * pool.length)].id;
  }
  Q.lastId = id;
  const sit = TR[id].sits[Math.floor(Math.random() * TR[id].sits.length)];
  Q.rep = { id, sit, picked: null, done: false, pressure, front: pickFront(state.level), motion: false };
  ciRender();
}
const ciCtx = () => ({ form: Q.form, front: Q.rep.front, pressure: Q.rep.pressure, prot: Q.prot });

function ciRender() {
  const r = Q.rep;
  document.getElementById("ci-rep").innerHTML = `
    <div class="sit"><span class="sit-label">Situation</span><strong>${esc(r.sit[0])}</strong><span class="chip">Your call, coach</span></div>
    <div class="setrow">${segHTML("ci-form", FORM_ITEMS(), Q.form, "Formation")}
      <button type="button" class="ghost" id="ci-motion" ${r.motion || r.done ? "disabled" : ""}>Send jet motion</button></div>
    <p class="mstat" style="margin:0">${esc(FORM_INFO[Q.form])}</p>
    <div id="ci-pic">${presnapSVG(r.id, ciCtx(), "ci-svg")}</div>
    <div class="snapbar"><span><b>Before the snap.</b> ${frontLine(ciCtx())}. Read the coverage and count the box, then make the call.</span></div>
    ${r.motion ? `<p class="hint">${esc(motionHint(r.id))}</p>` : ""}
    <div class="q"><h3>Call a play</h3><div class="pb" id="pb">${playbookButtons("pb", Q.form, r.picked, r.done)}</div></div>
    <div id="ci-preview"></div>
    <div id="ci-feedback"></div>`;
  bindSeg("ci-form", v => { if (r.done) return; Q.form = v; if (r.picked && !playForms(r.picked).includes(v)) r.picked = null; ciRender(); if (r.picked) ciPreview(r.picked); });
  document.getElementById("ci-motion").addEventListener("click", () => { r.motion = true; ciRender(); if (r.picked) ciPreview(r.picked); });
  document.querySelectorAll("#pb .opt").forEach(b => b.addEventListener("click", () => ciPreview(b.dataset.v)));
}

function ciPreview(id) {
  if (Q.rep.done) return;
  Q.rep.picked = id;
  document.querySelectorAll("#pb .opt").forEach(b => b.classList.toggle("picked", b.dataset.v === id));
  const p = PLAYS[id];
  const passy = p.type !== "Run";
  const warn = state.level === "hs" && p.diff === "Advanced" ? `<div class="warn" style="margin-top:8px">Advanced read for most high school QBs.</div>` : "";
  document.getElementById("ci-preview").innerHTML = `
    <div class="preview">
      ${playSVG(p, Q.form)}
      <div>
        <div class="chips" style="margin:0"><span class="chip t-${p.type}">${p.type}</span><span class="chip">${esc(FORMS[Q.form].label)}</span></div>
        <h3 style="margin-top:6px">${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        ${warn}
        ${passy ? `<div style="margin-top:10px">${segHTML("ci-prot", PROTECTIONS, Q.prot, "Protection")}<p class="mstat" style="margin-top:4px">${esc(PROT_INFO[Q.prot])}</p></div>` : ""}
        <button type="button" class="primary" id="call-btn">Call ${esc(p.name)}</button>
      </div>
    </div>`;
  bindSeg("ci-prot", v => { Q.prot = v; ciPreview(id); });
  document.getElementById("call-btn").addEventListener("click", ciCall);
}

function ciCall() {
  const r = Q.rep; if (r.done || !r.picked) return; r.done = true;
  const look = lookById(r.id), ctx = ciCtx();
  const g = grade(r.picked, r.id, r.sit[0], ctx);
  C.reps++; C.points += g.score; if (g.score === 3) C.great++;
  C.streak = g.score >= 2 ? C.streak + 1 : 0; C.best = Math.max(C.best, C.streak);
  const arr = C.byCov[r.id] || (C.byCov[r.id] = []); arr.push(g.score); if (arr.length > 10) arr.shift();
  saveC();

  const top = bestCalls(r.id, r.sit[0], ctx, r.picked);
  document.querySelectorAll("#pb .opt").forEach(b => {
    b.disabled = true;
    if (top.some(t => t.id === b.dataset.v)) b.classList.add("best");
  });
  document.querySelectorAll("#ci-form button").forEach(b => b.disabled = true);
  document.getElementById("ci-preview").innerHTML = "";
  const [freq] = look.lv[state.level];
  const lvlName = LEVELS.find(l => l[0] === state.level)[1];
  const tierBadge = s => `<span class="tier tier-${s}">${TIERS[s]}</span>`;
  const defName = r.pressure ? `${look.name} (${PRESSURES[r.pressure].name})` : look.name;

  document.getElementById("ci-feedback").innerHTML = `
    <div class="fb ${g.score >= 2 ? "ok" : "miss"}">
      <h3>${tierBadge(g.score)} ${esc(PLAYS[r.picked].name)} vs ${esc(defName)}</h3>
      <div class="compare" style="border-left-color:${g.score >= 2 ? "var(--accent)" : "var(--miss)"}">
        <b>Against ${esc(look.name)}:</b> ${esc(g.why)}
        ${modsHTML(g)}
      </div>
      <div class="fb-grid">
        <div>${lookSVG(look, ctx)}<p class="fb-caption">It was ${esc(defName)} out of a ${esc(FRONTS[r.front].name)} front. ${esc(lvlName)} level: ${esc(freq.toLowerCase())}.</p></div>
        <div>
          <h4>How to read it</h4>
          <ul>${TR[r.id].tells.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
          ${pressureNote(ctx)}
          <h4>The front</h4>
          <p>${esc(FRONTS[r.front].tip)} ${boxCount(r.id, ctx)} defenders in the box.</p>
          <h4>Why the defense called it here</h4>
          <p>${esc(r.sit[1])}</p>
          <h4>${g.score === 3 && !top.length ? "Best call" : (g.score === 3 ? "Other great calls here" : "Best calls here")} from ${esc(FORMS[Q.form].label)}</h4>
          ${top.length ? `<ul class="best-list">${top.map(t => `<li>${tierBadge(t.score)} <b>${esc(PLAYS[t.id].name)}</b><br>${esc(t.why)}</li>`).join("")}</ul>` : `<p>Your call was the best available.</p>`}
        </div>
      </div>
      <button type="button" class="primary" id="ci-next">Next situation</button>
    </div>`;
  document.getElementById("ci-next").addEventListener("click", () => { ciNewRep(); document.getElementById("ci-rep").scrollIntoView({ block: "start", behavior: "smooth" }); });
  ciSide();
  document.getElementById("ci-feedback").scrollIntoView({ block: "start", behavior: "smooth" });
}

function ciSide() {
  const avg = C.reps ? (C.points / C.reps).toFixed(1) : "–";
  const rows = LOOKS.map(l => {
    const a = C.byCov[l.id] || [];
    const pct = a.length ? Math.round(a.reduce((s, v) => s + v, 0) / (a.length * 3) * 100) : 0;
    const cls = pct >= 75 ? "done" : pct >= 50 ? "mid" : "";
    return `<div class="mrow"><span>${esc(l.name)}</span><span class="mstat">${a.length ? `${pct}% · ${a.length} call${a.length === 1 ? "" : "s"}` : "No calls yet"}</span>
      <div class="meter" role="img" aria-label="${esc(l.name)} ${pct} percent"><i class="${cls}" style="width:${a.length ? Math.max(pct, 3) : 0}%"></i></div></div>`;
  }).join("");
  document.getElementById("ci-side").innerHTML = `
    <h2>Your call sheet grade</h2>
    <div class="scorebox">
      <div><b>${C.reps}</b><span>Plays called</span></div>
      <div><b>${avg}</b><span>Avg grade (of 3)</span></div>
      <div><b>${C.great}</b><span>Great calls</span></div>
      <div><b>${C.streak}</b><span>Streak (best ${C.best})</span></div>
    </div>
    <p>Great = 3 points, Good = 2, Risky = 1, Bad = 0. Your streak counts Good or Great calls in a row.</p>
    <h2 style="font-size:1.1rem">By coverage</h2>
    <div class="mrows">${rows}</div>
    <p>Based on your last 10 calls against each coverage. Saved in this browser only.</p>
    <button type="button" class="ghost" id="ci-reset">${Q.resetArmed ? "Click again to erase your scores" : "Reset scores"}</button>`;
  document.getElementById("ci-reset").addEventListener("click", () => {
    if (!Q.resetArmed) { Q.resetArmed = true; ciSide(); return; }
    Q.resetArmed = false; C = { reps: 0, points: 0, great: 0, streak: 0, best: 0, byCov: {} }; saveC(); ciSide();
  });
}

