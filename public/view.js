define([
    // ArcGIS JS API
    "esri/Map",
    "esri/views/SceneView",
    "esri/widgets/Editor",
    "esri/geometry/Mesh",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/widgets/BasemapGallery",
    "esri/geometry/Point",
    "esri/views/Theme",
    "esri/widgets/Sketch",
    // Custom layers
    "./layers/buildings.js",
    "./layers/traffic.js",
    "./layers/osmBuildings.js",
    "./layers/sfBuildings.js"
], function(
    Map,
    SceneView,
    Editor,
    Mesh,
    Graphic,
    GraphicsLayer,
    SketchViewModel,
    BasemapGallery,
    Point,
    Theme,
    Sketch,
    // Custom layers
    buildingsLayer,
    trafficLayer,
    osmBuildings,
    sfBuildings
) {

    // #region Map & Layers

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

    // #endregion

    // #region SceneView Setup

    const view = new SceneView({
        container: "viewDiv",
        map: map,
        camera: {
            position: {
                longitude: 46.6753,
                latitude: 24.7136,
                z: 200000
            },
        },
        spatialReference: { wkid: 3857 },
    });

    // #endregion

    // #region Graphics & Mesh Layer

    const meshGraphicsLayer = new GraphicsLayer();
    map.add(meshGraphicsLayer);

    const createdMeshesUIDs = new Set();

    const sketchVM = new SketchViewModel({
        layer: meshGraphicsLayer,
        view: view,
        tooltipOptions: { enabled: true },
        snappingOptions: {
            enabled: true,
            featureSources: [{ layer: GraphicsLayer }],
        },
    });

    async function createMesh(meshURL, point, rotation = [0, 0, 0]) {
        console.log("Loading 3D model from:", meshURL);
        const mesh = await Mesh.createFromGLTF(point, meshURL);

        // Set the rotation property
        mesh.rotation = rotation; // [x, y, z], in degrees
        console.log("mesh rotation is set to:", mesh.rotation);
        const meshGraphic = new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "white" }
                }]
            }
        });
        meshGraphicsLayer.add(meshGraphic);
        console.log("3D Model added to scene", meshGraphic);
        createdMeshesUIDs.add(meshGraphic.uid);
    }

    // #endregion

    // #region UI Logic

    function createdMeshesUI(geoPoint) {
        // Create the button
        const uiGeoPoint = geoPoint.clone();
        uiGeoPoint.z += 10; // slightly above the model
        console.log("GeoPoint for UI:", uiGeoPoint);
        const btn = document.createElement("button");
        btn.className = "icon-btn";
        btn.onclick = on360btnClicked;
        document.body.appendChild(btn);

        // Add logo icon inside the button
        const img = document.createElement("img");
        img.src = "./images/360Icon.png";
        img.alt = "360 view";
        img.style.width = "24px";
        img.style.height = "24px";
        btn.appendChild(img);

        // Positioning logic
        function updateUIPosition() {
            const screenPoint = view.toScreen(uiGeoPoint);
            btn.style.left = screenPoint.x + "px";
            btn.style.top = screenPoint.y + "px";
            btn.style.display = view.scale < 4000 ? "block" : "none";
        }

        // Initial and reactive positioning
        view.watch("extent", updateUIPosition);
        view.watch("rotation", updateUIPosition);
        view.watch("zoom", updateUIPosition);
        view.when(updateUIPosition);
    }

    // #endregion

    // #region Initial 3D Model

    const alfisalyaPoint = new Point({
        longitude: 46.68443994085816,
        latitude: 24.689733628093425,
        z: 605.5120849609375,
        spatialReference: { wkid: 4326 }
    });
    const example360Point = new Point({
        longitude: 46.64901064735469,
        latitude: 24.68925908310628,
        z: 613.398681640625,
        spatialReference: { wkid: 4326 }
    });
    createMesh("./models/fiaysalia.glb", alfisalyaPoint, [50, 60, 30]);
    createMesh("./models/sign_Tex.glb", example360Point);
    createdMeshesUI(example360Point);
    // #endregion

    // #region Button Click Handlers

    function on360btnClicked() {
        document.getElementById("unityPopup").classList.remove("hidden");
    }

    // #endregion

    // #region View Events

    view.on("click", async function(event) {
        console.log("View clicked event");
        const point = view.toMap(event);

        if (point) {
            console.log("Longitude:", point.longitude, "Latitude:", point.latitude, "Z:", point.z, "Type:", point.type, "SpatialRef:", point.spatialReference);

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
                    createdMeshesUI(point);
                }

                // Show/hide the 360 viewer popup
                const popup = document.getElementById("unityPopup");
                popup.classList.add("hidden");

                view.hitTest(event).then(function(response) {
                    console.log("HitTest response:", response);
                    if (response.results.length > 0) {
                        if (response.results[0].type === "graphic" &&
                            createdMeshesUIDs.has(response.results[0].graphic.uid)
                        ) {
                            console.log("Clicked on a graphic:", response.results[0].graphic);
                            //popup.classList.remove("hidden");
                        }
                    }
                });

            } catch (err) {
                console.error("Error loading 3D model:", err);
            }
        }
    });

    // #endregion

    // #region Basemap Gallery

    const basemapGallery = new BasemapGallery({
        view: view,
        container: "baseMapGallery"
    });
    view.ui.add(basemapGallery);

    // #endregion

    // #region Theme & Traffic Layer

    view.theme = new Theme({
        accentColor: [255, 0, 0, 0.8],
        textColor: [125, 255, 13, 0.9]
    });

    // Traffic toggle
    const toggle = document.getElementById('trafficToggle');
    const toggleContainer = document.querySelector('.toggle-container');
    toggle.disabled = true;
    toggleContainer.classList.add('traffic-loading');
    Promise.all([
        view.when(),
        trafficLayer.when()
    ]).then(() => {
        console.log("Traffic layer is ready");
        toggle.disabled = false;
        // Now you can safely interact with both view and trafficLayer
        toggle.checked = trafficLayer.visible;
        toggleContainer.classList.remove('traffic-loading');
        toggle.addEventListener('change', function() {
            trafficLayer.visible = toggle.checked;
            console.log("Traffic layer visibility set to:", trafficLayer.visible);
        });
    }).catch((err) => {
        console.error("Error loading view or traffic layer:", err);
    });
    view.when(() => {
        AddGoToButtons();
    })

    // #endregion

    // #region Utility Functions

    function printHi() {
        console.log("hi");
    }

    function AddGoToRiyadhBtn() {
        // Implementation here
    }

    function printViewInfo() {
        const center = view.center; // returns a Point object
        const zoom = view.zoom; // current zoom level (for MapView)
        console.log(`Longitude: ${center.longitude}, Latitude: ${center.latitude}, Zoom: ${zoom}`);
    }

    // #endregion
    // #region Buttons

    function AddGoToButtons() {
        // Match button names to coordinates
        const places = {
            "مدينة الرياض": { longitude: 46.6753, latitude: 24.7136, z: 1200 },
            "مدينة سان فرانسيسكو": { longitude: -122.4194, latitude: 37.7749, z: 1200 }
        };
        const buttons = document.querySelectorAll('.saved-place-btn');
        console.log("Buttons NodeList:", buttons);
        buttons.forEach(btn => console.log("City BTN Found :", btn));
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                console.log("Button clicked:", btn.textContent);
                // Remove whitespace for matching
                const btnName = btn.textContent.trim();
                const place = places[btnName];
                if (place) {
                    GoToPlace(place.longitude, place.latitude, place.z);
                }
            });
        });
    }
    // Go to a specific place by longitude, latitude, and optional altitude (z)
    function GoToPlace(longitude, latitude, z = 1000) {
        console.log(`Navigating to Longitude: ${longitude}, Latitude: ${latitude}, Z: ${z}`);
        view.goTo({
            center: [longitude, latitude],
            zoom: 18,
            tilt: 60
        });
    }
    //#endregion



    //#region Sketch Layer

    const sketchLayer = new GraphicsLayer({
        elevationInfo: {
          mode: "absolute-height",
        },
        title: "Sketched geometries",
      });
    map.add(sketchLayer);
    const sketch = new Sketch({
        view,
        container: "sketchWidget",
        layer: sketchLayer,
        toolbarKind: "docked",
      });
