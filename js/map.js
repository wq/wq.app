/*!
 * wq.app 0.4.1 - map.js
 * Leaflet integration for app.js list & detail views
 * (c) 2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/leaflet', './app', './pages', './json', './spinner', './template', './console', './lib/es5-shim'],
function(L, app, pages, json, spin, tmpl, console) {

// module variable
var map = {};

// module configuration
map.config = {
    'maps': {}, // Auto-populated from app.config.pages where map == true
    'defaults': {
        'zoom': 0,
        'center': [0, 0],

        // Defaults to simplify creation of new icons of the same dimensions
        // as L.Icon.Default
        'icon': {
            'iconSize':    [25, 41],
            'iconAnchor':  [12, 41],
            'popupAnchor': [1, -34],
            'shadowSize':  [41, 41],
            'shadowUrl':  L.Icon.Default.imagePath + '/marker-shadow.png'
        }
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

    if (defaults)
        L.extend(map.config.defaults, defaults);

    // Define map configuration for all app pages with map=True
    for (var page in app.config.pages) {
        var pconf = L.extend({}, app.config.pages[page]);
        if (!pconf.map)
            continue;
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
    pages.addRoute(url, 's', function() {
        map.createMap(page);
    });
}

// Register an onshow event for item detail views
function _registerDetail(page) {
    var mapconf = _getConf(page);
    var url = mapconf.url ? mapconf.url + '/' : '';
    pages.addRoute(url + '<slug>', 's', function(match) {
        var itemid = match[1];
        if (itemid == 'new')
            return;
        map.createMap(page, itemid);
    });
}

// Register an onshow event for non-list single pages
function _registerOther(page) {
    var mapconf = _getConf(page);
    var url = mapconf.url;
    pages.addRoute(url, 's', function() {
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

    if (!mapconf.autoLayers)
        return layers;

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
            'cluster': true,
        });
    }
    return layers;
};

// Internal layer loading function - override to customize
var _cache = {};
map.loadLayer = function(url, callback) {
    url = app.service + '/' + url;
    if (url.indexOf('.geojson') == -1)
        url += '.geojson';
    if (_cache[url]) {
        setTimeout(function() {
            callback(_cache[url]);
        }, 100);
        return;
    }
    spin.start();
    json.get(url, function(geojson) {
        spin.stop();
        _cache[url] = geojson;
        callback(geojson);
    });
};

// Default base maps - override to customize
map.createBaseMaps = function() {
    var mqcdn = "http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.png";

    // Attribution (https://gist.github.com/mourner/1804938)
    var osmAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
    var aerialAttr = 'Imagery &copy; NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency';
    var mqTilesAttr = 'Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" />';

    return {
        "Street": L.tileLayer(mqcdn,
            {
                'subdomains': '1234',
                'type': 'map',
                'attribution': osmAttr + ', ' + mqTilesAttr
            }),
        "Aerial": L.tileLayer(mqcdn,
            {
                'subdomains': '1234',
                'type': 'sat',
                'attribution': aerialAttr + ', ' + mqTilesAttr
            })
    };
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

// Primary map routine
map.createMap = function(page, itemid) {
    var mapid, divid, mapconf, m, defaults, layers, div;

    // Load configuration and div id
    mapconf = _getConf(page);
    defaults = map.config.defaults;

    if (mapconf.list && itemid)
        mapid = page + '-' + itemid;
    else
        mapid = page;

    if (mapconf.div)
        divid = mapconf.div;
    else
        divid = mapid + '-map';

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
        map.maps[mapid].invalidateSize();
        return;
    }

    // Create map, set default zoom and basemap
    m = map.maps[mapid] = L.map(divid);
    m.setView(defaults.center, defaults.zoom);
    var basemaps = map.createBaseMaps();
    var basemap = Object.keys(basemaps)[0];
    basemaps[basemap].addTo(m);

    // Load layerconfs and add empty layer groups to map
    var layers = {};
    map.getLayerConfs(page, itemid).forEach(function(layerconf) {
        if (layerconf.cluster && L.MarkerClusterGroup) {
            var options = {};
            if (layerconf.clusterIcon)
                options.iconCreateFunction = layerconf.clusterIcon;
            layerconf.layer = new L.MarkerClusterGroup(options).addTo(m);
        } else {
            layerconf.layer = L.layerGroup().addTo(m);
        }
        loadLayer(layerconf);
        layers[layerconf.name] = layerconf.layer;
    });

    L.control.layers(basemaps, layers).addTo(m);

    // Async-load geojson for layers and add to layergroups
    function loadLayer(layerconf) {
        map.loadLayer(layerconf.url, function(geojson) {
            var options = {};
            if (layerconf.oneach)
                options.onEachFeature = layerconf.oneach;
            if (layerconf.icon)
                options.pointToLayer = _makeMarker(layerconf.icon);
            map.geoJson(geojson, options).addTo(layerconf.layer);
        });
    }

    // Ensure valid layout on screen
    setTimeout(function() {
        m.invalidateSize();
    }, 100);

    if (mapconf.onshow)
        mapconf.onshow(m);
    return m;
};

// Internal function for creating markers (used with layerconf.icon)
function _makeMarker(icon) {
    return function pointToLayer(geojson, latlng) {
        // Define icon as a function to customize per-feature
        if (typeof icon == 'function')
            icon = icon(geojson.properties);
        return L.marker(latlng, {'icon': map.icons[icon]});
    };
}

// Load map configuration for a given page
function _getConf(page) {
    var mapconf = map.config.maps[page];
    if (!mapconf)
        throw 'Configuration for "' + page + '" not found!';
    return mapconf;
}

return map;

});
