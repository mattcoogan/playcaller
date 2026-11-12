// ---------- Shared pieces for Call It and the Drive Simulator ----------
const MAN_COVS = ["cover-1", "cover-0", "two-man"];

function segHTML(id, items, current, label) {
  return `<div><span class="seg-label" id="${id}-label">${label}</span><div class="seg seg-wrap" role="group" aria-labelledby="${id}-label" id="${id}">${
    items.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === current}">${esc(l)}</button>`).join("")}</div></div>`;
}
function bindSeg(id, fn) {
  const el = document.getElementById(id); if (!el) return;
  el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => fn(b.dataset.v)));
}
const FORM_ITEMS = () => FORM_ORDER.map(f => [f, FORMS[f].label]);

function motionHint(covId) {
  return MAN_COVS.includes(covId)
    ? "A defender ran across the formation with the motion man. That usually means man coverage."
    : "Defenders bumped over and passed the motion man off instead of chasing him. That usually means zone.";
}

function frontLine(ctx) {
  const f = FRONTS[ctx.front || "over"];
  return `Front: <b>${esc(f.name)}</b>`;
}

function modsHTML(g) {
  if (!g.mods.length) return "";
  return `<div style="margin-top:8px"><b>Adjustments</b> <span class="mstat">(${TIERS[g.base]} against the coverage alone)</span><ul class="mods">${
    g.mods.map(m => `<li>${m.d > 0 ? "▲" : "▼"} ${esc(m.t)}</li>`).join("")}</ul></div>`;
}

function pressureNote(ctx) {
  if (!ctx.pressure) return "";
  const pr = PRESSURES[ctx.pressure];
  return `<h4>The pressure: ${esc(pr.name)}</h4><p>${esc(pr.note)} Pre-snap tell: ${esc(pr.tell.charAt(0).toLowerCase() + pr.tell.slice(1))}</p>`;
}

function playbookButtons(prefix, form, picked, disabledAll) {
  return PB_GROUPS.map(([g, ids]) => `<div class="pb-group"><h4>${g}</h4><div class="opts">${
    ids.map(id => {
      const ok = playForms(id).includes(form);
      return `<button type="button" class="opt${picked === id ? " picked" : ""}" id="${prefix}-${id}" data-v="${id}" ${ok && !disabledAll ? "" : "disabled"} ${ok ? "" : `title="Not called from ${esc(FORMS[form].label)}"`}>${esc(PLAYS[id].name)}</button>`;
    }).join("")}</div></div>`).join("");
}

function bestCalls(covId, sit, ctx, exclude) {
  const all = Object.keys(PLAYS).filter(id => playForms(id).includes(ctx.form || "doubles"))
    .map(id => ({ id, ...grade(id, covId, sit, { ...ctx, prot: "standard" }) })).sort((a, b) => b.score - a.score);
  return all.filter(x => x.score === all[0].score && x.id !== exclude).slice(0, 3);
}
