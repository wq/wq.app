/*!
 * wq.app 1.0.0a1 - wq/map.js
 * Leaflet integration for wq/app.js pages
 * (c) 2013-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['leaflet', 'jquery', './json', './spinner',
        './template', './console', 'es5-shim'],
function(L, $, json, spin, tmpl, console) {

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

        'basemaps': _defaultBasemaps(),

        'owl': false
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
        L.Icon.Default.imagePath + '/marker-shadow.png'
    );

    if (defaults) {
        L.extend(map.config.defaults, defaults);
    }

    // Define map configuration for all app pages with map=True
    Object.keys(app.config.pages).forEach(function(page) {
        var pconf = app.config.pages[page];
        if (!pconf.map) {
            return;
        }

        var mapconf = (pconf.map instanceof Object) ? pconf.map : {};
        if (!mapconf.name) {
            mapconf.name = pconf.name;
        }
        if (!mapconf.url) {
            mapconf.url = pconf.url;
        }

        // Initialize map configurations for each page display mode
        var modes = ['defaults'];
        if (pconf.list) {
            modes = modes.concat(['list', 'detail', 'edit']);
        }
        modes.forEach(function(mode) {
            if (!mapconf[mode]) {
                mapconf[mode] = {};
            }
            if (!mapconf[mode].layers) {
                mapconf[mode].layers = [];
                if (mode != 'defaults') {
                    mapconf[mode].autoLayers = true;
                }
            }
        });

        map.config.maps[page] = mapconf;

        if (pconf.list) {
            map.addAutoLayers(page);
        }
    });
};

// Plugin API
map.run = function($page, routeInfo) {
    if (map.config.maps[routeInfo.page]) {
        map.createMap(routeInfo);
    }
};

// Add a layer configuration (layerconf) to a map configuration
map.addLayerConf = function(page, layerconf, mode) {
    if (!mode) {
        mode = 'defaults';
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
    map.config.maps[page][mode].layers.push(layerconf);
};

// Define an icon for use by list items displayed as points
map.createIcon = function(name, options) {
    options = L.extend({}, map.config.defaults.icon, options);
    map.icons[name] = L.icon(options);
    return map.icons[name];
};

// Compute default layer configuration for wq REST API
map.addAutoLayers = function(page) {
    var listConf = _getConf(page, 'list');
    if (listConf.autoLayers) {
        map.addLayerConf(page, {
            'name': listConf.name,
            'type': 'geojson',
            'url': '{{{url}}}.geojson',
            'popup': page,
            'cluster': true
        }, 'list');
    }

    var detailConf = _getConf(page, 'detail');
    if (detailConf.autoLayers) {
        map.addLayerConf(page, {
            'name': detailConf.name,
            'type': 'geojson',
            'url': detailConf.url + '/{{{id}}}.geojson',
            'popup': page
        }, 'detail');
    }

    var editConf = _getConf(page, 'edit');
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
map.getLayerConfs = function(routeInfo) {
    var page = routeInfo.page, itemid = routeInfo.item_id,
        mode = routeInfo.mode, url = routeInfo.path;
    if (!mode) {
        if (map.app.config.pages[page].list) {
            mode = itemid ? 'list' : 'detail';
        }
    }
    var mapconf = _getConf(page, mode);
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
        layerconf.url = tmpl.render(layerconf.url, L.extend({
            'id': itemid,
            'url': baseurl
        }, routeInfo.item || {}));
        if (params && layerconf.url.indexOf('?') > -1) {
            params = params.replace(/^\?/, "&");
        }
        layerconf.url += params;
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
    var mqcdn;
    if (location.protocol == "http") {
        mqcdn = "http://otile{s}.mqcdn.com";
    } else {
        mqcdn = "https://otile{s}-s.mqcdn.com";
    }
    mqcdn += "/tiles/1.0.0/{layer}/{z}/{x}/{y}.png";

    // Attribution (https://gist.github.com/mourner/1804938)
    var osmAttr = 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
    var aerialAttr = 'Imagery &copy; NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency';
    var mqTilesAttr = 'Tiles &copy; <a href="https://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png" />';

    return [
        {
            'name': "Street",
            'type': 'tile',
            'url': mqcdn,
            'subdomains': '1234',
            'layer': 'map',
            'attribution': osmAttr + ', ' + mqTilesAttr
        },
        {
            'name': "Aerial",
            'type': 'tile',
            'url': mqcdn,
            'subdomains': '1234',
            'layer': 'sat',
            'attribution': aerialAttr + ', ' + mqTilesAttr
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

map.createBaseMaps = map.createBasemaps;  // Backwards compatibility

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

    // Load layer content as JSON
    overlay.ready = map.loadLayer(layerconf.url).then(function(geojson) {
        var options = {}, popup;
        if (!geojson || !geojson.type) {
            console.warn("Ignoring empty or malformed GeoJSON result.");
            return overlay;
        }
        if (layerconf.popup) {
            popup = map.renderPopup(layerconf.popup);
        }
        if (layerconf.oneach && popup) {
            options.onEachFeature = function(feat, layer) {
                popup(feat, layer);
                layerconf.oneach(feat, layer);
            };
        } else if (layerconf.oneach) {
            options.onEachFeature = layerconf.oneach;
        } else if (popup) {
            options.onEachFeature = popup;
        }
        if (layerconf.icon) {
            options.pointToLayer = _makeMarker(layerconf.icon);
        }
        if (layerconf.style) {
            options.style = layerconf.style;
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
map.createLayerControl = function(basemaps, layers) {
    return L.control.layers(basemaps, layers);
};

map.addDrawControl = function(m, layer, opts, $geom) {
    var control = new L.Control.Draw({
        'draw': opts.draw,
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
        if (opts.flatten) {
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
    var owl = map.config.defaults.owl && require('wq/owl');
    return function(feat, layer) {
        var attrs = L.extend({'id': feat.id}, feat.properties);
        layer.bindPopup(
            tmpl.render(page + '_popup', attrs)
        );
        if (owl) {
            layer.on('click', function() {
                owl('map:layerclick', {'page': page, 'id': feat.id});
            });
        }
    };
};

map.getMapId = function(routeInfo) {
    var rt = routeInfo, parts = [];
    if (rt.item_id) {
        if (rt.mode == 'edit') {
            parts = [rt.page, rt.item_id, 'edit'];
        } else {
            parts = [rt.page, rt.item_id];
        }
    } else if (routeInfo.parent_page) {
        parts = [rt.parent_page, rt.parent_id, rt.page];
    } else {
        parts = [rt.page];
    }
    return parts.join('-');
};

map.getMap = function(routeInfo) {
    var mapid = map.getMapId(routeInfo);
    return map.maps[mapid] || null;
};

// Primary map routine
map.createMap = function(routeInfo, divid) {
    var mapid, mapconf, m, defaults,
        layerConfs, layers,
        basemaps, basemap, div, owl;

    // Load configuration and div id
    mapconf = _getConf(routeInfo.page, routeInfo.mode);
    defaults = map.config.defaults;
    // If defaults.owl, assume wq/owl has been async-loaded already
    owl = defaults.owl && require('wq/owl');
    mapid = map.getMapId(routeInfo);

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
    // wq.app < 0.8.1 used createBaseMaps, check in case it was overridden
    // (remove in 1.0)
    if (map.createBaseMaps != map.createBasemaps) {
        console.warn("map.createBaseMaps is now map.createBasemaps()");
        basemaps = map.createBaseMaps();
    } else {
        basemaps = map.createBasemaps();
    }
    basemap = Object.keys(basemaps)[0];
    basemaps[basemap].addTo(m);

    // Load layerconfs and add empty layer groups to map
    layers = {};
    layerConfs = map.getLayerConfs(routeInfo);
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
        map.createLayerControl(basemaps, layers).addTo(m);
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
            } else {
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
    if (owl) {
        m.on('moveend', function() {
            owl('map:moveend', {
                'zoom': m.getZoom(),
                'center': m.getCenter(),
                'bounds': m.getBounds()
            });
        });
        [
            'baselayerchange',
            'overlayadd',
            'overlayremove'
        ].forEach(_layerEvent);
    }
    function _layerEvent(name) {
        m.on(name, function(evt) {
            owl('map:' + name, {'layer': evt.name});
        });
    }

    // Ensure valid layout on screen
    setTimeout(function() {
        m.invalidateSize();
    }, 100);

    // Try to ensure no Leaflet widgets are enhanced by jQuery Mobile
    var $controls = $(div).find(".leaflet-control-container");
    $controls.find("input").attr("data-role", "none");

    if (mapconf.onshow) {
        mapconf.onshow(m, layers, basemaps, routeInfo);
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
            var $geom = $.mobile.activePage.find('[name=' + geomname + ']');
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
function _getConf(page, mode) {
    var conf = map.config.maps[page];
    if (!conf) {
        throw 'Configuration for "' + page + '" not found!';
    }

    // Options that apply to all modes
    var mapconf = {};
    var reserved = ['defaults', 'list', 'detail', 'edit'];
    Object.keys(conf).forEach(function(key) {
        if (reserved.indexOf(key) > -1) {
            return;
        }
        mapconf[key] = conf[key];
    });

    // Mix in mode-specific options
    L.extend(mapconf, conf.defaults, conf[mode] || {});
    mapconf.layers = conf.defaults.layers.concat(conf.layers || []);
    if (mode && mode != 'defaults') {
        mapconf.layers = mapconf.layers.concat(conf[mode].layers);
    }
    return mapconf;
}

return map;

});
