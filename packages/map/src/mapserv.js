import map from './map';
import L from 'leaflet';
import * as esri from 'esri-leaflet';
import wms from 'leaflet.wms';

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

map.addOverlayType('esri-feature', function(conf) {
    return esri.featureLayer(conf);
});

map.addBasemapType('wms-tiled', function(conf) {
    return wms.tileLayer(conf.url, conf);
});

map.addOverlayType('wms', function(conf) {
    return wms.overlay(conf.url, conf);
});

map.addOverlayType('wms-tiled', function(conf) {
    return wms.tileLayer(conf.url, conf);
});

export default map;
