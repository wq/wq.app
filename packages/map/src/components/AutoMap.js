import React from 'react';
import { useComponents } from '@wq/react';
import { useMapState, useOverlayComponents } from '../hooks';

export default function AutoMap() {
    const state = useMapState(),
        {
            Map,
            AutoBasemap,
            AutoOverlay,
            Legend,
            BasemapToggle,
            OverlayToggle
        } = useComponents(),
        { Highlight } = useOverlayComponents();

    if (!state) {
        return null;
    }
    const { basemaps, overlays, bounds, mapProps, highlight } = state;
    return (
        <Map bounds={bounds} {...mapProps}>
            <Legend>
                {basemaps.map((conf, i) => (
                    <BasemapToggle
                        key={i}
                        name={conf.name}
                        active={conf.active}
                    >
                        <AutoBasemap {...conf} />
                    </BasemapToggle>
                ))}
                {overlays.map((conf, i) => (
                    <OverlayToggle
                        key={i}
                        name={conf.name}
                        active={conf.active}
                    >
                        <AutoOverlay {...conf} />
                    </OverlayToggle>
                ))}
            </Legend>
            {highlight && <Highlight data={highlight} />}
        </Map>
    );
}

/*
FIXME:
// Primary map routine
function createMap(routeInfo, divid, mapname, $page) {
    const map = {},
        _getConf = () => {},
        L = {};
    var mapid, mapconf, m, defaults, layerConfs, layers, basemaps, basemap, div;

    // Load configuration and div id
    mapconf = _getConf(routeInfo.page, routeInfo.mode, mapname);
    defaults = map.config.defaults;
    mapid = map.getMapId(routeInfo, mapname);

    if (!divid) {
        if (mapconf.div) {
            divid = mapconf.div;
        } else {
            divid = mapid + '-map';
        }
    }

    div = L.DomUtil.get(divid);
    if (!div) {
        // Skip map creation if the expected div doesn't exist
        console.log(divid + ' not found; skipping map creation');
        return;
    }

    // Make sure leaflet hasn't already been initialized for this map
    if (div._leaflet) {
        // This is probably an onshow event for a page that was rendered
        // and then went offscreen before coming back; refresh layout.
        m = map.maps[mapid];
        m.invalidateSize();
        if (defaults.autoZoom.sticky) {
            m.fitBounds(defaults.lastBounds || defaults.bounds);
        }
        return;
    }

    // Create map, set default zoom and basemap
    var opts = {};
    if (defaults.maxBounds) {
        opts.maxBounds = defaults.maxBounds;
    }
    m = map.maps[mapid] = L.map(divid, opts);
    m.fitBounds(defaults.lastBounds || defaults.bounds);
    basemaps = map.createBasemaps();
    basemap = Object.keys(basemaps)[0];
    basemaps[basemap].addTo(m);
    map.basemaps[mapid] = basemaps;

    // Load layerconfs and add empty layer groups to map
    layers = {};
    layerConfs = map.getLayerConfs(routeInfo, mapname);
    var overlays = layerConfs.map(map.createOverlay);
    var results = [];
    layerConfs.forEach(function(layerconf, i) {
        var layer = overlays[i];
        layers[layerconf.name] = layer;
        if (layer.ready) {
            results.push(layer.ready);
        }
        if (!layerconf.noAutoAdd) {
            layer.addTo(m);
        }
    });
    map.layers[mapid] = layers;

    if (!mapconf.noLayerControl) {
        map.createLayerControl(basemaps, layers, routeInfo, mapname).addTo(m);
    }

    Promise.all(results).then(autoZoom);

    function autoZoom() {
        if (mapconf.autoZoom !== undefined && !mapconf.autoZoom) {
            return;
        }
        if (!map.config.defaults.autoZoom) {
            return;
        }
        var lnames = Object.keys(layers);
        if (!lnames.length) {
            return;
        }
        var bounds;
        lnames.forEach(function(lname) {
            if (!layers[lname].getBounds) {
                return;
            }
            if (!m.hasLayer(layers[lname])) {
                return;
            }
            var layerBounds = layers[lname].getBounds();
            if (bounds) {
                bounds.extend(layerBounds);
            } else if (layerBounds.isValid()) {
                bounds = layerBounds;
            }
        });
        if (mapconf.minBounds) {
            if (bounds) {
                bounds.extend(mapconf.minBounds);
            } else {
                bounds = mapconf.minBounds;
            }
        } else if (!bounds) {
            bounds = map.config.defaults.bounds;
        }
        setTimeout(function() {
            m.fitBounds(bounds, map.config.defaults.autoZoom);
        }, map.config.defaults.autoZoom.wait * 1000);
    }

    if (map.config.defaults.autoZoom.sticky) {
        m.on('moveend', function() {
            const bounds = m.getBounds();
            if (!bounds.isValid()) {
                return;
            }
            if (bounds.getSouthWest().equals(bounds.getNorthEast())) {
                return;
            }
            map.config.defaults.lastBounds = bounds;
        });
    }

    // Ensure valid layout on screen
    setTimeout(function() {
        m.invalidateSize();
    }, 100);

    if (!$page) {
        return;
    }
    // Try to ensure no Leaflet widgets are enhanced by jQuery Mobile
    var $controls = $page.find('.leaflet-control-container');
    $controls.find('input').attr('data-role', 'none');

    if (mapconf.onshow) {
        console.error('wq/map onshow removed in 1.0 - use a wq/app plugin');
    }

    if (routeInfo.mode == 'edit' && L.Control.Draw) {
        var drawLayer = null;
        layerConfs.forEach(function(layerConf) {
            if (layerConf.draw && layerConf.type == 'geojson') {
                drawLayer = layerConf;
            }
        });
        if (drawLayer) {
            var geomname = drawLayer.geometryField || 'geometry';
            var $geom = $page.find('[name=' + geomname + ']');
            layers[drawLayer.name].ready.then(function(layer) {
                map.addDrawControl(m, layer, drawLayer, $geom);
            });
        }
    }

    return m;
}
*/
