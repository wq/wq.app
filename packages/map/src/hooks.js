import { useEffect, useState, useMemo, useCallback } from "react";
import { useField } from "formik";
import {
    useRouteInfo,
    usePlugin,
    usePluginState,
    useRenderContext,
    useApp,
    useComponents,
    usePluginComponentMap,
    useModel,
    useReverse,
} from "@wq/react";
import Mustache from "mustache";

export const TYPE_MAP = {
    geopoint: "point",
    geotrace: "line_string",
    geoshape: "polygon",
};

export function useBasemapComponents() {
    return usePluginComponentMap("map", "basemaps");
}

export function useOverlayComponents() {
    return usePluginComponentMap("map", "overlays");
}

export function useGeoTools(name, type, mapId) {
    const { zoomToLocation } = usePlugin("map").config,
        tools = usePluginComponentMap("map", "geotools", true),
        toggleName = `${name}_method`,
        mapState = useMapState(),
        { useMapInstance } = useComponents(),
        instance = useMapInstance(mapId),
        [, { value }, { setValue }] = useField(name),
        [, , { setValue: setAccuracy }] = useField(`${name}_accuracy`),
        [, { value: activeTool }, { setValue: setActiveTool }] =
            useField(toggleName);

    const [defaultTool, DefaultTool] =
            Object.entries(tools).find(([, Tool]) => Tool.toolDefault) ||
            (null, () => null),
        ActiveTool = tools[activeTool] || DefaultTool;

    const setLocation = useCallback(
        ({
            geometry = null,
            latitude = 0,
            longitude = 0,
            accuracy = null,
            zoom = true,
            save = false,
        }) => {
            if (!geometry) {
                geometry = {
                    type: "Point",
                    coordinates: [longitude, latitude],
                };
            }

            if (save) {
                setValue(geometry);
                setAccuracy(accuracy);
            }

            if (zoom && zoomToLocation) {
                zoomToLocation(instance, geometry, {
                    name,
                    type,
                    activeTool,
                    mapState,
                });
            }
        },
        [instance]
    );

    useEffect(() => {
        if (
            !activeTool &&
            defaultTool &&
            ActiveTool == DefaultTool &&
            DefaultTool.toolLabel
        ) {
            setActiveTool(defaultTool);
        }
    }, [activeTool, ActiveTool]);

    return useMemo(
        () => ({
            toggleProps: {
                name: toggleName,
                choices: Object.entries(tools)
                    .filter(([, Tool]) => Tool.toolLabel)
                    .map(([key, Tool]) => ({
                        name: key,
                        label: Tool.toolLabel,
                    })),
            },
            setLocation,
            ActiveTool,
            value,
        }),
        [toggleName, tools, setLocation, ActiveTool, value]
    );
}

// Load map configuration for the given page
export function useMapConfig() {
    const { config } = usePlugin("map"),
        routeInfo = useRouteInfo(),
        context = useRenderContext();

    return routeMapConf(config, routeInfo, context);
}

export function useMapState() {
    const state = usePluginState("map"),
        routeName = useRouteInfo().name,
        routeState = state && state.routes && state.routes[routeName];
    if (routeState) {
        return routeState;
    } else {
        return null;
    }
}

export function useMapInstance() {
    throw new Error(
        "@wq/map's useMapInstance() export is deprecated." +
            " Load useMapInstance() via useComponents()," +
            " or import it directly from @wq/map-gl"
    );
}

function checkGroupLayers(layerconf) {
    const { type, layers = [] } = layerconf;
    if (type !== "group") {
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
                name: `${layerconf.name}-${i}`,
            };
        }),
    };
}

