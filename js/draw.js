const SX = x => (10 + x * 3).toFixed(1);
const SY = y => (170 - y * 6).toFixed(1);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function fieldBase() {
  let s = `<rect x="0" y="0" width="320" height="216" fill="var(--field)"/>`;
  for (let y = -5; y <= 25; y += 5) {
    if (y === 0) continue;
    s += `<line x1="6" x2="314" y1="${SY(y)}" y2="${SY(y)}" stroke="var(--chalk-dim)" stroke-width="0.6"/>`;
    if (y > 0) s += `<text x="314" y="${(+SY(y) - 2).toFixed(1)}" text-anchor="end" font-size="7" fill="var(--chalk-dim)" font-family="var(--font-body)">${y}</text>`;
  }
  s += `<line x1="6" x2="314" y1="${SY(0)}" y2="${SY(0)}" stroke="var(--chalk)" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>`;
  return s;
}

function offense(form, faint) {
  const f = FORMS[form];
  const op = faint ? 0.45 : 1;
  let s = `<g opacity="${op}">`;
  OL.forEach((x, i) => {
    s += `<rect x="${(+SX(x) - 4).toFixed(1)}" y="${(+SY(-1) - 4).toFixed(1)}" width="8" height="8" rx="1.5" fill="none" stroke="var(--chalk)" stroke-width="1.2"/>`;
  });
  for (const k of ["X", "H", "Y", "Z", "QB", "RB"]) {
    const [x, y] = f[k];
    const lbl = (f.labels && f.labels[k]) || (k === "QB" ? "Q" : k === "RB" ? "R" : k);
    s += `<circle cx="${SX(x)}" cy="${SY(y)}" r="5.2" fill="var(--field)" stroke="var(--chalk)" stroke-width="1.2"/>`;
    s += `<text x="${SX(x)}" y="${(+SY(y) + 2.4).toFixed(1)}" text-anchor="middle" font-size="6.5" font-weight="600" fill="var(--chalk)" font-family="var(--font-body)">${lbl}</text>`;
  }
  return s + `</g>`;
}

function path(pts) { return pts.map((p, i) => `${i ? "L" : "M"}${SX(p[0])} ${SY(p[1])}`).join(" "); }

function playSVG(play0, form) {
  const play = remapPlay(play0, form);
  const f = FORMS[play.f];
  let routes = "";
  for (const r of play.r) {
    const start = r.p ? f[r.p] : [OL[r.ol], -1];
    const d = path([start, ...r.pts]);
    const t = r.t || "route";
    if (t === "route") routes += `<path d="${d}" fill="none" stroke="var(--route)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#m-route)"/>`;
    else if (t === "run") routes += `<path d="${d}" fill="none" stroke="var(--run)" stroke-width="2.4" stroke-linejoin="round" marker-end="url(#m-run)"/>`;
    else if (t === "option") routes += `<path d="${d}" fill="none" stroke="var(--run)" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#m-run)"/>`;
    else if (t === "fake") routes += `<path d="${d}" fill="none" stroke="var(--chalk)" stroke-width="1.4" stroke-dasharray="3 3" opacity="0.7"/>`;
    else if (t === "block") routes += `<path d="${d}" fill="none" stroke="var(--chalk)" stroke-width="1.4" marker-end="url(#m-tee)"/>`;
  }
  return `<svg class="field" viewBox="0 0 320 216" role="img" aria-label="${esc(play.name)} diagram from ${esc(f.label)}">${fieldBase()}${routes}${offense(play.f, false)}</svg>`;
}

