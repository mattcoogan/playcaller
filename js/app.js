// ================= ROUTER =================
document.getElementById("tab-lookup").addEventListener("click", () => { location.hash = state.look; });
document.getElementById("tab-trainer").addEventListener("click", () => { location.hash = "coverage-id"; });
document.getElementById("tab-callit").addEventListener("click", () => { location.hash = "call-it"; });
document.getElementById("tab-drive").addEventListener("click", () => { location.hash = "drive-sim"; });
document.getElementById("tab-lab").addEventListener("click", () => { location.hash = "play-lab"; });
document.getElementById("tab-sheet").addEventListener("click", () => { location.hash = "play-sheet"; });
loadMyPlays(); loadSheet(); labInit(); sheetInit();
let trainerStarted = false, callitStarted = false, driveStarted = false;
function route() {
  const id = location.hash.slice(1);
  const view = id === "coverage-id" ? "trainer" : id === "call-it" ? "callit" : id === "drive-sim" ? "drive" : id === "play-lab" ? "lab" : id === "play-sheet" ? "sheet" : "lookup";
  for (const v of ["trainer", "callit", "drive", "lab", "sheet", "lookup"]) {
    document.getElementById("view-" + v).hidden = v !== view;
    document.getElementById("tab-" + v).setAttribute("aria-current", v === view ? "page" : "false");
  }
  if (view === "trainer") {
    renderAll();
    if (!trainerStarted) { trainerStarted = true; renderProgress(); newRep(); }
  } else if (view === "callit") {
    renderAll();
    if (!callitStarted) { callitStarted = true; ciSide(); ciNewRep(); }
  } else if (view === "lab") {
    renderAll(); LAB.started = true; labRender();
  } else if (view === "sheet") {
    renderAll(); sheetRender();
  } else if (view === "drive") {
    renderAll();
    if (!driveStarted) { driveStarted = true; dsRender(); }
  } else {
    if (LOOKS.some(l => l.id === id)) state.look = id;
    renderAll();
  }
}
window.addEventListener("hashchange", route);
route();
