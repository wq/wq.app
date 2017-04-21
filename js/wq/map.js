/*!
 * wq.app 1.0.0-dev - wq/map.js
 * Leaflet integration for wq/app.js pages
 * (c) 2013-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['leaflet', './json', './spinner', './template', './console'],
function(L, json, spin, tmpl, console) {

// module variable
var map = {
    'name': "map"
};

// module configuration
map.config = {
    'maps': {}, // Auto-populated from app.config.pages where map == true
    'defaults': {
        'bounds': [[-4, -4], [4, 4]],
        'autoZoom': {
            'wait': 0.5, // How long to wait before triggering autoZoom
            'sticky': true, // Start new maps in same location as old maps

            // Settings for fitBounds
            'maxZoom': 13,
            'animate': true
        },

        // Defaults to simplify creation of new icons of the same dimensions
        // as L.Icon.Default
        'icon': {
            'iconSize':    [25, 41],
            'iconAnchor':  [12, 41],
            'popupAnchor': [1, -34],
            'shadowSize':  [41, 41]
        },

        'basemaps': _defaultBasemaps()
    }
};

// References to generated map objects
map.maps = {};

// References to generated icons
map.icons = {
    'default': new L.Icon.Default()
};

// This will be called by app.init()
map.init = function(defaults) {
    var app = map.app;
    if (!app) {
        console.warn(
            "Call app.use(map) rather than calling map.init() directly"
        );
        app = require('wq/app');
        app.use(map);
    }

    // Auto-detect whether CRS-aware GeoJSON parser is available
    map.geoJson = L.Proj ? L.Proj.geoJson : L.geoJson;

    // Assign after module load in case L.Icon.Default.imagePath is overridden
    map.config.defaults.icon.shadowUrl = (
        map.icons['default']._getIconUrl('shadow')
    );

    if (defaults) {
        L.extend(map.config.defaults, defaults);
    }

    // Define map configuration for all app pages with map=True
    Object.keys(app.config.pages).forEach(function(page) {
        var pconf = app.config.pages[page],
            mconf = pconf.map;

        if (!mconf) {
            return;
        } else if (mconf === true) {
            mconf = [];
        } else if (!json.isArray(mconf)) {
            mconf = [mconf];
        }

        var mapconf = {
            'name': pconf.name,
            'url': pconf.url,
            'defaults': {
                'maps': {
                    'main': {
                        'layers': []
                    }
                }
            }
        };

        // Initialize map configurations for each page display mode
        mconf.forEach(function(conf) {
            var mode = conf.mode || 'defaults',
                map = conf.map || 'main';
            if (mode == 'all') {
                mode = 'defaults';
            }
            if (!mapconf[mode]) {
                mapconf[mode] = {
                    maps: {}
                };
            }
            mapconf[mode].maps[map] = conf;
        });

        // Ensure map configurations exist for all list page modes
        var modes = [];
        if (pconf.modes) {
            modes = pconf.modes;
        } else if (pconf.list) {
            modes = ['list', 'detail', 'edit'];
        }
        modes.forEach(function(mode) {
            if (mapconf[mode]) {
                if (mapconf[mode].maps &&
                        mapconf[mode].maps.main &&
                        mapconf[mode].maps.main.autoLayers &&
                        !mapconf[mode].maps.main.layers) {
                    mapconf[mode].maps.main.layers = [];
                }
                return;
            }
            mapconf[mode] = {
                'maps': {
                    'main': {
                        'autoLayers': true,
                        'layers': []
                    }
                }
            };
        });
        map.config.maps[page] = mapconf;

        if (pconf.list) {
            map.addAutoLayers(page);
        }
    });
};

// Plugin API
map.run = function($page, routeInfo) {
    var mapconf = map.config.maps[routeInfo.page],
        mode = routeInfo.mode,
        maps = [];
    if (!mapconf) {
        return;
    }
    if (mapconf[mode] && mapconf[mode].maps) {
        maps = Object.keys(mapconf[mode].maps);
    } else {
        maps = ['main'];
    }
    maps.forEach(function(mapname) {
        var divid = map.getMapId(routeInfo, mapname) + '-map',
            $div = $page.find('#' + divid);
        map.createMap(routeInfo, $div[0], mapname, $page);
    });
};

// Add a layer configuration (layerconf) to a map configuration
map.addLayerConf = function(page, layerconf, mode, mapname) {
    if (!mode) {
        mode = 'defaults';
    }
    if (!mapname) {
        mapname = 'main';
    }
    if (!map.config.maps[page]) {
        throw 'Configuration for "' + page + '" not found!';
    }
    if (!map.config.maps[page][mode]) {
        throw 'Configuration for mode "' + mode + '" not found!';
    }
    if (!layerconf.type) {
        layerconf.type = 'geojson';
    }
    if (!map.createOverlay[layerconf.type]) {
        throw 'Unknown layer type "' + layerconf.type + '"!';
    }
    map.config.maps[page][mode].maps[mapname].layers.push(layerconf);
};

// Define an icon for use by list items displayed as points
map.createIcon = function(name, options) {
    options = L.extend({}, map.config.defaults.icon, options);
    map.icons[name] = L.icon(options);
    return map.icons[name];
};

map.onEachFeature = function(name, callback) {
    map.onEachFeature[name] = callback;
};

// Compute default layer configuration for wq REST API
map.addAutoLayers = function(page) {
    var listConf = _getConf(page, 'list', 'main');
    if (listConf.autoLayers) {
        map.addLayerConf(page, {
            'name': listConf.name,
            'type': 'geojson',
            'url': '{{{url}}}.geojson',
            'popup': page,
            'cluster': true
        }, 'list');
    }

    var detailConf = _getConf(page, 'detail', 'main');
    if (detailConf.autoLayers) {
        map.addLayerConf(page, {
            'name': detailConf.name,
            'type': 'geojson',
            'url': detailConf.url + '/{{{id}}}.geojson',
            'popup': page
        }, 'detail');
    }

    var editConf = _getConf(page, 'edit', 'main');
    if (editConf.autoLayers) {
        map.addLayerConf(page, {
            'name': editConf.name,
            'type': 'geojson',
            'url': editConf.url + '/{{{id}}}/edit.geojson',
            'flatten': true,
            'draw': {
                'polygon': {},
                'polyline': {},
                'marker': {},
                'rectangle': {},
                'circle': false
            }
        }, 'edit');
    }
};

// Load map configuration for the given page
map.getLayerConfs = function(routeInfo, mapname) {
    var page = routeInfo.page, itemid = routeInfo.item_id,
        mode = routeInfo.mode, url = routeInfo.path,
        outboxId = routeInfo.outbox_id;
    if (!mode) {
        if (map.app.config.pages[page].list) {
            mode = itemid ? 'list' : 'detail';
        }
    }
    if (!mapname) {
        mapname = 'main';
    }
    var mapconf = _getConf(page, mode, mapname);
    var layers = [];
    if (!url) {
        url = mapconf.url;
        if (itemid) {
             url += '/' + itemid;
        }
    }
    mapconf.layers.forEach(function(layerconf) {
        var parts = url.split('?'),
            baseurl = parts[0].replace(/\/$/, ''),
            params = parts[1] && ("?" + parts[1]) || "";
        layerconf = L.extend({}, layerconf);
        if (layerconf.url.indexOf('{{') > -1) {
            layerconf.url = tmpl.render(layerconf.url, L.extend({
                'id': itemid,
                'url': baseurl
            }, routeInfo.item || {}));
            if (params && layerconf.url.indexOf('?') > -1) {
                params = params.replace(/^\?/, "&");
            }
            layerconf.url += params;
        }
        if (outboxId && layerconf.draw) {
            var geomname = layerconf.geometryField || 'geometry';
            var geom = (routeInfo.context || {})[geomname];
            if (geom) {
                layerconf.initData = JSON.parse(geom);
            } else {
                layerconf.initData = {
                   'type': 'FeatureCollection', 'features': []
                };
            }
        }
        layers.push(layerconf);
    });
    return layers;
};

// GeoJSON loading function - override to customize
map.cache = {};
map.loadLayer = function(url) {
    url = map.app.service + '/' + url;
    if (map.cache[url]) {
        return Promise.resolve(map.cache[url]);
    }
    // Ignore requests for "new.geojson"
    if (url.match(/\/(new)?(\/edit)?\.geojson$/)) {
        return Promise.resolve(null);
    }
    spin.start();
    return json.get(url).then(function(geojson) {
        spin.stop();
        map.cache[url] = geojson;
        return geojson;
    }, function() {
        spin.stop();
        return null;
    });
};

// Default base map configuration - override to customize
function _defaultBasemaps() {
    /* jshint maxlen: false */
    var cdn = '//stamen-tiles-{s}.a.ssl.fastly.net/{layer}/{z}/{x}/{y}.jpg';
    var attr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.';
    if (!document.location.protocol.match('http')) {
        cdn = 'https:' + cdn;
    }

    return [
        {
            'name': "Stamen Terrain",
            'type': 'tile',
            'url': cdn,
            'layer': 'terrain',
            'attribution': attr
        }
    ];
}


