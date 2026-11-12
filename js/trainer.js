// ================= COVERAGE ID TRAINER =================
// pre: Level B disguised alignment, post: where defenders end up after the snap.
// Both lists follow the same order as that look's d.defs.
const TR = {
  "cover-3": {
    tells: ["One safety in the middle of the field, about 12-14 yards deep.",
            "Corners off at 7+ yards with outside leverage. They are protecting deep, not jamming.",
            "A safety walked down to about 6 yards over the slot or tight end, making an 8-man box."],
    post: "At the snap the corners turn and bail to their deep thirds, the middle safety stays in the middle, and four defenders spread out underneath. Nobody turns to chase a specific receiver.",
    pre: [[9,7],[91,7],[32,12],[68,12],[24,5],[42,5],[58,5]],
    postPos: [[8,14],[92,14],[50,18],[80,8],[20,8],[40,9],[60,9]],
    dnote: "They showed two high safeties so it would look like Quarters or Cover 2. At the snap one safety rotated to the middle and the other dropped down. That rotation, one safety to the middle and one coming down, is the giveaway.",
    sits: [["1st & 10, own 25", "Early downs are Cover 3's home. It keeps 8 defenders near the box to stop the run while still protecting deep."],
           ["2nd & 6, own 42", "A true run-or-pass down. Cover 3 is the safe call that defends both."],
           ["1st & 10, opp 40", "Many defenses stay in base Cover 3 across midfield on early downs."]]
  },
  "cover-2": {
    tells: ["Two safeties, each about 12-14 yards deep and near the hashes.",
            "Corners close to the line (press or about 5 yards) with outside leverage. They are funneling receivers inside.",
            "Linebackers at normal depth and nobody walked down, which often means a 6-man box."],
    post: "The corners stay shallow, jam receivers and squat in the flats. Both safeties backpedal to deep halves. Five defenders cover the underneath zones.",
    pre: [[9,6],[91,6],[50,13],[70,8],[28,5],[48,5],[64,5]],
    postPos: [[8,5],[92,5],[22,18],[78,18],[28,9],[48,9],[68,9]],
    dnote: "They showed one high safety so it would look like Cover 3. At the snap the walked-down safety bailed to a deep half and the middle safety slid to the other half. Corners sitting down in the flat confirm Cover 2.",
    sits: [["2nd & 9, own 30", "Long second downs invite throws to the sideline, and Cover 2 corners sit right on them."],
           ["3rd & 6, opp 45", "Cover 2 takes away quick outs and keeps everything in front on medium third downs."],
           ["1st & 10, own 20, 0:58 left in half", "In two-minute situations, Cover 2 protects the sidelines and the deep ball."]]
  },
  "tampa-2": {
    tells: ["Two safeties at 14 or more yards, often a little deeper and wider than in Cover 2.",
            "Corners shallow with outside leverage, the same as Cover 2.",
            "The Mike linebacker may sit a yard deeper than usual, and the defense has its fastest linebacker in the middle."],
    post: "It looks like Cover 2 until the Mike sprints straight back 15-20 yards down the middle. That run to the deep middle is the one clue that separates it from Cover 2.",
    pre: [[9,3],[91,3],[24,13],[76,13],[28,5],[72,5],[50,4.5]],
    postPos: [[8,5],[92,5],[20,19],[80,19],[26,9],[72,9],[50,16]],
    dnote: "Before the snap it was an ordinary two-high look with the Mike at normal depth. The tell only appears after the snap: the Mike turns and runs to the deep middle instead of dropping to a short hook zone.",
    sits: [["3rd & 9, own 35", "A passing down where the defense wants to keep everything in front and rally to tackle."],
           ["2nd & 12, opp 48", "Long yardage. Tampa 2 closes the deep middle while staying in a zone that swarms the catch."],
           ["3rd & 7, own 40", "The offense needs a chunk, and the deep middle is where it wants to throw. Tampa 2 puts the Mike right there."]]
  },
  "cover-4": {
    tells: ["Two safeties at only 8-10 yards, closer to the line than in Cover 2.",
            "Corners off at 7+ yards, often head-up or with inside leverage.",
            "The safeties' eyes are on the slot or tight end, not the QB. They are reading the #2 receiver."],
    post: "Corners and safeties all backpedal, splitting the deep field into four quarters. The safeties then react to the slot: they drive down on short routes or carry him deep.",
    pre: [[9,7],[91,7],[50,13],[74,7],[24,4],[48,5],[72,4]],
    postPos: [[9,14],[91,14],[30,13],[70,13],[20,8],[48,9],[74,8]],
    dnote: "They showed one high safety like Cover 3. At the snap the walked-down safety backed into a deep quarter as the middle safety shifted over. Four defenders backpedaling deep is the giveaway for Quarters.",
    sits: [["1st & 10, own 35", "Quarters is an early-down base coverage for many teams. Its safeties fit the run fast from 8-10 yards."],
           ["2nd & 5, opp 40", "On run-or-pass downs against spread teams, the safeties help stop the run and still cover the deep ball."],
           ["3rd & 4, own 45", "Quarters takes away quick throws to the slot on medium third downs."]]
  },
  "cover-6": {
    tells: ["Two high safeties, but the two sides look different.",
            "One corner is shallow with outside leverage. That is the Cover 2 side, usually the short side of the field.",
            "The other corner is off at 7+ yards and the safety on that side is shallower. That is the Quarters side."],
    post: "One side plays Cover 2: the corner squats in the flat and the safety covers a deep half. The other side plays Quarters: the corner and safety each take a deep quarter.",
    pre: [[9,6],[26,12],[28,5],[48,5],[70,4],[70,12],[91,6]],
    postPos: [[8,5],[24,18],[28,9],[48,9],[72,8],[68,13],[91,14]],
    dnote: "Both corners lined up at the same depth, so the shell looked balanced. At the snap one corner squatted and the other bailed. Corners doing different things after the snap is the tell for Cover 6.",
    sits: [["1st & 10, opp 45, ball on the left hash", "With the ball on a hash, defenses often play Cover 2 to the short side and Quarters to the wide side."],
           ["2nd & 8, own 38, trips to the wide side", "Cover 6 is a common answer to trips: Quarters toward the three receivers, Cover 2 toward the single receiver."],
           ["3rd & 5, opp 35", "It lets the defense play two different coverages against two different threats."]]
  },
  "cover-1": {
    tells: ["One deep safety in the middle of the field.",
            "Corners tight on receivers, often with inside leverage.",
            "Defenders line up directly across from specific receivers and follow them if they go in motion."],
    post: "At the snap the corners and nickel turn and run with their receivers. The middle safety stays deep, and one linebacker sits in the middle as a robber or spies the QB.",
    pre: [[8,6],[92,6],[26,4],[70,12],[54,4],[46,6],[30,12]],
    postPos: [[10,6],[90,6],[28,6],[72,7],[56,0],[48,10],[50,18]],
    dnote: "Two high safeties before the snap suggested zone. At the snap one safety ran to the middle, the other came down to cover the tight end, and the corners turned and ran with their receivers.",
    sits: [["3rd & 6, opp 30", "Medium third down in plus territory. Tight man coverage takes away quick throws."],
           ["2nd & goal, opp 9", "In the red zone the field is short, so man coverage gets tighter and safer."],
           ["3rd & 5, own 45", "Many defenses play man on third down to challenge receivers one-on-one."]]
  },
  "cover-0": {
    tells: ["No safety deeper than about 8 yards.",
            "Defenders tight on every receiver with no help behind them.",
            "Six or more players at or near the line who could rush."],
    post: "Every defender either covers a man or rushes. Linebackers and safeties fire at the QB, and nobody drops deep.",
    pre: [[8,5],[92,5],[26,4],[66,11],[36,11],[43,4.5],[52,4.5]],
    postPos: [[10,5],[90,5],[27,5],[73,6],[62,3.5],[42.5,-1.8],[57.5,-1.8]],
    dnote: "Both safeties started deep, then sprinted down right before the snap. Nobody left deep after the snap is the only clue you need.",
    sits: [["3rd & 1, opp 35", "Short yardage. The defense puts every player near the ball to stop the run or force a rushed throw."],
           ["2nd & goal, opp 3", "At the goal line there is no deep field to protect, so they bring everyone."],
           ["3rd & 10, own 15", "Some defenses gamble with an all-out blitz when the offense is backed up, hoping for a sack or a turnover."]]
  },
  "two-man": {
    tells: ["Two deep safeties, often a little deeper than in Cover 2.",
            "Corners aligned inside their receivers, sometimes a yard or two off, ready to trail from underneath.",
            "Linebackers line up over the back and tight end instead of in their zone spots."],
    post: "Underneath defenders chase their receivers from behind and to the inside, while the two safeties cover deep halves over the top.",
    pre: [[9,7],[91,7],[26,4],[70,4.5],[54,5],[30,11],[70,11]],
    postPos: [[10,5],[90,5],[28,5],[72,6],[56,1],[22,18],[78,18]],
    dnote: "It looked like Quarters: off corners and two safeties near 10 yards. At the snap the corners closed on their receivers and trailed them, while the safeties bailed to deep halves.",
    sits: [["3rd & 11, own 40", "Long third down. Trail technique takes away short routes and two safeties stop the deep ball."],
           ["3rd & 8, opp 45", "The offense needs a chunk. 2-Man makes it beat tight coverage over the middle."],
           ["2nd & 15, own 25", "Long yardage with little reason to fear the run."]]
  }
};

