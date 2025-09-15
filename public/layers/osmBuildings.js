define(["esri/layers/SceneLayer"], 
    function(SceneLayer) {
  return new SceneLayer({
    url: "https://basemaps3d.arcgis.com/arcgis/rest/services/Open3D_Buildings_v1/SceneServer",
    renderer:{
      type: "simple",
      symbol: {
        type: "mesh-3d",
        symbolLayers: [
          {
            type: "fill",
            material: {
              color: [255, 0, 0, 0
                
              ],
              colorMixMode: "multiply"
            },
          }
        ]
      }
    }
  });
});