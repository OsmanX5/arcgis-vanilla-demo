define([], function() {
  function setupBimButton(view, map) {
    const buildingsLayer = map.layers.find(l => l.title === "Riyadh Buildings") || map.layers.getItemAt(0);
    const bimInvestigatorBtn = document.createElement("button");
    bimInvestigatorBtn.className = "esri-widget esri-interactive";
    bimInvestigatorBtn.title = "BIM Investigator";
    bimInvestigatorBtn.textContent = "BIM Investigator";
    bimInvestigatorBtn.style.display = "none";
    bimInvestigatorBtn.style.padding = "6px 12px";
    bimInvestigatorBtn.style.fontSize = "14px";
    bimInvestigatorBtn.style.border = "none";
    bimInvestigatorBtn.style.borderRadius = "6px";
    view.ui.add(bimInvestigatorBtn, "top-right");

    let selectedBuilding = null;
// Assuming 'osmBuildings' is imported and available

view.on("click", function(event) {
  view.hitTest(event).then(function(response) {
    // Existing Riyadh buildings logic...
    // ---- OSM buildings logic below ----

    const osmResult = response.results.find(
      res => res.graphic && res.graphic.layer === osmBuildings
    );
    if (osmResult && osmResult.graphic) {
      const pt = osmResult.graphic.geometry;
      // pt.x = longitude, pt.y = latitude (in view.spatialReference)
      // To always print lon/lat, convert to WGS84:
      view.graphics.removeAll(); // Optionally clear any graphics
      view
        .toMap(event)
        .then(function(mapPoint) {
          // Optional: use mapPoint if you want the clicked point, not centroid
        });

      // Project to WGS84 if needed
      if (pt.type === "point") {
        require([
          "esri/geometry/support/webMercatorUtils"
        ], function(webMercatorUtils) {
          let wgsPt = pt;
          if (pt.spatialReference && pt.spatialReference.isWebMercator) {
            wgsPt = webMercatorUtils.webMercatorToGeographic(pt);
          }
          const msg = `OSM Building: <br>Lon: ${wgsPt.x.toFixed(5)}<br>Lat: ${wgsPt.y.toFixed(5)}`;
          document.getElementById("osmBuildingInfo").innerHTML = msg;
        });
      }
    }
  });
});

    bimInvestigatorBtn.addEventListener("click", function () {
      if (!selectedBuilding) return;
      const layer = selectedBuilding.layer;
      const oidField = (layer && layer.objectIdField) || "OBJECTID";
      const oid = selectedBuilding.attributes ? selectedBuilding.attributes[oidField] : undefined;

      const params = new URLSearchParams();
      if (oid !== undefined && oid !== null) {
        params.set("oid", String(oid));
      }
      const targetUrl = `http://localhost:8000/${params.toString() ? "?" + params.toString() : ""}`;
      const newWin = window.open(targetUrl, "_blank", "noopener");
      if (!newWin) {
        console.warn("Popup blocked by the browser. Allow popups for this site to enable this action.");
      }
    });
  }
  return setupBimButton;
});