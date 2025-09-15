define([
  "esri/Map",
  "./layers/buildings.js",
  "./layers/traffic.js",
  "./layers/osmBuildings.js",
  "./layers/sfBuildings.js"
], function(Map, buildingsLayer, trafficLayer, osmBuildings, sfBuildings) {
  const map = new Map({
    basemap: "satellite",
    ground: "world-elevation"
  });

  map.addMany([
    buildingsLayer,
    trafficLayer,
    osmBuildings,
    sfBuildings
  ]);

  return map;
});