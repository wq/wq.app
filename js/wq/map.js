/*!
 * wq.app 0.8.0 - wq/map.js
 * Leaflet integration for app.js list & detail views
 * (c) 2013-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['leaflet', 'jquery', './app', './router', './json', './spinner',
        './template', './console', 'es5-shim'],
function(L, $, app, router, json, spin, tmpl, console) {

/* global require */
/* global Promise */

// module variable
var map = {};

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
            'shadowSize':  [41, 41],
            'shadowUrl':  L.Icon.Default.imagePath + '/marker-shadow.png'
        },

        'owl': false
    }
};

// References to generated map objects
map.maps = {};

// References to generated icons
map.icons = {
    'default': new L.Icon.Default()
};

// This should be called after app.init()
map.init = function(defaults) {
    // Auto-detect whether CRS-aware GeoJSON parser is available
    map.geoJson = L.Proj ? L.Proj.geoJson : L.geoJson;

    if (defaults) {
        L.extend(map.config.defaults, defaults);
    }

    // Define map configuration for all app pages with map=True
    for (var page in app.config.pages) {
        var pconf = L.extend({}, app.config.pages[page]);
        if (!pconf.map) {
            continue;
        }
        pconf.layers = [];
        map.config.maps[page] = pconf;

        // Register onshow events
        if (pconf.list) {
            pconf.autoLayers = true;
            _registerList(page);
            _registerDetail(page);
        } else {
            _registerOther(page);
        }
    }
};

// Register an onshow event for list views
function _registerList(page) {
    var mapconf = _getConf(page);
    var url = mapconf.url ? mapconf.url + '/' : '';
    router.addRoute(url, 's', function() {
        map.createMap(page);
    });

    // Special handling for /[parent_list_url]/[parent_id]/[url]
    for (var ppage in app.getParents(page)) {
        var pconf = app.config.pages[ppage];
        var purl = pconf.url;
        if (url) {
            purl += '/';
        }
        purl += '<slug>/' + mapconf.url;
        router.addRoute(purl, 's', goUrl);
        router.addRoute(purl + '/', 's', goUrl);
    }

    function goUrl(match, ui, params) {
        // Override URL for this map's main layer to enable filter by parent
        var override = {};
        var url = match[0].substring(1).split("?")[0];
        if (params) {
            url += ".geojson" + L.Util.getParamString(params);
        }
        override[mapconf.name] = {'url': url};
        map.createMap(page, undefined, override);
    }
}

// Register an onshow event for item detail views
function _registerDetail(page) {
    var mapconf = _getConf(page);
    var url = mapconf.url ? mapconf.url + '/' : '';
    router.addRoute(url + '<slug>', 's', function(match) {
        var itemid = match[1];
        if (itemid == 'new') {
            return;
        }
        map.createMap(page, itemid);
    });
}

// Register an onshow event for non-list single pages
function _registerOther(page) {
    var mapconf = _getConf(page);
    var url = mapconf.url;
    router.addRoute(url, 's', function() {
        map.createMap(page);
    });
}

// Add a layer configuration (layerconf) to a map configuration
map.addLayerConf = function(page, layerconf) {
    var mapconf = _getConf(page);
    mapconf.layers.push(layerconf);
};

// Define an icon for use by list items displayed as points
map.createIcon = function(name, options) {
    options = L.extend({}, map.config.defaults.icon, options);
    map.icons[name] = L.icon(options);
};

// Load map configuration for the given page
map.getLayerConfs = function(page, itemid) {
    var mapconf = _getConf(page);
    var layers = mapconf.layers.slice();

    if (!mapconf.autoLayers) {
        return layers;
    }

    if (itemid) {
        // Automatically load geojson for the current item
        layers.push({
            'name': mapconf.name,
            'url': mapconf.url + '/' + itemid,
            'oneach': map.renderPopup(page)
        });
    } else {
        // Automatically load geojson for the entire list
        layers.push({
            'name': mapconf.name,
            'url': mapconf.url,
            'oneach': map.renderPopup(page),
            'cluster': true
        });
    }
    return layers;
};

// Internal layer loading function - override to customize
map.cache = {};
map.loadLayer = function(url) {
    url = app.service + '/' + url;
    if (url.indexOf('.geojson') == -1) {
        url += '.geojson';
    }
    if (map.cache[url]) {
        return Promise.resolve(map.cache[url]);
    }
    spin.start();
    return json.get(url).then(function(geojson) {
        spin.stop();
        map.cache[url] = geojson;
        return geojson;
    });
};