// Configuration-based basemap creation functions
map.createBasemaps = function() {
    var basemaps = {};
    map.config.defaults.basemaps.forEach(function(layerconf) {
        basemaps[layerconf.name] = map.createBasemap(layerconf);
    });
    return basemaps;
};

map.createBasemap = function(layerconf) {
    var fn = map.createBasemap[layerconf.type];
    if (!fn) {
        throw 'Unknown basemap type "' + layerconf.type + '"!';
    }
    return fn(layerconf);
};

map.addBasemapType = function(type, fn) {
    map.createBasemap[type] = fn;
};

map.addBasemapType('tile', function(layerConf) {
    return L.tileLayer(layerConf.url, layerConf);
});

// Configuration-based overlay creation functions
map.createOverlay = function(layerconf) {
    var fn = map.createOverlay[layerconf.type];
    if (!fn) {
        throw 'Unknown overlay type "' + layerconf.type + '"!';
    }
    return fn(layerconf);
};

map.addOverlayType = function(type, fn) {
    map.createOverlay[type] = fn;
};

map.addOverlayType('geojson', function(layerconf) {
    var overlay;
    if (layerconf.cluster && L.MarkerClusterGroup) {
        var options = {};
        if (layerconf.clusterIcon) {
            options.iconCreateFunction = _makeCluster(layerconf.clusterIcon);
        }
        overlay = new L.MarkerClusterGroup(options);
    } else {
        overlay = L.featureGroup();
    }

    var getData;
    if (layerconf.initData) {
        getData = Promise.resolve(layerconf.initData);
    } else {
        getData = map.loadLayer(layerconf.url);
    }

    // Load layer content as JSON
    overlay.ready = getData.then(function(geojson) {
        var options = {}, popup, oneach;
        if (!geojson || !geojson.type) {
            console.warn("Ignoring empty or malformed GeoJSON result.");
            return overlay;
        }
        if (layerconf.popup) {
            popup = map.renderPopup(layerconf.popup);
        }
        if (layerconf.oneach) {
            if (typeof layerconf.oneach == 'function') {
                oneach = layerconf.oneach;
            } else {
                oneach = map.onEachFeature[layerconf.oneach];
            }
        }
        if (oneach && popup) {
            options.onEachFeature = function(feat, layer) {
                popup(feat, layer);
                oneach(feat, layer);
            };
        } else if (oneach) {
            options.onEachFeature = oneach;
        } else if (popup) {
            options.onEachFeature = popup;
        }
        if (layerconf.icon) {
            options.pointToLayer = _makeMarker(layerconf.icon);
        }
        if (layerconf.style) {
            options.style = layerconf.style;
        }
        if (geojson.type == 'GeometryCollection') {
            geojson = {'type': 'Feature', 'geometry': geojson};
        }
        if (layerconf.draw && geojson.type == 'Feature' &&
                geojson.geometry.type == 'GeometryCollection') {
            // Leaflet.draw doesn't support GeometryCollection
            geojson = {
                'type': 'FeatureCollection',
                'features': geojson.geometry.geometries.map(function(geom) {
                     return {
                         'type': 'Feature',
                         'geometry': geom
                     };
                })
            };
        }
        var gjLayer = map.geoJson(geojson, options);
        if (layerconf.cluster && L.MarkerClusterGroup) {
            gjLayer.getLayers().forEach(function(layer) {
                layer.addTo(overlay);
            });
        } else {
            gjLayer.addTo(overlay);
        }
        return gjLayer;
    });

    return overlay;
});

