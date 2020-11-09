import { routeMapConf } from './hooks';

const RENDER = 'RENDER';
export const MAP_READY = 'MAP_READY',
    MAP_SHOW_OVERLAY = 'MAP_SHOW_OVERLAY',
    MAP_HIDE_OVERLAY = 'MAP_HIDE_OVERLAY',
    MAP_SET_BASEMAP = 'MAP_SET_BASEMAP',
    MAP_SET_HIGHLIGHT = 'MAP_SET_HIGHLIGHT',
    MAP_ADD_HIGHLIGHT = 'MAP_ADD_HIGHLIGHT',
    MAP_TOGGLE_HIGHLIGHT = 'MAP_TOGGLE_HIGHLIGHT',
    MAP_REMOVE_HIGHLIGHT = 'MAP_REMOVE_HIGHLIGHT',
    MAP_CLEAR_HIGHLIGHT = 'MAP_CLEAR_HIGHLIGHT',
    MAP_SET_BOUNDS = 'MAP_SET_BOUNDS';

var _lastRouteInfo = null;

export default function reducer(state = {}, action, config) {
    switch (action.type) {
        case RENDER: {
            const context = action.payload,
                { router_info: routeInfo } = context,
                conf = routeMapConf(config, routeInfo, context);
            if (routeInfo === _lastRouteInfo) {
                return state;
            } else {
                _lastRouteInfo = routeInfo;
                let nextState = {};
                const { stickyMaps } = state;
                if (!conf) {
                    nextState = { stickyMaps };
                } else {
                    const { mapId } = conf,
                        { highlight = null, instance = null } =
                            (mapId && stickyMaps && stickyMaps[mapId]) || {};
                    nextState = {
                        basemaps: reduceBasemaps(state.basemaps, conf.basemaps),
                        overlays: reduceOverlays(state.overlays, conf.layers),
                        bounds: conf.bounds,
                        mapProps: conf.mapProps,
                        highlight,
                        instance,
                        mapId,
                        stickyMaps
                    };
                }
                if (!nextState.stickyMaps) {
                    delete nextState.stickyMaps;
                }
                return nextState;
            }
        }
        case MAP_READY:
            return reduceMapState({ ...state, instance: action.payload });
        case MAP_SHOW_OVERLAY:
            return {
                ...state,
                overlays:
                    state.overlays &&
                    state.overlays.map(overlay => {
                        if (overlay.name === action.payload) {
                            return { ...overlay, active: true };
                        } else {
                            return overlay;
                        }
                    })
            };
        case MAP_HIDE_OVERLAY:
            return {
                ...state,
                overlays:
                    state.overlays &&
                    state.overlays.map(overlay => {
                        if (overlay.name === action.payload) {
                            return { ...overlay, active: false };
                        } else {
                            return overlay;
                        }
                    })
            };
        case MAP_SET_BASEMAP:
            return {
                ...state,
                basemaps:
                    state.basemaps &&
                    state.basemaps.map(basemap => {
                        if (basemap.name === action.payload) {
                            return { ...basemap, active: true };
                        } else if (basemap.active) {
                            return { ...basemap, active: false };
                        } else {
                            return basemap;
                        }
                    })
            };
        case MAP_SET_HIGHLIGHT:
            return reduceMapState({
                ...state,
                highlight: action.payload
            });
        case MAP_ADD_HIGHLIGHT: {
            if (!state.highlight) {
                return reduceMapState({ ...state, highlight: action.payload });
            }
            const features = {};
            let hasNew = false;
            state.highlight.features.forEach(
                feature => (features[feature.id] = feature)
            );
            action.payload.features.forEach(feature => {
                if (!features[feature.id]) {
                    hasNew = true;
                    features[feature.id] = feature;
                }
            });
            if (!hasNew) {
                return state;
            }
            return reduceMapState({
                ...state,
                highlight: {
                    type: 'FeatureCollection',
                    features: Object.values(features)
                }
            });
        }
        case MAP_TOGGLE_HIGHLIGHT: {
            if (!state.highlight) {
                return reduceMapState({ ...state, highlight: action.payload });
            }
            const features = {};
            state.highlight.features.forEach(
                feature => (features[feature.id] = feature)
            );

            action.payload.features.forEach(feature => {
                if (features[feature.id]) {
                    delete features[feature.id];
                } else {
                    features[feature.id] = feature;
                }
            });

            return reduceMapState({
                ...state,
                highlight: checkEmpty({
                    type: 'FeatureCollection',
                    features: Object.values(features)
                })
            });
        }
        case MAP_REMOVE_HIGHLIGHT: {
            if (!state.highlight) {
                return state;
            }
            const remove = {};
            action.payload.features.forEach(
                feature => (remove[feature.id] = true)
            );

            return reduceMapState({
                ...state,
                highlight: checkEmpty({
                    type: 'FeatureCollection',
                    features: state.highlight.features.filter(
                        feature => !remove[feature.id]
                    )
                })
            });
        }

        case MAP_CLEAR_HIGHLIGHT:
            if (!state.highlight) {
                return state;
            } else {
                return reduceMapState({
                    ...state,
                    highlight: null
                });
            }
        case MAP_SET_BOUNDS:
            return {
                ...state,
                bounds: action.payload
            };
        default:
            return state;
    }
}

function reduceBasemaps(lastBasemaps, nextBasemaps) {
    if (!nextBasemaps || nextBasemaps.length === 0) {
        return;
    }
    const activeBasemap = (lastBasemaps || []).filter(
            basemap => basemap.active
        )[0],
        basemaps = nextBasemaps.map(basemap => {
            if (activeBasemap && activeBasemap.name === basemap.name) {
                return {
                    ...basemap,
                    active: true
                };
            } else {
                return {
                    ...basemap,
                    active: false
                };
            }
        });
    if (!basemaps.some(basemap => basemap.active)) {
        basemaps[0].active = true;
    }
    if (sameLayers(basemaps, lastBasemaps)) {
        return lastBasemaps;
    } else {
        return basemaps;
    }
}

function reduceOverlays(lastOverlays, nextOverlays) {
    if (!nextOverlays || nextOverlays.length === 0) {
        return [];
    }
    const lastActive = {};
    (lastOverlays || []).forEach(overlay => {
        lastActive[overlay.name] = overlay.active;
    });
    const overlays = nextOverlays.map(overlay => {
        if (lastActive[overlay.name]) {
            return {
                ...overlay,
                active: true
            };
        } else if (overlay.active) {
            return {
                ...overlay
            };
        } else {
            return {
                ...overlay,
                active: false
            };
        }
    });
    if (sameLayers(overlays, lastOverlays)) {
        return lastOverlays;
    } else {
        return overlays;
    }
}

function sameLayers(arr1, arr2) {
    if (arr1.length !== (arr2 || []).length) {
        return false;
    }
    return arr1.every(
        (layer, i) =>
            layer.name === arr2[i].name && layer.active === arr2[i].active
    );
}

function checkEmpty(geojson) {
    if (geojson.features.length === 0) {
        return null;
    } else {
        return geojson;
    }
}

function reduceMapState(state) {
    const { mapId, instance, highlight } = state;
    if (mapId) {
        const stickyMaps = state.stickyMaps || {};
        return {
            ...state,
            stickyMaps: {
                ...stickyMaps,
                [mapId]: { instance, highlight }
            }
        };
    } else {
        return state;
    }
}
