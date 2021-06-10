import { useEffect, useState } from 'react';
import {
    useRouteInfo,
    usePlugin,
    usePluginState,
    useRenderContext,
    useApp,
    usePluginComponentMap
} from '@wq/react';
import Mustache from 'mustache';

export function useBasemapComponents() {
    return usePluginComponentMap('map', 'basemaps');
}

export function useOverlayComponents() {
    return usePluginComponentMap('map', 'overlays');
}

// Load map configuration for the given page
export function useMapConfig() {
    const { config } = usePlugin('map'),
        routeInfo = useRouteInfo(),
        context = useRenderContext();

    return routeMapConf(config, routeInfo, context);
}

export function useMapState() {
    const state = usePluginState('map');
    if (state && state.basemaps && state.overlays) {
        return state;
    } else {
        return null;
    }
}

export function useMapInstance() {
    const mapState = useMapState();
    if (mapState) {
        return mapState.instance;
    } else {
        return null;
    }
}

function checkGroupLayers(layerconf) {
    const { type, layers = [] } = layerconf;
    if (type !== 'group') {
        return layerconf;
    }
    return {
        ...layerconf,
        layers: layers.map((layer, i) => {
            if (layer.name) {
                return layer;
            }
            return {
                ...layer,
                name: `${layerconf.name}-${i}`
            };
        })
    };
}

export function routeMapConf(config, routeInfo, context = {}) {
    const { page, mode, path, params, item_id, page_config } = routeInfo,
        conf = config.maps[page === 'outbox' ? page_config.name : page];

    if (!conf) {
        return null;
    }
    // FIXME: custom mapname
    const mapname = 'main';

    // Start with defaults, override with mode-specific options
    var mapconf = {
        ...(conf.defaults.maps[mapname] || {}),
        ...((conf[mode] || { maps: {} }).maps[mapname] || {}),
        basemaps: config.basemaps.map(checkGroupLayers),
        bounds: config.bounds
    };

    if (config.mapProps) {
        mapconf.mapProps = config.mapProps;
    }
    // Combine (rather than overwrite) defaults + mode-specific layers
    if (
        mode &&
        mode !== 'defaults' &&
        conf.defaults.maps[mapname] &&
        conf.defaults.maps[mapname].layers
    ) {
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

    // Compute default layer configuration for wq REST API
    if (mapconf.autoLayers && mode !== 'edit') {
        const defaultLayer = {
            name: mapconf.name,
            type: 'geojson'
        };
        if (!mode || mode === 'list') {
            Object.assign(defaultLayer, {
                url: '{{{rt}}}/{{{url}}}.geojson',
                popup: page,
                cluster: true
            });
        } else {
            Object.assign(defaultLayer, {
                url: '{{{rt}}}/' + mapconf.url + '/{{{id}}}.geojson',
                popup: page
            });
        }
        mapconf.layers.push(defaultLayer);
    }
    mapconf.layers = mapconf.layers.map(checkGroupLayers).map(layerconf => {
        // FIXME: recalculate
        const baseurl = path.replace(/\/$/, '');
        layerconf = {
            active: true,
            ...layerconf
        };

        if (layerconf.noAutoAdd) {
            // FIXME: Remove in 2.0
            console.warn(
                new Error('set active: false instead of noAutoAdd: true')
            );
            layerconf.active = false;
            delete layerconf.noAutoAdd;
        }
        if (layerconf.url && layerconf.url.indexOf('{{') > -1) {
            layerconf.url = Mustache.render(layerconf.url, {
                ...context,
                id: item_id,
                url: baseurl
            });
            if (params) {
                const pstr = new URLSearchParams(params).toString();
                if (layerconf.url.indexOf('?') > -1) {
                    layerconf.url += '&' + pstr;
                } else {
                    layerconf.url += '?' + pstr;
                }
            }
        }
        return layerconf;
    });

    return mapconf;
}

const _cache = {};

export function useGeoJSON(url, data) {
    const app = useApp(),
        [geojson, setGeojson] = useState();

    if (!(url.indexOf('/') === 0 || url.indexOf('http') === 0)) {
        console.warn(
            new Error(`Use "{{{rt}}}/${url}" instead of relative URL`)
        );
        url = app.service + '/' + url;
    }

    useEffect(() => {
        if (data) {
            setGeojson(data);
            return;
        }
        if (_cache[url]) {
            setGeojson(_cache[url]);
            return;
        }
        if (url.match(/\/(new)?(\/edit)?\.geojson$/)) {
            // Ignore requests for "new.geojson"
            setGeojson(null);
            return;
        }

        app.spin.start();
        app.store.ajax(url).then(
            function (data) {
                app.spin.stop();
                _cache[url] = data;
                setGeojson(data);
            },
            function () {
                app.spin.stop();
                setGeojson(null);
            }
        );
    }, [url, data, app]);

    return geojson;
}