// Hooks for customizing layer and draw controls
map.createLayerControl = function(basemaps, layers, routeInfo, mapname) {
    /* jshint unused: false */
    return L.control.layers(basemaps, layers);
};

map.addDrawControl = function(m, layer, layerconf, $geom) {
    var control = new L.Control.Draw({
        'draw': layerconf.draw,
        'edit': {'featureGroup': layer}
    }).addTo(m);

    m.on('draw:created', function(e) {
        layer.addLayer(e.layer);
        save();
    });

    m.on('draw:edited', save);
    m.on('draw:deleted', save);

    var $submit = $geom.parents('form').find('[type=submit]');
    m.on('draw:drawstart draw:editstart draw:deletestart', function() {
        $submit.attr('disabled', true);
    });

    m.on('draw:drawstop draw:editstop draw:deletestop', function() {
        $submit.attr('disabled', false);
    });

    save();

    return control;

    function flatten(geojson) {
        var geoms = [];
        if (geojson.type == 'FeatureCollection') {
            geojson.features.forEach(function(feature) {
                addGeometry(feature.geometry);
            });
        }
        if (geoms.length == 1) {
            return geoms[0];
        } else {
            return {
                'type': 'GeometryCollection',
                'geometries': geoms
            };
        }
        function addGeometry(geometry) {
            if (geometry.type == 'GeometryCollection') {
                geometry.geometries.forEach(addGeometry);
            } else {
                geoms.push(geometry);
            }
        }
    }

    function save() {
        var geojson = layer.toGeoJSON();
        if (layerconf.flatten) {
            // Flatten FeatureCollection into single Geometry (or
            // GeometryCollection).
            geojson = flatten(geojson);
        }
        $geom.val(JSON.stringify(geojson));
        map.cache = {};
    }
};