const CONFUSE = {
  "cover-1|cover-3": "Both show one high safety, so look at the corners. Cover 3 corners play off with outside leverage and bail deep. Cover 1 corners play tight, often with inside leverage, and turn to run with their man.",
  "cover-0|cover-1": "Count the deep safeties. Cover 1 always keeps one in the deep middle. Cover 0 has nobody deep.",
  "cover-2|tampa-2": "They look the same before the snap. Watch the Mike after the snap: in Tampa 2 he runs to the deep middle, in Cover 2 he drops to a short hook. The situation helps too, since Tampa 2 shows up more on passing downs.",
  "cover-2|cover-4": "Both are two-high, so check depth. Cover 2 safeties are deep (12-14 yards) with shallow corners. Quarters safeties are shallower (8-10 yards) with off corners.",
  "cover-4|cover-6": "Quarters looks the same on both sides. Cover 6 is uneven: one corner shallow (the Cover 2 side) and one off (the Quarters side).",
  "cover-2|cover-6": "In Cover 2 both corners are shallow. In Cover 6 only one is.",
  "cover-2|two-man": "Both have two deep safeties. Cover 2 corners squat in the flat with their eyes on the QB. 2-Man corners line up inside the receiver and chase him from behind.",
  "cover-4|two-man": "Both can show off corners and two safeties near 10 yards. After the snap, Quarters corners backpedal deep while 2-Man corners close on their receiver and trail him.",
  "cover-3|cover-4": "Count the safeties. Cover 3 has one in the middle. Quarters has two at 8-10 yards.",
  "cover-1|two-man": "Both play man underneath. Cover 1 has one deep safety in the middle. 2-Man has two, splitting the field in halves.",
  "cover-0|two-man": "Both are man coverage, but 2-Man keeps two safeties deep while Cover 0 sends them after the QB.",
  "cover-2|cover-3": "Count the safeties first: one high is Cover 3, two high is Cover 2. Then confirm with the corners. Cover 3 corners bail deep, Cover 2 corners squat.",
  "cover-4|tampa-2": "Tampa 2 safeties are deep (14+ yards) with shallow corners. Quarters safeties are at 8-10 yards with off corners.",
  "cover-6|two-man": "Cover 6 is zone with uneven corners. In 2-Man both corners are inside their receivers and chase them."
};
const RELATED = { "cover-3": "cover-1", "cover-1": "cover-3", "cover-0": "cover-1", "cover-2": "tampa-2", "tampa-2": "cover-2", "cover-4": "cover-6", "cover-6": "cover-4", "two-man": "cover-2" };
const SHELLS = [["0-high", "0-high", "No deep safety"], ["1-high", "1-high", "One deep safety"], ["2-high", "2-high", "Two deep safeties"]];
const SHELL_OPTS = { "0-high": ["cover-0", "cover-1"], "1-high": ["cover-3", "cover-1"], "2-high": ["cover-2", "tampa-2", "cover-4", "cover-6", "two-man"] };
const lookById = id => LOOKS.find(l => l.id === id);