sketch.visibleElements = {
        createTools: {
          rectangle: false,
          circle: false,
        },
      };
      // Add the sketchPanel (which includes the sketchWidget <div>) to the view
      view.ui.add("sketchPanel");
     const sketchViewModel = sketch.viewModel;
     sketchViewModel.snappingOptions = {
        enabled: true,
        featureSources: [{ layer: sketchLayer }],
      };
      sketchViewModel.defaultCreateOptions = {
            hasZ: true  // default value
        };
            // Configure how values are displayed in the SketchViewModel
      sketchViewModel.valueOptions = { directionMode: "absolute" };

      // Enable tooltips and labels on SketchViewModel
      sketchViewModel.tooltipOptions = { enabled: true };
      sketchViewModel.labelOptions = { enabled: true };
            // Define the default update behavior of the SketchViewModel
      sketchViewModel.defaultUpdateOptions = {
        tool: "reshape",
        reshapeOptions: {
          edgeOperation: "offset",
          shapeOperation: "move",
        },
      };

            /**********************************************
       * Customize the create and update functionalities
       *********************************************/
      sketchViewModel.on("create", (event) => {
        if (event.tool === "polygon" || event.tool === "polyline") {
          // After completion of a polygon or polyline, have the graphic selected for updating.
          sketchViewModel.creationMode = "update";

          // When starting to draw, always show the absolute direction mode
          if (event.state === "start") {
            sketchViewModel.valueOptions.directionMode = "absolute";
          }

          // After the second vertex is drawn, change to relative direction mode (deflection)
          if (
            event.state === "active" &&
            event.toolEventInfo.type === "vertex-add" &&
            event.toolEventInfo.vertices[0].vertexIndex === 1
          ) {
            sketchViewModel.valueOptions.directionMode = "relative";
          }

          if (event.state === "complete") {
            sketchViewModel.valueOptions.directionMode = "absolute";
          } else if (event.state === "cancel") {
            sketchViewModel.valueOptions.directionMode = "absolute";
          }
        } else {
          // In case of points, after completion, start creating further point graphics.
          sketchViewModel.creationMode = "continuous";
        }
      });
      sketchViewModel.on("update", (event) => {
        // Show the edge operation buttons only when polygons or polylines are drawn
        if (event.state === "start") {
          if (
            event.graphics[0].geometry.type === "polygon" ||
            event.graphics[0].geometry.type === "polyline"
          ) {
            edgeOperationButtons.style.display = "inline";
          }
        }
        if (event.state === "complete") {
          edgeOperationButtons.style.display = "none";
        }
      });

    //end of Sketch Layer
    return view;
});


/*

Um ALhamam
46.64901064735469 Latitude: 24.68925908310628 Z: 613.398681640625
*/