define([
  "esri/views/SceneView",
  "esri/widgets/Editor",
  "esri/geometry/Mesh",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/geometry/Point",
  "./map.js"
], function(SceneView, Editor, Mesh, Graphic, GraphicsLayer, SketchViewModel, Point, map) {

  const view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      position: {
        longitude: 46.6753,
        latitude: 24.7136,
        z: 2000
      },
      tilt: 60
    },
    spatialReference: { wkid: 3857 },
  });

  // const editor = new Editor({ view });
  // view.ui.add(editor, "top-right");

  // Create a graphics layer for 3D models
  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  console.log("View created");

  console.log("Setting up SketchViewModel");

  const sketchVM = new SketchViewModel({
    layer: graphicsLayer,
    view: view,
    tooltipOptions: { enabled: true },
    snappingOptions: {
      enabled: true,
      featureSources: [{ layer: GraphicsLayer }],
    },
  });

  async function createMesh(meshURL, point) {
    console.log("Loading 3D model from:", meshURL);
    const mesh = await Mesh.createFromGLTF(point, meshURL);
    const meshGraphic = new Graphic({
      geometry: mesh,
      symbol: {
        type: "mesh-3d", // MeshSymbol3D
        symbolLayers: [{
          type: "fill",
          material: { color: "white" } // Textures in GLB should show automatically
        }]
      }
    });
    graphicsLayer.add(meshGraphic);
    console.log("3D Model added to scene");
  }

  const geoPoint = new Point({
    longitude:  46.68443994085816 ,   // X (Lon)
    latitude:24.689733628093425,    // Y (Lat)
    z: 605.5120849609375 ,               // Elevation in meters
    spatialReference: { wkid: 4326 }
  });

  createMesh("./models/fiaysalia.glb",geoPoint);

  view.on("click", async function(event) {
    console.log("View clicked event");
    const point = view.toMap(event);

    if (point) {
      console.log("Longitude:", point.longitude, "Latitude:", point.latitude , "Z:", point.z, "Type:", point.type, "SpatialRef:", point.spatialReference);

      try {
        // HitTest against operational layers (excluding basemap)
        const hitResponse = await view.hitTest(event, {
          include: view.map.layers
        });

        if (hitResponse.results.length > 0) {
          console.log("Clicked an operational layer:", hitResponse.results[0].graphic);
        } else {
          console.log("Clicked only basemap (or empty background)");
          createMesh("./models/sign_Tex.glb", point);
        }

        // Show/hide the 360 viewer popup
        const popup = document.getElementById("unityPopup");
        // Hide first. This prevents duplicate popups and closes when clicking empty
        popup.classList.add("hidden");

        view.hitTest(event).then(function(response) {
          console.log("HitTest response:", response);
          if(response.results.length > 0) {
            if(response.results[0].type === "graphic") {
              console.log("Clicked on a graphic:", response.results[0].graphic);
              popup.classList.remove("hidden");
            }
          }
        });

      } catch (err) {
        console.error("Error loading 3D model:", err);
      }
    }
  });

  return view;
});
function printHi(){
  console.log("hi");
}