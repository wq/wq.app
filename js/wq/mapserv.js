/*!
 * wq.app 1.0.0a1 - wq/mapserv.js
 * Extension to wq/map.js with support for WMS (coming soon) and ESRI services.
 * (c) 2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['wq/map', 'esri-leaflet'],
function(map, esri) {

map.addBasemapType('esri-tiled', function(conf) {
    return esri.tiledMapLayer(conf);
});

map.addOverlayType('esri-dynamic', function(conf) {
    return esri.dynamicMapLayer(conf);
});

return map;

});
