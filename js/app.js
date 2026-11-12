// ================= ROUTER =================
document.getElementById("tab-lookup").addEventListener("click", () => { location.hash = state.look; });
document.getElementById("tab-trainer").addEventListener("click", () => { location.hash = "coverage-id"; });
document.getElementById("tab-callit").addEventListener("click", () => { location.hash = "call-it"; });
document.getElementById("tab-drive").addEventListener("click", () => { location.hash = "drive-sim"; });
let trainerStarted = false, callitStarted = false, driveStarted = false;
function route() {
  const id = location.hash.slice(1);
  const view = id === "coverage-id" ? "trainer" : id === "call-it" ? "callit" : id === "drive-sim" ? "drive" : "lookup";
  for (const v of ["trainer", "callit", "drive", "lookup"]) {
    document.getElementById("view-" + v).hidden = v !== view;
    document.getElementById("tab-" + v).setAttribute("aria-current", v === view ? "page" : "false");
  }
  if (view === "trainer") {
    renderAll();
    if (!trainerStarted) { trainerStarted = true; renderProgress(); newRep(); }
  } else if (view === "callit") {
    renderAll();
    if (!callitStarted) { callitStarted = true; ciSide(); ciNewRep(); }
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