// Where each defender lines up, given the offense's formation and any pressure.
function adjustDefs(look, opts = {}) {
  const form = opts.form || "doubles", F = FORMS[form];
  const man = look.d.man || [];
  const pr = opts.pressure ? PRESSURES[opts.pressure] : null;
  return look.d.defs.map(([l, x, y]) => {
    const m = man.find(mm => mm[0] === x && mm[1] === y);
    let nx = x, ny = y;
    if (m && F[m[2]]) nx = F[m[2]][0];
    else if (form !== "doubles") {
      const threeRight = form === "trips" || form === "bunch";
      if (l === "NB" && threeRight) nx = 64;
      if (l === "FS" && threeRight && Math.abs(x - 50) < 4) nx = x + 6;
      if (l === "W" && form === "empty") { nx = 78; ny = 5; }
      if (l === "NB" && form === "twoBack") { nx = 37; ny = 4.5; }
    }
    if (pr && pr.blitzers[l]) [nx, ny] = l === "NB" ? [nx + (nx < 50 ? 7 : -7), 2.6] : pr.blitzers[l];
    return [l, nx, ny, m ? m[2] : null];
  });
}
function dlFor(front) { return (FRONTS[front || "over"] || FRONTS.over).dl.map(([l, x]) => [l, x, 1.3]); }
function defText(l, x, y) {
  return `<text x="${SX(x)}" y="${(+SY(y) + 3).toFixed(1)}" text-anchor="middle" font-size="${l.length > 1 ? 8 : 8.5}" font-weight="700" fill="var(--def)" font-family="var(--font-display)" letter-spacing="0.02em">${l}</text>`;
}

function lookSVG(look, opts = {}) {
  const d = look.d, form = opts.form || "doubles", F = FORMS[form];
  const pr = opts.pressure ? PRESSURES[opts.pressure] : null;
  let s = fieldBase() + offense(form, true);
  for (const z of d.zones) {
    const [x1, x2, y1, y2, k, label] = z;
    const fill = k === "d" ? "var(--zone-deep)" : k === "s" ? "var(--zone-special)" : "var(--zone-under)";
    const x = +SX(x1) + 1.5, w = +SX(x2) - +SX(x1) - 3, y = +SY(y2) + 1.5, h = +SY(y1) - +SY(y2) - 3;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="var(--chalk-dim)" stroke-width="0.6"/>`;
    if (label) s += `<text x="${(x + w / 2).toFixed(1)}" y="${(y + 9).toFixed(1)}" text-anchor="middle" font-size="7" font-weight="600" fill="var(--chalk)" font-family="var(--font-body)">${esc(label)}</text>`;
  }
  const defs = adjustDefs(look, opts);
  for (const [l, x, y, rec] of defs) {
    if (!rec || (pr && pr.blitzers[l])) continue;
    const [rx, ry] = F[rec];
    s += `<line x1="${SX(x)}" y1="${SY(y)}" x2="${SX(rx)}" y2="${SY(ry)}" stroke="var(--def)" stroke-width="1" stroke-dasharray="2.5 2.5" opacity="0.85"/>`;
  }
  const arrows = [...(d.blitz || [])];
  if (pr) for (const [l, x, y] of defs) if (pr.blitzers[l]) arrows.push([x, y, x + (x < 50 ? 2 : -2), -2.6]);
  for (const [x, y, tx, ty] of arrows) s += `<path d="${path([[x, y], [tx, ty]])}" stroke="var(--def)" stroke-width="1.8" fill="none" marker-end="url(#m-def)"/>`;
  const dl = dlFor(opts.front);
  if (pr && pr.sim) { const e = dl[dl.length - 1]; s += `<path d="${path([[e[1], e[2]], [e[1] + 6, 6]])}" stroke="var(--def)" stroke-width="1.4" stroke-dasharray="3 2" fill="none" marker-end="url(#m-def)"/>`; }
  for (const [l, x, y] of [...dl, ...defs]) s += defText(l, x, y);
  for (const [x, y, t] of d.notes || []) {
    s += `<text x="${SX(x)}" y="${SY(y)}" text-anchor="middle" font-size="7.5" font-weight="700" fill="var(--chalk)" font-family="var(--font-body)" letter-spacing="0.08em">${esc(t)}</text>`;
  }
  return `<svg class="field" viewBox="0 0 320 216" role="img" aria-label="${esc(look.name)} alignment and coverage diagram">${s}</svg>`;
}

// Pre-snap picture for Call It and the Drive Simulator: no zones, formation-aware.
function presnapSVG(covId, opts, svgId) {
  const look = lookById(covId);
  let s = fieldBase() + offense(opts.form || "doubles", true);
  for (const [l, x, y] of [...dlFor(opts.front), ...adjustDefs(look, opts)]) s += defText(l, x, y);
  return `<svg class="field" id="${svgId}" viewBox="0 0 320 216" role="img" aria-label="Defensive alignment before the snap">${s}</svg>`;
}

// ---------- state + render ----------
