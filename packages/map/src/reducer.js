import { routeMapConf } from './hooks';

const RENDER = 'RENDER';
export const MAP_READY = 'MAP_READY',
    MAP_SHOW_OVERLAY = 'MAP_SHOW_OVERLAY',
    MAP_HIDE_OVERLAY = 'MAP_HIDE_OVERLAY',
    MAP_SET_BASEMAP = 'MAP_SET_BASEMAP',
    MAP_SET_HIGHLIGHT = 'MAP_SET_HIGHLIGHT',
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
                _lastRouteInfo = routeInfo;
                if (!conf) {
                    return {};
                } else {
                    const mapId = state.mapId,
                        sameMap = mapId && mapId === conf.mapId;
                    return {
                        basemaps: reduceBasemaps(state.basemaps, conf.basemaps),
                        overlays: reduceOverlays(state.overlays, conf.layers),
                        bounds: conf.bounds,
                        mapProps: conf.mapProps,
                        highlight: sameMap ? state.highlight : null,
                        instance: sameMap ? state.instance : null,
                        mapId: conf.mapId
                    };
                }
            }
        }
        case MAP_READY:
            return {
                ...state,
                instance: action.payload
            };
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
            return {
                ...state,
                highlight: action.payload
            };
        case MAP_CLEAR_HIGHLIGHT:
            if (state.highlight === undefined) {
                return state;
            } else {
                return {
                    ...state,
                    highlight: undefined
                };
            }
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
    return basemaps;
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
    return overlays;
}
