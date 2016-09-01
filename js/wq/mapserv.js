/*!
 * wq.app 1.0.0b1 - wq/mapserv.js
 * Extension to wq/map.js with support for WMS (coming soon) and ESRI services.
 * (c) 2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['wq/map', 'leaflet', 'esri-leaflet'],
function(map, L, esri) {

map.addBasemapType('esri-basemap', function(conf) {
    var layer;
    if (conf.labels) {
        layer = L.layerGroup([
            esri.basemapLayer(conf.layer, conf),
            esri.basemapLayer(conf.layer + 'Labels', conf)
        ]);
    } else {
        layer = esri.basemapLayer(conf.layer, conf);
    }
    return layer;
});

map.addBasemapType('esri-tiled', function(conf) {
    return esri.tiledMapLayer(conf);
});

map.addOverlayType('esri-dynamic', function(conf) {
    return esri.dynamicMapLayer(conf);
});

map.addOverlayType('esri-tiled', function(conf) {
    return esri.tiledMapLayer(conf);
});

return map;

});