function confuse(a, b) {
  const k = [a, b].sort().join("|");
  if (CONFUSE[k]) return CONFUSE[k];
  const A = lookById(a), B = lookById(b);
  if (A.shell !== B.shell) return `${A.name} is a ${A.shell} coverage and ${B.name} is ${B.shell}. Start every read by counting the deep safeties.`;
  return `Both are ${A.shell}. Compare corner depth and leverage, then watch what the defenders do at the snap.`;
}

// ----- mastery (saved in this browser only) -----
const MKEY = "pc-mastery-v1";
let M = { A: {}, B: {} };
try { const raw = localStorage.getItem(MKEY); if (raw) { const p = JSON.parse(raw); if (p && p.A && p.B) M = p; } } catch (e) {}
function saveM() { try { localStorage.setItem(MKEY, JSON.stringify(M)); } catch (e) {} }
function stat(mode, id) {
  const a = M[mode][id] || []; const n = a.length; const c = a.reduce((s, v) => s + v, 0);
  return { n, c, pct: n ? c / n : 0, mastered: n >= 4 && c / n >= 0.75 };
}
function record(mode, id, ok) { const a = M[mode][id] || (M[mode][id] = []); a.push(ok ? 1 : 0); if (a.length > 10) a.shift(); saveM(); }
const unlockedB = () => LOOKS.every(l => stat("A", l.id).mastered);

