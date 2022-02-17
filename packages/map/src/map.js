import {
    AutoMap,
    AutoBasemap,
    AutoOverlay,
    StickyMap,
    OffscreenMaps,
    HighlightPopup,
    PropertyTable,
    Map,
    Legend,
    BasemapToggle,
    OverlayToggle,
    GeoTools
} from './components/index';
import { Geo, EmbeddedGeo } from './inputs/index';
import { GeoHelp, GeoLocate, GeoCode, GeoCoords } from './geotools/index';
import { DefaultList, DefaultDetail, DefaultPopup } from './views/index';
import reducer, {
    MAP_READY,
    MAP_SET_STICKY_PROPS,
    MAP_SET_STICKY_ID,
    MAP_SHOW_OVERLAY,
    MAP_HIDE_OVERLAY,
    MAP_SET_BASEMAP,
    MAP_SET_HIGHLIGHT,
    MAP_ADD_HIGHLIGHT,
    MAP_TOGGLE_HIGHLIGHT,
    MAP_REMOVE_HIGHLIGHT,
    MAP_CLEAR_HIGHLIGHT
} from './reducer';
import reactRenderer from '@wq/react';

// module variable
const map = {
    name: 'map',
    reducer(state, action) {
        return reducer(state, action, this.config);
    },
    persist({ activeBasemap, activeOverlays }) {
        return { activeBasemap, activeOverlays };
    },
    restore({ activeBasemap, activeOverlays }) {
        Object.keys(activeOverlays || {}).forEach(key => {
            if (!this.config.allOverlays[key]) {
                delete activeOverlays[key];
            }
        });
        return {
            activeBasemap,
            activeOverlays
        };
    },
    actions: {
        ready(instance, name = null) {
            return {
                type: MAP_READY,
                payload: { instance, name }
            };
        },
        setStickyProps(props) {
            return {
                type: MAP_SET_STICKY_PROPS,
                payload: props
            };
        },
        setStickyMapId(id) {
            return {
                type: MAP_SET_STICKY_ID,
                payload: id
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
                payload: asFeatureCollection(geojson)
            };
        },
        addHighlight(geojson) {
            return {
                type: MAP_ADD_HIGHLIGHT,
                payload: asFeatureCollection(geojson)
            };
        },
        toggleHighlight(geojson) {
            return {
                type: MAP_TOGGLE_HIGHLIGHT,
                payload: asFeatureCollection(geojson)
            };
        },
        removeHighlight(geojson) {
            return {
                type: MAP_REMOVE_HIGHLIGHT,
                payload: asFeatureCollection(geojson)
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
        StickyMap,
        OffscreenMaps,
        HighlightPopup,
        PropertyTable,
        Map,
        MapInteraction: () => null,
        MapAutoZoom: () => null,
        MapIdentify: () => null,
        Legend,
        BasemapToggle,
        OverlayToggle,
        GeoTools
    },
    inputs: {
        Geo,
        geopoint: Geo,
        geotrace: Geo,
        geoshape: Geo
    },
    views: { DefaultList, DefaultDetail, DefaultPopup },
    config: {
        maps: {}, // Auto-populated from app.config.pages where map == true
        bounds: [
            [-4, -4],
            [4, 4]
        ],
        autoZoom: {
            wait: 0.5, // How long to wait before triggering autoZoom

            // Settings for fitBounds
            maxZoom: 13,
            animate: true
        },
        basemaps: _defaultBasemaps()
    },

    registry: {
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
        geotools: {
            GeoHelp,
            GeoLocate,
            GeoCode,
            GeoCoords
        }
    }
};

// This will be called by app.init()
map.init = function (config) {
    var app = this.app;

    Object.values(app.plugins).forEach(plugin => {
        if (plugin.basemaps) {
            Object.assign(this.registry.basemaps, plugin.basemaps);
        }
        if (plugin.overlays) {
            Object.assign(this.registry.overlays, plugin.overlays);
        }
        if (plugin.geotools) {
            Object.assign(this.registry.geotools, plugin.geotools);
        }
        if (plugin.geocoder) {
            this.config.geocoder = address => plugin.geocoder(address);
        }
        if (plugin.geocoderAddress) {
            this.config.geocoderAddress = values =>
                plugin.geocoderAddress(values);
        }
        if (plugin.zoomToLocation) {
            this.config.zoomToLocation = (instance, geometry, meta) =>
                plugin.zoomToLocation(instance, geometry, meta);
        }
    });

    if (!this.config.geocoder) {
        // No geocoder; disable default GeoCode unless it has been overridden
        if (this.registry.geotools.GeoCode === GeoCode) {
            delete this.registry.geotools.GeoCode;
        }
    }

    // FIXME: loadDraw();

    if (config) {
        Object.assign(this.config, config);

        if (config.maps && config.maps.basemaps) {
            // Compatibility with 1.3 alpha/beta; remove in 2.0
            this.config.basemaps = config.maps.basemaps;
        }
    }

    // Define map configuration for all app pages with map=True
    this.config.allOverlays = {};

    Object.keys(app.config.pages).forEach(page => {
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
        mconf.forEach(conf => {
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
            if (conf.layers) {
                conf.layers.forEach(
                    layer => (this.config.allOverlays[layer.name] = true)
                );
            }
        });

        // Ensure map configurations exist for all list page modes
        var modes = [];
        if (pconf.modes) {
            modes = pconf.modes;
        } else if (pconf.list) {
            modes = ['list', 'detail', 'edit'];
        }
        modes.forEach(mode => {
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
map.runComponent = 'OffscreenMaps';

// FIXME: Drop this function in 2.0
map.run = function ($page, routeInfo) {
    var mapconf = map.config.maps[routeInfo.page],
        mode = routeInfo.mode,
        context = routeInfo.context,
        form = routeInfo.page_config.form,
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
                value = context[fieldName],
                setValue = data => $field.val(JSON.stringify(data));

            Component = EmbeddedGeo.makeComponent({ type, value, setValue });
        } else {
            Component = AutoMap.makeComponent({ context });
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

function asFeatureCollection(geojson) {
    if (!geojson) {
        geojson = [];
    } else if (geojson.type && geojson.type !== 'FeatureCollection') {
        geojson = [geojson];
    }
    if (Array.isArray(geojson)) {
        geojson = { type: 'FeatureCollection', features: geojson };
    } else if (!geojson.type) {
        throw new Error('Invalid GeoJSON');
    }
    return geojson;
}

export default map;
