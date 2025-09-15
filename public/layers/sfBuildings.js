define(["esri/layers/SceneLayer"], function(SceneLayer) {
  return new SceneLayer({
    url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/SF_BLDG_WSL1/SceneServer",
    renderer: {
      type: "simple",
      symbol: {
        type: "mesh-3d",
        symbolLayers: [
          {
            type: "fill",
            material: {
              color: [255, 255, 255, 1],
              colorMixMode: "multiply"
            },
            edges: {
              type: "solid",
              color: [133, 108, 62, 0.5],
              size: 1
            }
          }
        ]
      }
    }
  });
});