const T = { mode: "A", preview: false, rep: null, lastId: null, resetArmed: false };

function pickCoverage() {
  const pool = LOOKS.filter(l => l.id !== T.lastId);
  const w = pool.map(l => { const s = stat(T.mode, l.id); return s.n < 4 ? 3 : 1 + (1 - s.pct) * 4; });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i].id; }
  return pool[pool.length - 1].id;
}

function repSVG(id, mode, svgId = "rep-svg") {
  const look = lookById(id), t = TR[id];
  const pos = mode === "B" ? t.pre : look.d.defs.map(d => [d[1], d[2]]);
  let s = fieldBase() + offense("doubles", true);
  for (const [l, x, y] of [["E", 42, 1.3], ["T", 47.5, 1.3], ["T", 52.5, 1.3], ["E", 58, 1.3]]) {
    s += `<text x="${SX(x)}" y="${(+SY(y) + 3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--def)" font-family="var(--font-display)">${l}</text>`;
  }
  look.d.defs.forEach(([l], i) => {
    const [x, y] = pos[i];
    s += `<g class="dm" data-i="${i}" style="transform: translate(${SX(x)}px, ${SY(y)}px)"><text x="0" y="3" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--def)" font-family="var(--font-display)">${l}</text></g>`;
  });
  return `<svg class="field" id="${svgId}" viewBox="0 0 320 216" role="img" aria-label="Defensive alignment to identify">${s}</svg>`;
}

function moveDefenders(which, instant) {
  const svg = document.getElementById("rep-svg"); if (!svg || !T.rep) return;
  const t = TR[T.rep.id];
  const pos = which === "post" ? t.postPos : t.pre;
  svg.querySelectorAll(".dm").forEach(g => {
    if (instant) g.style.transition = "none";
    const [x, y] = pos[+g.dataset.i];
    g.style.transform = `translate(${SX(x)}px, ${SY(y)}px)`;
    if (instant) { g.getBoundingClientRect(); g.style.transition = ""; }
  });
  const line = document.getElementById("snap-state");
  if (line) line.textContent = which === "post" ? "After the snap" : "Before the snap";
}
let snapTimer = null;
function runSnap() {
  clearTimeout(snapTimer);
  moveDefenders("pre", true);
  snapTimer = setTimeout(() => moveDefenders("post", false), 1100);
}

function newRep() {
  const id = pickCoverage(); T.lastId = id;
  const sit = TR[id].sits[Math.floor(Math.random() * TR[id].sits.length)];
  T.rep = { id, sit, shellPick: null, shellOk: null, done: false };
  renderRep();
  if (T.mode === "B") runSnap();
}

function optButtons(ids, onPick, prefix) {
  return `<div class="opts">${ids.map(id => `<button type="button" class="opt" id="${prefix}-${id}" data-v="${id}">${esc(lookById(id).name)}</button>`).join("")}</div>`;
}

