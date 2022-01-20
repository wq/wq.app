import { routeMapConf } from './hooks';

const RENDER = 'RENDER';
export const MAP_READY = 'MAP_READY',
    MAP_SET_STICKY_PROPS = 'MAP_SET_STICKY_PROPS',
    MAP_SET_STICKY_ID = 'MAP_SET_STICKY_ID',
    MAP_SHOW_OVERLAY = 'MAP_SHOW_OVERLAY',
    MAP_HIDE_OVERLAY = 'MAP_HIDE_OVERLAY',
    MAP_SET_BASEMAP = 'MAP_SET_BASEMAP',
    MAP_SET_HIGHLIGHT = 'MAP_SET_HIGHLIGHT',
    MAP_ADD_HIGHLIGHT = 'MAP_ADD_HIGHLIGHT',
    MAP_TOGGLE_HIGHLIGHT = 'MAP_TOGGLE_HIGHLIGHT',
    MAP_REMOVE_HIGHLIGHT = 'MAP_REMOVE_HIGHLIGHT',
    MAP_CLEAR_HIGHLIGHT = 'MAP_CLEAR_HIGHLIGHT';

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
                const isSameView =
                    _lastRouteInfo &&
                    ['name', 'mode', 'variant', 'item_id'].every(
                        key => routeInfo[key] == _lastRouteInfo[key]
                    );
                _lastRouteInfo = routeInfo;
                let nextState = {};
                const {
                    stickyMaps,
                    stickyMapId,
                    activeBasemap,
                    activeOverlays
                } = state;
                if (!conf) {
                    nextState = { stickyMaps, activeBasemap, activeOverlays };
                } else {
                    const { mapId } = conf,
                        {
                            highlight = null,
                            instance = (isSameView && state.instance) || null,
                            instances = (isSameView && state.instances) || {}
                        } = (mapId && stickyMaps && stickyMaps[mapId]) || {};
                    nextState = {
                        basemaps: reduceBasemaps(
                            state.basemaps,
                            conf.basemaps,
                            activeBasemap
                        ),
                        overlays: reduceOverlays(
                            state.overlays,
                            conf.layers,
                            activeOverlays,
                            isSameView
                        ),
                        initBounds: conf.bounds,
                        autoZoom: conf.autoZoom,
                        mapProps: conf.mapProps,
                        highlight,
                        instance,
                        instances,
                        mapId,
                        stickyMapId:
                            isSameView && stickyMapId === mapId ? mapId : null,
                        stickyMaps,
                        activeBasemap,
                        activeOverlays
                    };
                }
                [
                    'stickyMaps',
                    'stickyMapId',
                    'activeBasemap',
                    'activeOverlays'
                ].forEach(key => {
                    if (!nextState[key]) {
                        delete nextState[key];
                    }
                });
                return nextState;
            }
        }
        case MAP_READY: {
            const { name, instance } = action.payload;
            if (name) {
                return reduceMapState({
                    ...state,
                    instances: { ...state.instances, [name]: instance }
                });
            } else {
                return reduceMapState({ ...state, instance });
            }
        }
        case MAP_SET_STICKY_PROPS:
            return reduceMapState(state, { props: action.payload });
        case MAP_SET_STICKY_ID:
            return { ...state, stickyMapId: action.payload };
        case MAP_SHOW_OVERLAY:
            return {
                ...state,
                activeOverlays: {
                    ...state.activeOverlays,
                    [action.payload]: true
                },
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
                activeOverlays: {
                    ...state.activeOverlays,
                    [action.payload]: false
                },
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
                activeBasemap: action.payload,
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
        default:
            return state;
    }
}

function reduceBasemaps(lastBasemaps, nextBasemaps, activeBasemap) {
    if (!nextBasemaps || nextBasemaps.length === 0) {
        return;
    }
    const basemaps = nextBasemaps.map(basemap => {
        if (activeBasemap && activeBasemap === basemap.name) {
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

function reduceOverlays(
    lastOverlays,
    nextOverlays,
    activeOverlays,
    isSameView
) {
    if (!nextOverlays || nextOverlays.length === 0) {
        return [];
    }
    const overlays = nextOverlays.map(overlay => {
        if (activeOverlays && activeOverlays[overlay.name]) {
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
    if (isSameView && sameLayers(overlays, lastOverlays)) {
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

function reduceMapState(state, stickyState) {
    const { mapId, instance, instances, highlight } = state;
    if (mapId) {
        const stickyMaps = state.stickyMaps || {};
        return {
            ...state,
            stickyMaps: {
                ...stickyMaps,
                [mapId]: { instance, instances, highlight, ...stickyState }
            }
        };
    } else {
        return state;
    }
}