// Default popup renderer for items - override to customize
// (assumes template called [page]_popup)
map.renderPopup = function(page) {
    return function(feat, layer) {
        var attrs = L.extend({'id': feat.id}, feat.properties);
        layer.bindPopup(
            tmpl.render(page + '_popup', attrs)
        );
    };
};

map.getMapId = function(routeInfo, mapname) {
    var rt = routeInfo, parts = [];
    if (rt.item_id) {
        if (rt.mode == 'detail') {
            parts = [rt.page, rt.item_id];
        } else {
            parts = [rt.page, rt.item_id, rt.mode];
        }
    } else if (routeInfo.parent_page) {
        parts = [rt.parent_page, rt.parent_id, rt.page];
    } else {
        parts = [rt.page];
    }
    if (mapname && mapname != 'main') {
        parts.push(mapname);
    }
    return parts.join('-');
};

map.getMap = function(routeInfo, mapname) {
    var mapid = map.getMapId(routeInfo, mapname);
    return map.maps[mapid] || null;
};

// Primary map routine
map.createMap = function(routeInfo, divid, mapname, $page) {
    var mapid, mapconf, m, defaults,
        layerConfs, layers,
        basemaps, basemap, div;

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

    if (!mapconf.noLayerControl) {
        map.createLayerControl(
            basemaps, layers, routeInfo, mapname
        ).addTo(m);
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
            map.config.defaults.lastBounds = m.getBounds();
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
    var $controls = $page.find(".leaflet-control-container");
    $controls.find("input").attr("data-role", "none");

    if (mapconf.onshow) {
        mapconf.onshow(m, layers, basemaps, routeInfo, mapname);
    }

    if (routeInfo.mode == 'edit' && L.Control.Draw) {
        var drawLayer = null;
        layerConfs.forEach(function(layerConf) {
             if (layerConf.draw && layerConf.type == "geojson") {
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
};

// Internal function for creating markers (used with layerconf.icon)
function _makeMarker(icon) {
    return function pointToLayer(geojson, latlng) {
        // Define icon as a function to customize per-feature
        var key;
        if (typeof icon == 'function') {
            key = icon(geojson.properties);
        } else if (icon.indexOf('{{') > -1){
            key = tmpl.render(icon, geojson.properties);
        } else {
            key = icon;
        }
        return L.marker(latlng, {'icon': map.icons[key]});
    };
}

function _makeCluster(clusterIcon) {
    return function clusterDiv(cluster) {
        var cls;
        var context = {
            'count': cluster.getChildCount()
        };
        if (context.count >= 100) {
            context.large = true;
        } else if (context.count >= 10) {
            context.medium = true;
        } else {
            context.small = true;
        }
        if (typeof clusterIcon == 'function') {
            cls = clusterIcon(context);
        } else if (clusterIcon.indexOf('{{') > -1) {
            cls = tmpl.render(clusterIcon, context);
        } else {
            cls = clusterIcon;
        }
        var html = tmpl.render('<div><span>{{count}}</span></div>', context);
        return new L.DivIcon({
            html: html,
            className: 'marker-cluster ' + cls,
            iconSize: new L.Point(40, 40)
        });
    };
}

// Load map configuration for a given page
function _getConf(page, mode, mapname) {
    var conf = map.config.maps[page];
    if (!conf) {
        throw 'Configuration for "' + page + '" not found!';
    }
    if (!mapname) {
        mapname = 'main';
    }

    // Start with defaults, override with mode-specific options
    var mapconf = L.extend(
        {},
        conf.defaults.maps[mapname] || {},
        (conf[mode] || {'maps': {}}).maps[mapname] || {}
    );
    // Combine (rather than overwrite) defaults + mode-specific layers
    if (mode && mode != 'defaults' &&
          conf.defaults.maps[mapname] &&
          conf.defaults.maps[mapname].layers) {
        mapconf.layers = conf.defaults.maps[mapname].layers.concat(
            mapconf.layers || []
        );
    }
    if (!mapconf.name) {
        mapconf.name = conf.name;
    }
    if (!mapconf.url) {
        mapconf.url = conf.url;
    }
    return mapconf;
}

return map;

});
