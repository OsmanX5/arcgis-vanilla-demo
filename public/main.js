require([
    "esri/config",
    "./view.js",
], function(esriConfig, view) {
    esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurOjQSQBrLBUOkB75ffCJG76BqC-B-PbCirDIJRV6jZfY_qIe-fMxMHIVJ012_FgFSLtN0gaIbs9uxleEO3Q7-ebGP3O_GJCGdgGGjg-umCSq-pwbtdQgANFS7k-TGtyRcH8ONYs_AC7t2fnGgcrEIYvlFkMHUKBYEEqrV0KU0etzowwWWjxWLIfC7S90-qkL580z_RmUFI_x2Sx8DIfxAIs.AT1_Z9ZhWx9M";
    console.log("API Key set");
    // mapModule contains map and all layers as properties
    //setupBimButton(view, mapModule.map);
    console.log("Main module loaded");

    //   setupLayerToggles({
    //     buildings: mapModule.buildingsLayer,
    //     osmBuildings: mapModule.osmBuildings,
    //     sfBuildings: mapModule.sfBuildings,
    //     traffic: mapModule.trafficLayer
    // });


});