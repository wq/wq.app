import {
    AutoMap,
    AutoBasemap,
    AutoOverlay,
    Map,
    Legend,
    BasemapToggle,
    OverlayToggle
} from './components/index';
import { Geo, EmbeddedGeo } from './components/inputs/index';
import reducer, {
    MAP_READY,
    MAP_SHOW_OVERLAY,
    MAP_HIDE_OVERLAY,
    MAP_SET_BASEMAP,
    MAP_SET_HIGHLIGHT,
    MAP_CLEAR_HIGHLIGHT
} from './reducer';
import reactRenderer from '@wq/react';

// module variable
const map = {
    name: 'map',
    reducer(state, action) {
        return reducer(state, action, this.config);
    },
    actions: {
        ready(instance) {
            return {
                type: MAP_READY,
                payload: instance
            };
        },
        setBasemap(name) {
            return {
                type: MAP_SET_BASEMAP,
                payload: name
            };
        },
        showOverlay(name) {
            return {
                type: MAP_SHOW_OVERLAY,
                payload: name
            };
        },
        hideOverlay(name) {
            return {
                type: MAP_HIDE_OVERLAY,
                payload: name
            };
        },
        setHighlight(geojson) {
            return {
                type: MAP_SET_HIGHLIGHT,
                payload: geojson
            };
        },
        clearHighlight() {
            return {
                type: MAP_CLEAR_HIGHLIGHT
            };
        }
    },
    components: {
        AutoMap,
        AutoBasemap,
        AutoOverlay,
        Map,
        MapInteraction: () => null,
        Legend,
        BasemapToggle,
        OverlayToggle
    },
    inputs: {
        Geo,
        geopoint: Geo,
        geotrace: Geo,
        geoshape: Geo
    },
    config: {
        bounds: [
            [-4, -4],
            [4, 4]
        ],
        autoZoom: {
            wait: 0.5, // How long to wait before triggering autoZoom
            sticky: true, // Start new maps in same location as old maps

            // Settings for fitBounds
            maxZoom: 13,
            animate: true
        },

        basemaps: {
            Tile({ url }) {
                return `Tile at ${url}`;
            }
        },

        overlays: {
            Geojson({ url, data }) {
                if (data) {
                    return `GeoJSON ${data.type}`;
                } else {
                    return `GeoJSON at ${url}`;
                }
            },
            Highlight({ data }) {
                return `Highlight ${data.type}`;
            },
            Draw({ type, data }) {
                return `Draw ${data ? data.type : type}`;
            }
        },

        maps: {
            basemaps: _defaultBasemaps()
        }
    }
};

// This will be called by app.init()
map.init = function (config) {
    var app = this.app;

    Object.values(app.plugins).forEach(plugin => {
        if (plugin.basemaps) {
            Object.assign(this.config.basemaps, plugin.basemaps);
        }
        if (plugin.overlays) {
            Object.assign(this.config.overlays, plugin.overlays);
        }
    });

    // FIXME: loadDraw();

    if (config) {
        ['basemaps', 'overlays', 'maps'].forEach(key => {
            if (config[key]) {
                config[key] = { ...this.config[key], ...config[key] };
            }
        });
        Object.assign(this.config, config);
    }

    // Define map configuration for all app pages with map=True
    Object.keys(app.config.pages).forEach(function (page) {
        var pconf = app.config.pages[page],
            mconf = pconf.map;

        if (!mconf) {
            return;
        } else if (mconf === true) {
            mconf = [];
        } else if (!Array.isArray(mconf)) {
            mconf = [mconf];
        }

        const { mapId } = mconf[0] || {};

        var mapconf = {
            name: pconf.name,
            url: pconf.url,
            mapId,
            defaults: {
                maps: {
                    main: {
                        layers: []
                    }
                }
            }
        };

        // Initialize map configurations for each page display mode
        mconf.forEach(function (conf) {
            var mode = conf.mode || 'defaults',
                map = conf.map || 'main';
            if (mode === 'all') {
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
        modes.forEach(function (mode) {
            if (mapconf[mode]) {
                if (
                    mapconf[mode].maps &&
                    mapconf[mode].maps.main &&
                    mapconf[mode].maps.main.autoLayers &&
                    !mapconf[mode].maps.main.layers
                ) {
                    mapconf[mode].maps.main.layers = [];
                }
                return;
            }
            mapconf[mode] = {
                maps: {
                    main: {
                        autoLayers: true,
                        layers: []
                    }
                }
            };
        });
        map.config.maps[page] = mapconf;
    });
};

// Plugin API
map.runComponent = function ({ page, mode }) {
    var mapconf = map.config.maps[page];
    if (mapconf && mode !== 'edit' && !mapconf.mapId) {
        return 'AutoMap';
    } else {
        return null;
    }
};

// FIXME: Drop this function in 2.0
map.run = function ($page, routeInfo) {
    var mapconf = map.config.maps[routeInfo.page],
        mode = routeInfo.mode,
        form = routeInfo.form,
        maps = [];
    if (!mapconf) {
        return;
    }
    if (mapconf[mode] && mapconf[mode].maps) {
        maps = Object.keys(mapconf[mode].maps);
    } else {
        maps = ['main'];
    }
    maps.forEach(mapname => {
        var divid = map.getMapId(routeInfo, mapname) + '-map',
            $div = $page.find('#' + divid);

        let Component;
        if (mode === 'edit') {
            const fieldName = mapname === 'main' ? 'geometry' : mapname,
                { type } = form.find(field => field.name === fieldName) || {},
                $field = $page.find(`[name=${fieldName}]`),
                value = routeInfo.context[fieldName],
                setValue = data => $field.val(JSON.stringify(data));

            Component = EmbeddedGeo.makeComponent({ type, value, setValue });
        } else {
            Component = AutoMap;
        }

        const detach = reactRenderer.attach(Component, $div[0], this.app);
        $page.on('pagehide', detach);
    });
};

// Default base map configuration - override to customize
function _defaultBasemaps() {
    var cdn =
        'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg';
    var attr =
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.';

    return [
        {
            name: 'Stamen Terrain',
            type: 'tile',
            url: cdn,
            attribution: attr
        }
    ];
}

// FIXME: Drop this function in 2.0
map.getMapId = function (routeInfo, mapname) {
    var rt = routeInfo,
        parts = [];
    if (rt.item_id || (rt.mode === 'edit' && rt.variant === 'new')) {
        if (rt.mode === 'detail') {
            parts = [rt.page, rt.item_id];
        } else {
            parts = [rt.page, rt.item_id || rt.variant, rt.mode];
        }
    } else if (routeInfo.parent_page) {
        parts = [rt.parent_page, rt.parent_id, rt.page];
    } else {
        parts = [rt.page];
    }
    if (mapname && mapname !== 'main') {
        parts.push(mapname);
    }
    return parts.join('-');
};

export default map;
