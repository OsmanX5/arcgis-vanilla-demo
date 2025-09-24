
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
    "esri/widgets/TimeSlider",
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
    TimeSlider,
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
        //buildingsLayer,
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
                z: 10000000
            },
        },
        spatialReference: { wkid: 3857 },
        qualityProfile: "high"
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
        const meshOriginal = await Mesh.createFromGLTF(point, meshURL);
        const mesh = meshOriginal.clone();
        mesh.rotate(rotation[0], rotation[1], rotation[2]);
        console.log("mesh.transform.rotation is set to:", mesh.transform.rotation);

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
    createMesh("./models/fiaysalia.glb", alfisalyaPoint,[0,0,-65]);
    createMesh("./models/sign_Tex.glb", example360Point);
    createdMeshesUI(example360Point);
    // #endregion

    // #region Button Click Handlers

    function on360btnClicked() {
        document.getElementById("unityPopup").classList.remove("hidden");
    }
    function showProjectInputData() {
        document.getElementById("projectDataInput").classList.remove("hidden");
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
            console.log("Polygon/polyline creation complete");
            console.log(event);
            if(event.tool =="polyline"){
                console.log("Polyline created");
                const polylineGraphic = event.graphic;
                const polylineGeom = polylineGraphic.geometry;
                console.log("Polyline geometry:", polylineGeom);
                const startPoint = {
                    x: polylineGeom.paths[0][0][0],
                    y: polylineGeom.paths[0][0][1],
                };
                console.log("Start point:", startPoint);
                createTheConcerateWalls(polylineGeom);
                showProjectInputData();
            }
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
          // Calculate and print the distance between the first and second points of a polyline
    function createTheConcerateWalls(polylineGeom) {
        const concreteWidth = 1.24;
        if (!polylineGeom || !polylineGeom.paths || polylineGeom.paths.length === 0 || polylineGeom.paths[0].length < 2) {
            console.warn("Polyline does not have at least two points.");
            return;
        }
        // Repeat for every segment in the path
        require(["esri/geometry/geometryEngine"], function(geometryEngine) {
            const path = polylineGeom.paths[0];
            // Place concrete meshes for all segments
            for (let seg = 0; seg < path.length - 1; seg++) {
                const pt1 = new Point({
                    x: path[seg][0],
                    y: path[seg][1],
                    z: path[seg][2],
                    spatialReference: polylineGeom.spatialReference
                });
                const pt2 = new Point({
                    x: path[seg + 1][0],
                    y: path[seg + 1][1],
                    z: path[seg + 1][2],
                    spatialReference: polylineGeom.spatialReference
                });
                const dist = geometryEngine.distance(pt1, pt2, "meters");
                const numberOfNeededConcretes = Math.floor(dist / concreteWidth);

                // Calculate direction vector (unit vector)
                const dx = pt2.x - pt1.x;
                const dy = pt2.y - pt1.y;
                const dz = (pt2.z || 0) - (pt1.z || 0);
                const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
                const ux = dx / length;
                const uy = dy / length;
                const uz = dz / length;

                // Place meshes along the segment with correct rotation
                const offset = 0.2; // 20 cm in meters
                const headingRad = Math.atan2(dy, dx);
                const headingDeg = headingRad * 180 / Math.PI;
                for (let i = 0; i < numberOfNeededConcretes; i++) {
                    const step = concreteWidth * i + offset * i;
                    if (step > dist - 1) break;
                    const px = pt1.x + ux * step;
                    const py = pt1.y + uy * step;
                    const pz = (pt1.z || 0) + uz * step;
                    const meshPoint = new Point({
                        x: px,
                        y: py,
                        z: pz,
                        spatialReference: pt1.spatialReference
                    });
                    createMesh("./models/concrete.glb", meshPoint, [0, 0, headingDeg]);
                }
            }

            // Place sign_Tex.glb only in front of the second point in the path
            // if (path.length >= 2) {
            //     const pt1 = new Point({
            //         x: path[0][0],
            //         y: path[0][1],
            //         z: path[0][2],
            //         spatialReference: polylineGeom.spatialReference
            //     });
            //     const pt2 = new Point({
            //         x: path[1][0],
            //         y: path[1][1],
            //         z: path[1][2],
            //         spatialReference: polylineGeom.spatialReference
            //     });
            //     const dx = pt2.x - pt1.x;
            //     const dy = pt2.y - pt1.y;
            //     const dz = (pt2.z || 0) - (pt1.z || 0);
            //     const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
            //     const ux = dx / length;
            //     const uy = dy / length;
            //     const uz = dz / length;
            //     const headingRad = Math.atan2(dy, dx);
            //     const headingDeg = headingRad * 180 / Math.PI;
            //     const signDist = 1; // 1 meter in front
            //     const signPx = pt2.x + ux * signDist;
            //     const signPy = pt2.y + uy * signDist;
            //     const signPz = (pt2.z || 0) + uz * signDist;
            //     const signPoint = new Point({
            //         x: signPx,
            //         y: signPy,
            //         z: signPz,
            //         spatialReference: pt2.spatialReference
            //     });
            //     createMesh("./models/sign_Tex.glb", signPoint, [0, 0, headingDeg]);
            // }
        });
    }
    //end of Sketch Layer

    // #region Time Slider
    const timeSlider = new TimeSlider({
    container: "timeSliderDiv",
    view: view,
        // show data within a given time range
        // in this case data within one year
    mode: "instant",
        fullTimeExtent: { // entire extent of the timeSlider
            start: new Date(2024, 11, 1),
            end: new Date(2024, 12, 1)
        },
        timeExtent: { // location of timeSlider thumbs
            start: new Date(2024, 11, 1),
            end: new Date(2024, 12, 1)
        },
    });
        timeSlider.watch("timeExtent", () => {
          // only show earthquakes happened up until the end of
          // timeSlider's current time extent.
          console.log(timeSlider.timeExtent.end.getTime());
          setDate(timeSlider.timeExtent.end.getTime());
        });
    view.ui.add(timeSlider,);



    function setDate(time) {
        console.log("Selected date:", time);
        // Update traffic layer time extent
        trafficLayer.timeExtent = {
            start: time,
            end: time,
        };
    }
    // #endregion
    return view;
});


/*

Um ALhamam
46.64901064735469 Latitude: 24.68925908310628 Z: 613.398681640625
*/