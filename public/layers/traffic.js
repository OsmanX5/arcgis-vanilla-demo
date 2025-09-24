define(["esri/layers/MapImageLayer"], function(MapImageLayer) {
    const trafficLayer = new MapImageLayer({
        url: "https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer",
        dpi: 48,
        imageFormat: "png32",
        refreshInterval: 3, // refresh the layer every 3 minutes
        useViewTime: false,
    });
    // Debug logs here if you want!
    trafficLayer.when(
        () => console.log("[Traffic] Layer loaded OK"),
        (err) => console.error("[Traffic] Layer failed to load:", err)
    );
    return trafficLayer;
});