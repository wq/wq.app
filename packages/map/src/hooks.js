import { useEffect, useState, useMemo, useCallback } from 'react';
import { useField } from 'formik';
import {
    useRouteInfo,
    usePlugin,
    usePluginState,
    useRenderContext,
    useApp,
    usePluginComponentMap
} from '@wq/react';
import Mustache from 'mustache';

export const TYPE_MAP = {
    geopoint: 'point',
    geotrace: 'line_string',
    geoshape: 'polygon'
};

export function useBasemapComponents() {
    return usePluginComponentMap('map', 'basemaps');
}

export function useOverlayComponents() {
    return usePluginComponentMap('map', 'overlays');
}

export function useGeoTools(name, type) {
    const tools = usePluginComponentMap('map', 'geotools', true),
        toggleName = `${name}_method`,
        { setBounds } = usePlugin('map'),
        [, { value }, { setValue }] = useField(name),
        [, { value: activeTool }] = useField(toggleName);

    const DefaultTool =
            Object.values(tools).find(tool => tool.toolDefault) || (() => null),
        ActiveTool = tools[activeTool] || DefaultTool;

    const setLocation = useCallback(
        ({ latitude, longitude, zoom = true, store = true }) => {
            if (store && type === 'geopoint') {
                setValue({
                    type: 'Point',
                    coordinates: [longitude, latitude]
                });
            }

            if (zoom) {
                setBounds([
                    [longitude - 0.0005, latitude - 0.0005],
                    [longitude + 0.0005, latitude + 0.0005]
                ]);
            }
        }
    );

    return useMemo(
        () => ({
            toggleProps: {
                name: toggleName,
                choices: Object.entries(tools)
                    .filter(([, Tool]) => Tool.toolLabel)
                    .map(([key, Tool]) => ({
                        name: key,
                        label: Tool.toolLabel
                    }))
            },
            setLocation,
            setBounds,
            ActiveTool,
            value
        }),
        [toggleName, tools, setLocation, ActiveTool, value]
    );
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

export function useGeometry(value, maxGeometries) {
    return useMemo(() => {
        return asGeometry(value, maxGeometries);
    }, [value]);
}

export function useFeatureCollection(value) {
    return useMemo(() => {
        return asFeatureCollection(value);
    }, [value]);
}

export function asGeometry(geojson, maxGeometries) {
    var geoms = [];
    if (geojson.type === 'FeatureCollection') {
        geojson.features.forEach(function (feature) {
            addGeometry(feature.geometry);
        });
    } else if (geojson.type === 'Feature') {
        addGeometry(geojson.geometry);
    } else {
        addGeometry(geojson);
    }

    if (geoms.length == 0) {
        return null;
    } else if (geoms.length == 1) {
        return geoms[0];
    } else if (maxGeometries === 1) {
        return geoms[geoms.length - 1];
    } else if (maxGeometries && geoms.length > maxGeometries) {
        return {
            type: 'GeometryCollection',
            geometries: geoms.slice(-maxGeometries)
        };
    } else {
        return {
            type: 'GeometryCollection',
            geometries: geoms
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

export function asFeatureCollection(geojson) {
    if (typeof geojson === 'string') {
        try {
            geojson = JSON.parse(geojson);
        } catch (e) {
            geojson = null;
        }
    }
    if (!geojson || !geojson.type) {
        return geojson;
    }
    const geometry = asGeometry(geojson);

    if (!geometry) {
        return null;
    }

    let features;
    if (geometry.type === 'GeometryCollection') {
        features = geometry.geometries.map(geometry => ({
            type: 'Feature',
            properties: {},
            geometry
        }));
    } else {
        features = [
            {
                type: 'Feature',
                properties: {},
                geometry
            }
        ];
    }

    return {
        type: 'FeatureCollection',
        features
    };
}
