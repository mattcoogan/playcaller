function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
const state = {
  level: ["hs", "college", "nfl"].includes(store("pc-level")) ? store("pc-level") : "hs",
  look: LOOKS.some(l => l.id === location.hash.slice(1)) ? location.hash.slice(1) : "cover-3",
  filter: "all"
};

function segs(el, items, current, onPick) {
  el.innerHTML = items.map(([v, l]) => `<button type="button" id="${el.id}-${v}" data-v="${v}" aria-pressed="${v === current}">${l}</button>`).join("");
  el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => onPick(b.dataset.v)));
}

function renderNav() {
  const nav = document.getElementById("looks");
  nav.querySelectorAll(".look-btn").forEach(b => b.remove());
  for (const l of LOOKS) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "look-btn"; b.id = "look-" + l.id;
    b.setAttribute("aria-current", l.id === state.look);
    b.innerHTML = `<strong>${esc(l.name)}</strong><span class="shell">${esc(l.shell)}</span>`;
    b.addEventListener("click", () => { location.hash = l.id; });
    nav.appendChild(b);
  }
}

function renderLook() {
  const look = LOOKS.find(l => l.id === state.look);
  const [freq, note] = look.lv[state.level];
  const lvlName = LEVELS.find(l => l[0] === state.level)[1];
  document.getElementById("look").innerHTML = `
    <div>
      ${lookSVG(look)}
      <div class="legend">
        <span><i style="background:var(--zone-deep)"></i>Deep zone</span>
        <span><i style="background:var(--zone-under);outline:1px solid var(--line)"></i>Underneath zone</span>
        ${look.d.man ? `<span><i style="background:transparent;border-top:2px dashed var(--def);height:0;border-radius:0"></i>Man</span>` : ""}
      </div>
    </div>
    <div class="info">
      <h2>${esc(look.name)}</h2>
      <p class="alias">${esc(look.alias)}</p>
      <div class="chips"><span class="chip">${esc(look.shell)} shell</span><span class="chip freq">${esc(lvlName)}: ${esc(freq)}</span></div>
      <h3>How to spot it</h3>
      <p>${esc(look.spot)}</p>
      <h3>Where it's weak</h3>
      <ul>${look.weak.map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      <h3>Avoid</h3>
      <p class="avoid">${esc(look.avoid)}</p>
      <div class="level-note"><b>${esc(lvlName)}</b> &middot; ${esc(note)}</div>
    </div>`;
  document.getElementById("calls-title").textContent = `Calls that beat ${look.name}`;

  const keep = t => state.filter === "all" || (state.filter === "pass" ? ["Pass", "Screen", "RPO"].includes(t) : ["Run", "RPO"].includes(t));
  const calls = look.calls.filter(([id]) => keep(PLAYS[id].type));
  const box = document.getElementById("calls");
  if (!calls.length) { box.innerHTML = `<p class="empty">No ${state.filter} calls listed for ${esc(look.name)} yet. Switch the filter to All.</p>`; return; }
  box.innerHTML = calls.map(([id, tag, why], i) => {
    const p = PLAYS[id];
    const warn = state.level === "hs" && p.diff === "Advanced"
      ? `<div class="warn">Advanced read for most high school QBs. Rep it in practice before you call it.</div>` : "";
    return `<article class="play">
      <div class="play-top"><span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(p.name)}</h3></div>
      <div class="chips"><span class="chip t-${p.type}">${p.type}</span><span class="chip">${esc(tag)}</span></div>
      ${playSVG(p)}
      <p class="why"><b>Why it works vs ${esc(look.name)}</b>${esc(why)}</p>
      <p class="read"><b>Key read</b>${esc(p.read)}</p>
      <p class="read"><b>The play</b>${esc(p.desc)}</p>
      ${warn}
      <div class="meta"><span>${esc(FORMS[p.f].label)}</span><span>Difficulty: ${p.diff}</span></div>
    </article>`;
  }).join("");
}

function renderAll() {
  segs(document.getElementById("level"), LEVELS.map(([v, l]) => [v, l]), state.level, v => { state.level = v; store("pc-level", v); renderAll(); });
  segs(document.getElementById("filter"), FILTERS, state.filter, v => { state.filter = v; renderAll(); });
  renderNav();
  renderLook();
}