function renderRep() {
  const r = T.rep, look = lookById(r.id);
  const modeLabel = T.mode === "A" ? "Level A · Pre-snap" : "Level B · Disguise";
  let ask;
  if (T.mode === "A") {
    ask = `<div class="q" id="q1"><h3>Step 1 of 2: How many deep safeties?</h3>
      <div class="opts">${SHELLS.map(([v, l, d]) => `<button type="button" class="opt" id="shell-${v}" data-v="${v}" title="${d}">${l}</button>`).join("")}</div>
      <div id="q1-note"></div></div><div id="q2"></div>`;
  } else {
    ask = `<div class="q" id="q1"><h3>Which coverage did they play?</h3>${optButtons(LOOKS.map(l => l.id), null, "cov")}</div>`;
  }
  document.getElementById("rep").innerHTML = `
    <div class="sit"><span class="sit-label">Situation</span><strong>${esc(r.sit[0])}</strong><span class="chip">${modeLabel}</span></div>
    ${repSVG(r.id, T.mode)}
    <div class="snapbar"><span><b id="snap-state">Before the snap</b> · Red letters are defenders. Count the deep safeties first.</span>
      ${T.mode === "B" ? `<button type="button" class="ghost" id="replay">Replay the snap</button>` : ""}</div>
    ${ask}
    <div id="feedback"></div>`;
  if (T.mode === "B") {
    document.getElementById("replay").addEventListener("click", runSnap);
    document.querySelectorAll("#q1 .opt").forEach(b => b.addEventListener("click", () => answerCoverage(b.dataset.v)));
  } else {
    document.querySelectorAll("#q1 .opt").forEach(b => b.addEventListener("click", () => answerShell(b.dataset.v)));
  }
}

function answerShell(v) {
  const r = T.rep, look = lookById(r.id);
  if (r.shellPick) return;
  r.shellPick = v; r.shellOk = v === look.shell;
  document.querySelectorAll("#q1 .opt").forEach(b => {
    b.disabled = true;
    if (b.dataset.v === look.shell) b.classList.add("right");
    else if (b.dataset.v === v) b.classList.add("wrong");
  });
  document.getElementById("q1-note").innerHTML = r.shellOk
    ? `<p class="step-note ok">Right, ${esc(look.shell)}. Now narrow it down.</p>`
    : `<p class="step-note miss">It's ${esc(look.shell)}. Only count safeties deeper than about 10 yards. Pick from the ${esc(look.shell)} coverages below.</p>`;
  document.getElementById("q2").innerHTML = `<div class="q"><h3>Step 2 of 2: Which ${esc(look.shell)} coverage?</h3>${optButtons(SHELL_OPTS[look.shell], null, "cov")}</div>`;
  document.querySelectorAll("#q2 .opt").forEach(b => b.addEventListener("click", () => answerCoverage(b.dataset.v)));
  const first = document.querySelector("#q2 .opt"); if (first) first.focus();
}