export function routeMapConf(config, routeInfo, context = {}) {
    const { page, mode, path, params, item_id, page_config } = routeInfo,
        conf = config.maps[page === "outbox" ? page_config.name : page];

    if (!conf) {
        return null;
    }
    // FIXME: custom mapname
    const mapname = "main";

    // Start with defaults, override with mode-specific options
    var mapconf = {
        ...(conf.defaults.maps[mapname] || {}),
        ...((conf[mode] || { maps: {} }).maps[mapname] || {}),
        basemaps: config.basemaps.map(checkGroupLayers),
        bounds: config.bounds,
        tiles: config.tiles,
    };

    if (config.mapProps) {
        mapconf.mapProps = config.mapProps;
    }
    if (typeof mapconf.autoZoom === "undefined") {
        mapconf.autoZoom = { ...config.autoZoom };
    }
    if (mapconf.autoZoom === true) {
        mapconf.autoZoom = {};
    }
    if (typeof mapconf.autoZoom.wait === "undefined") {
        mapconf.autoZoom.wait = 0.5;
    }
    if (typeof mapconf.autoZoom.maxZoom === "undefined") {
        mapconf.autoZoom.maxZoom = 13;
    }
    if (typeof mapconf.autoZoom.animate === "undefined") {
        mapconf.autoZoom.animate = true;
    }

    // Combine (rather than overwrite) defaults + mode-specific layers
    if (
        mode &&
        mode !== "defaults" &&
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
    if (!mapconf.layers) {
        mapconf.layers = [];
    }

    // Compute default layer configuration for wq REST API
    if (mapconf.autoLayers && mode !== "edit") {
        const geometryFields = getGeometryFields((page_config || {}).form);
        geometryFields.forEach((field) => {
            let name = (page_config && page_config.label) || mapconf.name;
            if (field.label) {
                name += ` - ${field.label}`;
            }
            const defaultLayer = {
                name,
                type: "geojson",
            };
            if (!mode || mode === "list") {
                Object.assign(defaultLayer, {
                    data: ["context_feature_collection", field.name],
                    popup: page,
                    cluster: true,
                });
            } else {
                Object.assign(defaultLayer, {
                    data: ["context_feature", field.name],
                    popup: page,
                });
            }
            mapconf.layers.push(defaultLayer);
        });
    }
    mapconf.layers = mapconf.layers.map(checkGroupLayers).map((layerconf) => {
        // FIXME: recalculate
        const baseurl = path.replace(/\/$/, "");
        layerconf = {
            active: true,
            ...layerconf,
        };

        if (layerconf.url && layerconf.url.indexOf("{{") > -1) {
            layerconf.url = Mustache.render(layerconf.url, {
                ...context,
                id: item_id,
                url: baseurl,
            });
            if (params) {
                const pstr = new URLSearchParams(params).toString();
                if (layerconf.url.indexOf("?") > -1) {
                    layerconf.url += "&" + pstr;
                } else {
                    layerconf.url += "?" + pstr;
                }
            }
        }
        return layerconf;
    });

    return mapconf;
}

function getGeometryFields(form, prefix = "") {
    const geometryFields = [];
    (form || []).forEach((field) => {
        if (field.type.startsWith("geo")) {
            geometryFields.push({
                name: prefix + field.name,
                label: field.label || field.name,
            });
        } else if (field.type === "group") {
            geometryFields.push(
                ...getGeometryFields(
                    field.children,
                    (prefix = `${field.name}.`)
                )
            );
        } else if (field.type === "repeat") {
            geometryFields.push(
                ...getGeometryFields(
                    field.children,
                    (prefix = `${field.name}[].`)
                )
            );
        }
    });
    if (geometryFields.length === 0 && !prefix) {
        geometryFields.push({ name: "geometry", label: "" });
    }
    return geometryFields;
}

export function contextFeatureCollection(context, fieldName) {
    return {
        type: "FeatureCollection",
        features: ((context && context.list) || [])
            .map((obj) => {
                return contextFeature(obj, fieldName);
            })
            .filter((obj) => !!obj),
    };
}

export function contextFeature(context, fieldName) {
    const geometry = contextGeometry(context, fieldName);
    if (!geometry) {
        return null;
    }
    return {
        type: "Feature",
        id: context.id,
        geometry,
        properties: {
            ...context,
        },
    };
}

function contextGeometry(context, fieldName) {
    const [prefix, ...rest] = fieldName.split(".");
    if (!context) {
        return null;
    } else if (prefix.endsWith("[]")) {
        const list = context[prefix.slice(0, prefix.length - 2)];
        if (Array.isArray(list)) {
            return {
                type: "GeometryCollection",
                geometries: list.map((row) =>
                    contextGeometry(row, rest.join("."))
                ),
            };
        } else {
            return null;
        }
    } else {
        const obj = context[prefix];
        if (rest.length) {
            return contextGeometry(obj, rest.join("."));
        } else if (obj && obj.type && (obj.coordinates || obj.geometries)) {
            return obj;
        } else {
            return null;
        }
    }
}

export function useDataProps(data, context) {
    return useMemo(() => {
        const dataProps = {};
        if (Array.isArray(data)) {
            const [dataType, fieldName] = data;
            if (dataType === "context_feature_collection") {
                dataProps.data = contextFeatureCollection(context, fieldName);
            } else if (dataType === "context_feature") {
                dataProps.data = contextFeature(context, fieldName) || {
                    type: "Feature",
                    geometry: {
                        type: "GeometryCollection",
                        geometries: [],
                    },
                };
            } else {
                console.error("Unexpected data context array", data);
            }
        } else if (data) {
            dataProps.data = data;
        }
        return dataProps;
    }, [data, context]);
}

const _cache = {};

export function useGeoJSON(url, data) {
    const app = useApp(),
        [geojson, setGeojson] = useState();

    if (url && !(url.indexOf("/") === 0 || url.indexOf("http") === 0)) {
        console.warn(
            new Error(`Use "{{{rt}}}/${url}" instead of relative URL`)
        );
        url = app.service + "/" + url;
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
    if (geojson.type === "FeatureCollection") {
        geojson.features.forEach(function (feature) {
            addGeometry(feature.geometry);
        });
    } else if (geojson.type === "Feature") {
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
            type: "GeometryCollection",
            geometries: geoms.slice(-maxGeometries),
        };
    } else {
        return {
            type: "GeometryCollection",
            geometries: geoms,
        };
    }

    function addGeometry(geometry) {
        if (geometry.type == "GeometryCollection") {
            geometry.geometries.forEach(addGeometry);
        } else {
            geoms.push(geometry);
        }
    }
}

export function asFeatureCollection(geojson) {
    if (typeof geojson === "string") {
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
    if (geometry.type === "GeometryCollection") {
        features = geometry.geometries.map((geometry) => ({
            type: "Feature",
            properties: {},
            geometry,
        }));
    } else {
        features = [
            {
                type: "Feature",
                properties: {},
                geometry,
            },
        ];
    }

    return {
        type: "FeatureCollection",
        features,
    };
}

export function computeBounds(features) {
    let hasBounds = false,
        minx,
        miny,
        maxx,
        maxy;
    features.forEach((feature) => {
        const geometry = feature.geometry;
        if (geometry.type === "GeometryCollection") {
            geometry.geometries.forEach(addCoordinates);
        } else {
            addCoordinates(geometry.coordinates);
        }
    });

    function addCoordinates(coordinates) {
        if (!Array.isArray(coordinates)) {
            return;
        }
        if (Array.isArray(coordinates[0])) {
            coordinates.forEach(addCoordinates);
            return;
        }
        const [x, y] = coordinates;
        if (typeof x !== "number" || typeof y !== "number") {
            return;
        }
        if (hasBounds) {
            minx = Math.min(minx, x);
            miny = Math.min(miny, y);
            maxx = Math.max(maxx, x);
            maxy = Math.max(maxy, y);
        } else {
            hasBounds = true;
            minx = maxx = x;
            miny = maxy = y;
        }
    }

    if (hasBounds) {
        return [
            [minx, miny],
            [maxx, maxy],
        ];
    } else {
        return null;
    }
}

export function useGeolocation() {
    return {
        supported:
            typeof navigator !== "undefined" && "geolocation" in navigator,
        watchPosition(onPosition, onError, options) {
            return navigator.geolocation.watchPosition(
                onPosition,
                onError,
                options
            );
        },
        clearWatch(watchId) {
            return navigator.geolocation.clearWatch(watchId);
        },
    };
}

export function useStyleProp({ name, style, layer, color, icon }) {
    return useMemo(() => {
        if (!style && !layer) {
            console.warn(`Specify style or layer for "${name}"`);
            return { sources: {}, layers: [] };
        }
        if (typeof layer === "string") {
            layer = { id: layer, "source-layer": layer };
        }
        if (style) {
            return style;
        } else if (icon) {
            return {
                sources: {},
                layers: makeSymbolLayers(layer, icon),
            };
        } else if (color) {
            return {
                sources: {},
                layers: makeColorLayers(layer, color),
            };
        } else {
            return {
                sources: {},
                layers: makeColorLayers(layer, "#3388ff", "#3086cc"),
            };
        }
    }, [name, style, layer, color, icon]);
}

function makeSymbolLayers(layer, icon) {
    const { id, ["source-layer"]: sourceLayer, ...rest } = layer;
    return [
        {
            id: id,
            source: "_default",
            "source-layer": sourceLayer || id,
            type: "symbol",
            layout: {
                "icon-image": icon,
                "icon-allow-overlap": true,
            },
            ...rest,
        },
    ];
}

function makeColorLayers(layer, color, pointColor = color) {
    const { id, ["source-layer"]: sourceLayer, ...rest } = layer;
    return [
        {
            id: `${id}-fill`,
            source: "_default",
            "source-layer": sourceLayer || id,
            type: "fill",
            paint: {
                "fill-color": color,
                "fill-opacity": [
                    "match",
                    ["geometry-type"],
                    ["Polygon", "MultiPolygon"],
                    0.2,
                    0,
                ],
            },
            ...rest,
        },
        {
            id: `${id}-line`,
            source: "_default",
            "source-layer": sourceLayer || id,
            type: "line",
            paint: {
                "line-width": 3,
                "line-color": color,
                "line-opacity": 1,
            },
            ...rest,
        },
        {
            id: `${id}-circle`,
            source: "_default",
            "source-layer": sourceLayer || id,
            type: "circle",
            paint: {
                "circle-color": "white",
                "circle-radius": [
                    "match",
                    ["geometry-type"],
                    ["Point", "MultiPoint"],
                    3,
                    0,
                ],
                "circle-stroke-color": pointColor,
                "circle-stroke-width": [
                    "match",
                    ["geometry-type"],
                    ["Point", "MultiPoint"],
                    3,
                    0,
                ],
                "circle-opacity": [
                    "match",
                    ["geometry-type"],
                    ["Point", "MultiPoint"],
                    1,
                    0,
                ],
            },
            ...rest,
        },
    ];
}

export function useFeatureValues(feature, modelConf) {
    const slug = feature.properties[modelConf.lookup] || feature.id,
        form = modelConf.form || [{ name: "label" }],
        emptyForm = makeEmptyForm(form),
        app = useApp(),
        modelData = useModel(modelConf.name, slug),
        [fetchData, setFetchData] = useState({});

    useEffect(() => {
        loadData();
        async function loadData() {
            const data = await app.models[modelConf.name].find(slug);
            if (data) {
                setFetchData(data);
            }
        }
    }, [app, modelConf, slug]);

    return {
        ...emptyForm,
        ...feature.properties,
        ...fetchData,
        ...modelData,
    };
}

function makeEmptyForm(form) {
    const values = {};
    for (const field of form) {
        if (field.name === "" && field.type === "group") {
            Object.assign(values, makeEmptyForm(field.children));
        } else if (field.type === "group") {
            values[field.name] = makeEmptyForm(field.children);
        } else {
            values[field.name] = "-";
        }
    }
    return values;
}

export function useFeatureUrl(feature, modelConf, mode = "edit") {
    const slug = feature.properties[modelConf.lookup] || feature.id,
        reverse = useReverse(),
        authState = usePluginState("auth"),
        perms =
            authState &&
            authState.config &&
            authState.config.pages &&
            authState.config.pages[modelConf.name];

    if ((perms && perms.can_change) || mode !== "edit") {
        return reverse(`${modelConf.name}_${mode}`, slug);
    } else {
        return null;
    }
}