// Default base maps - override to customize
map.createBaseMaps = function() {
    /* jshint maxlen: false */
    var mqcdn = "http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.png";

    // Attribution (https://gist.github.com/mourner/1804938)
    var osmAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
    var aerialAttr = 'Imagery &copy; NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency';
    var mqTilesAttr = 'Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" />';

    return {
        "Street": L.tileLayer(mqcdn, {
            'subdomains': '1234',
            'type': 'map',
            'attribution': osmAttr + ', ' + mqTilesAttr
        }),
        "Aerial": L.tileLayer(mqcdn, {
            'subdomains': '1234',
            'type': 'sat',
            'attribution': aerialAttr + ', ' + mqTilesAttr
        })
    };
};

map.createLayerControl = function(basemaps, layers) {
    return L.control.layers(basemaps, layers);
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

// Primary map routine
map.createMap = function(page, itemid, override) {
    var mapid, divid, mapconf, m, defaults,
        layerConfs, layers,
        basemaps, basemap, div, owl;

    // Load configuration and div id
    mapconf = _getConf(page);
    defaults = map.config.defaults;
    // If defaults.owl, assume wq/owl has been async-loaded already
    owl = defaults.owl && require('wq/owl');

    if (mapconf.list && itemid) {
        mapid = page + '-' + itemid;
    } else {
        mapid = page;
    }

    if (mapconf.div) {
        divid = mapconf.div;
    } else {
        divid = mapid + '-map';
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
            m.fitBounds(defaults.bounds);
        }
        return;
    }

    // Create map, set default zoom and basemap
    m = map.maps[mapid] = L.map(divid);
    m.fitBounds(defaults.bounds);
    basemaps = map.createBaseMaps();
    basemap = Object.keys(basemaps)[0];
    basemaps[basemap].addTo(m);

    // Load layerconfs and add empty layer groups to map
    layers = {};
    layerConfs = map.getLayerConfs(page, itemid);
    var results = layerConfs.map(function(layerconf, i) {
        layerconf = L.extend({}, layerconf,
                             override && override[layerconf.name]);
        if (layerconf.cluster && L.MarkerClusterGroup) {
            var options = {};
            if (layerconf.clusterIcon) {
                options.iconCreateFunction = layerconf.clusterIcon;
            }
            layerconf.layer = new L.MarkerClusterGroup(options).addTo(m);
        } else {
            layerconf.layer = L.featureGroup().addTo(m);
        }
        layers[layerconf.name] = layerconf.layer;
        layerConfs[i] = layerconf;
        return map.loadLayer(layerconf.url).then(function(geojson) {
            var options = {};
            if (layerconf.oneach) {
                options.onEachFeature = layerconf.oneach;
            }
            if (layerconf.icon) {
                options.pointToLayer = _makeMarker(layerconf.icon);
            }
            if (layerconf.style) {
                options.style = layerconf.style;
            }
            map.geoJson(geojson, options).addTo(layerconf.layer);
        });
    });

    map.createLayerControl(basemaps, layers).addTo(m);

    Promise.all(results).then(autoZoom);

    function autoZoom() {
        if (mapconf.autoZoom !== undefined && !mapconf.autoZoom) {
            return;
        }
        if (!map.config.defaults.autoZoom) {
            return;
        }
        var bounds = layerConfs[0].layer.getBounds();
        if (layerConfs.length > 1) {
            layerConfs.slice(1).forEach(function(layerconf) {
                bounds.extend(layerconf.layer.getBounds());
            });
        }
        if (mapconf.minBounds) {
            bounds.extend(mapconf.minBounds);
        }
        setTimeout(function() {
            m.fitBounds(bounds, map.config.defaults.autoZoom);
        }, map.config.defaults.autoZoom.wait * 1000);
    }

    if (map.config.defaults.autoZoom.sticky) {
        m.on('moveend', function() {
            map.config.defaults.bounds = m.getBounds();
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
        mapconf.onshow(m);
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
        } else {
            key = icon;
        }
        return L.marker(latlng, {'icon': map.icons[key]});
    };
}

// Load map configuration for a given page
function _getConf(page) {
    var mapconf = map.config.maps[page];
    if (!mapconf) {
        throw 'Configuration for "' + page + '" not found!';
    }
    return mapconf;
}

return map;

});