function answerCoverage(pick) {
  const r = T.rep; if (r.done) return; r.done = true;
  const look = lookById(r.id), t = TR[r.id];
  const covOk = pick === r.id;
  const ok = covOk && (T.mode === "B" || r.shellOk);
  record(T.mode, r.id, ok);
  if (T.mode === "B") { clearTimeout(snapTimer); moveDefenders("post", false); }
  document.querySelectorAll(T.mode === "A" ? "#q2 .opt" : "#q1 .opt").forEach(b => {
    b.disabled = true;
    if (b.dataset.v === r.id) b.classList.add("right");
    else if (b.dataset.v === pick) b.classList.add("wrong");
  });

  const lvlName = LEVELS.find(l => l[0] === state.level)[1];
  const [freq, note] = look.lv[state.level];
  let head;
  if (ok) head = `Correct: ${esc(look.name)}`;
  else if (covOk) head = `${esc(look.name)}, but you missed the shell`;
  else head = `Not quite. It was ${esc(look.name)}`;
  const compare = !covOk ? `<p class="compare"><b>${esc(lookById(pick).name)} vs ${esc(look.name)}:</b> ${esc(confuse(pick, r.id))}</p>`
    : (T.mode === "A" && !r.shellOk ? `<p class="compare"><b>The shell:</b> you counted ${esc(r.shellPick)}, but this is ${esc(look.shell)}. Find the safeties deeper than about 10 yards before anything else.</p>` : "");
  const rel = RELATED[r.id] && RELATED[r.id] !== pick ? RELATED[r.id] : null;

  document.getElementById("feedback").innerHTML = `
    <div class="fb ${ok ? "ok" : "miss"}">
      <h3>${head}</h3>
      ${compare}
      <div class="fb-grid">
        <div>${lookSVG(look)}<p class="fb-caption">${esc(look.name)}: zones in blue and white, man responsibilities dashed.</p></div>
        <div>
          <h4>The tells</h4>
          <ul>${t.tells.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
          <h4>After the snap</h4>
          <p>${esc(t.post)}</p>
          ${T.mode === "B" ? `<h4>The disguise</h4><p>${esc(t.dnote)}</p>` : ""}
          <h4>Why this situation: ${esc(r.sit[0])}</h4>
          <p>${esc(r.sit[1])}</p>
          <h4>Tendencies at the ${esc(lvlName)} level: ${esc(freq)}</h4>
          <p>${esc(note)}</p>
          ${rel ? `<h4>Don't confuse it with ${esc(lookById(rel).name)}</h4><p>${esc(confuse(r.id, rel))}</p>` : ""}
        </div>
      </div>
      <button type="button" class="primary" id="next-rep">Next rep</button>
    </div>`;
  document.getElementById("next-rep").addEventListener("click", () => { newRep(); document.getElementById("rep").scrollIntoView({ block: "start", behavior: "smooth" }); });
  renderProgress();
}

function renderProgress() {
  const open = unlockedB();
  const mastered = LOOKS.filter(l => stat("A", l.id).mastered).length;
  const rows = LOOKS.map(l => {
    const s = stat(T.mode, l.id);
    const pct = Math.round(s.pct * 100);
    const cls = s.mastered ? "done" : pct >= 50 ? "mid" : "";
    return `<div class="mrow"><span>${esc(l.name)}</span><span class="mstat">${s.n ? `${s.c}/${s.n} · ${pct}%` : "No reps yet"}</span>
      <div class="meter" role="img" aria-label="${esc(l.name)} ${pct} percent"><i class="${cls}" style="width:${s.n ? Math.max(pct, 3) : 0}%"></i></div></div>`;
  }).join("");
  const bAllowed = open || T.preview;
  document.getElementById("progress").innerHTML = `
    <h2>Mastery</h2>
    <div class="seg" role="group" aria-label="Trainer level">
      <button type="button" id="mode-A" aria-pressed="${T.mode === "A"}">Level A</button>
      <button type="button" id="mode-B" aria-pressed="${T.mode === "B"}" ${bAllowed ? "" : "disabled"}>Level B ${open ? "" : "🔒"}</button>
    </div>
    <p>${T.mode === "A" ? "Level A: still pre-snap pictures. Name the shell, then the coverage." : "Level B: the defense disguises, then rotates at the snap. Pick from all 8."}</p>
    <div class="mrows">${rows}</div>
    <div class="unlock">${open
      ? `<b>Level B unlocked</b><br>Every coverage is at 75% or better.`
      : `<b>${mastered} of 8 mastered</b><br>Level B unlocks when every coverage reaches 75% over its last 10 reps (at least 4 reps each). Coverages you miss come up more often.${T.preview ? "" : `<br><button type="button" class="ghost" id="preview-b" style="margin-top:8px">Preview Level B</button>`}`}</div>
    <p>Mastery is based on your last 10 reps of each coverage and is saved in this browser only.</p>
    <button type="button" class="ghost" id="reset-m">${T.resetArmed ? "Click again to erase all progress" : "Reset progress"}</button>`;
  document.getElementById("mode-A").addEventListener("click", () => setMode("A"));
  const mb = document.getElementById("mode-B"); if (!mb.disabled) mb.addEventListener("click", () => setMode("B"));
  const pv = document.getElementById("preview-b"); if (pv) pv.addEventListener("click", () => { T.preview = true; setMode("B"); });
  document.getElementById("reset-m").addEventListener("click", () => {
    if (!T.resetArmed) { T.resetArmed = true; renderProgress(); return; }
    T.resetArmed = false; M = { A: {}, B: {} }; saveM(); T.preview = false; setMode("A");
  });
}

function setMode(m) { T.mode = m; T.resetArmed = false; renderProgress(); newRep(); }

