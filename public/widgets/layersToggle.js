function setupLayerToggles(layerMap) {
  // Run after DOM is ready (handles late/early script execution)
  function init() {
    const bar = document.getElementById("layersToggleBar");
    if (!bar) return;

    // Sync UI with layer visibility at start
    Array.from(bar.querySelectorAll(".toggle-btn")).forEach(btn => {
      const key = btn.getAttribute("data-layer");
      const lyr = layerMap[key];
      btn.classList.toggle("active", lyr && lyr.visible);
    });

    bar.addEventListener("click", function(e) {
      if (e.target.classList.contains("toggle-btn")) {
        const key = e.target.getAttribute("data-layer");
        const lyr = layerMap[key];
        if (!lyr) return;

        // Toggle
        lyr.visible = !lyr.visible;
        // Immediately update the button state
        e.target.classList.toggle("active", lyr.visible);
      }
    });

    // (Optional) Also listen for external layer visibility changes:
    Object.keys(layerMap).forEach(key => {
      const lyr = layerMap[key];
      if (lyr && lyr.watch) {
        lyr.watch("visible", function(val) {
          const btn = bar.querySelector(`.toggle-btn[data-layer='${key}']`);
          if (btn) btn.classList.toggle("active", !!val);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}