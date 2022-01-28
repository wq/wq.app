import React from 'react';
import map, { AutoMap, EmbeddedGeo } from '@wq/map';
import { Geojson, Draw } from '../overlays/index';
import leaflet, { Map } from '../index';
import renderTest, { nextTick } from '@wq/react/test';
import routeConfig from './config.json';
import geojson from './geojson.json';

/* global L */

import { createStore, combineReducers, bindActionCreators } from 'redux';

const store = createStore(
    combineReducers({
        map(state, action) {
            return map.reducer(state, action);
        },
        routeInfo(state = {}, action) {
            if (action.type === 'RENDER') {
                return action.payload.router_info;
            } else {
                return state;
            }
        },
        context(state = {}, action) {
            if (action.type === 'RENDER') {
                return action.payload;
            } else {
                return state;
            }
        }
    })
);
Object.assign(map, bindActionCreators(map.actions, store.dispatch.bind(store)));

const mockApp = {
    config: routeConfig,
    spin: {
        start: () => {},
        stop: () => {}
    },
    store: {
        _store: store,
        ajax: () => {
            return Promise.resolve(geojson);
        }
    },
    plugins: { map, leaflet }
};

beforeAll(() => {
    Object.keys(mockApp.config.pages).forEach(
        key => (mockApp.config.pages[key].name = key)
    );
    map.app = mockApp;
    map.init({});
    // L.Browser.svg not set correctly in jsdom
    L.Map.prototype._createRenderer = function (opts) {
        return new L.SVG(opts);
    };
});

beforeEach(() => {
    document.body.innerHTML = '';
});

function routeWithPath(routeInfo) {
    const { page, mode, item_id, outbox_id } = routeInfo;
    let path = routeConfig.pages[page].url;
    if (mode === 'list') {
        path = `${path}/`;
    } else if (mode === 'detail') {
        path = `${path}/${item_id}`;
    } else if (mode) {
        path = `${path}/${item_id}/${mode}`;
    }
    return { page, mode, item_id, outbox_id, path };
}

function setRouteInfo(routeInfo, context = {}) {
    store.dispatch({
        type: 'RENDER',
        payload: {
            ...context,
            router_info: routeWithPath(routeInfo)
        }
    });
}

test('list map', async () => {
    const context = {
            list: [
                {
                    id: 'one',
                    label: 'ONE',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-93.28044891357422, 44.9771852553236],
                                [-93.28611373901367, 44.972084916104706],
                                [-93.27701568603516, 44.9715991458543],
                                [-93.27220916748047, 44.9810709235921],
                                [-93.27924728393555, 44.983985001986305],
                                [-93.28044891357422, 44.9771852553236]
                            ]
                        ]
                    }
                },
                {
                    id: 'two',
                    label: 'TWO',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-93.25349807739258, 44.968927335931234],
                                [-93.25349807739258, 44.977670978257756],
                                [-93.24045181274414, 44.977670978257756],
                                [-93.24045181274414, 44.968927335931234],
                                [-93.25349807739258, 44.968927335931234]
                            ]
                        ]
                    }
                },
                {
                    id: 'three',
                    label: 'THREE',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-93.25950622558594, 44.98738457290511],
                                [-93.24714660644531, 44.984592083008145],
                                [-93.24388504028319, 44.99357613047141],
                                [-93.25693130493164, 44.99612540094354],
                                [-93.25950622558594, 44.98738457290511]
                            ]
                        ]
                    }
                }
            ]
        },
        data = {
            type: 'FeatureCollection',
            features: context.list.map(obj => ({
                type: 'Feature',
                id: obj.id,
                properties: obj,
                geometry: obj.geometry
            }))
        };

    setRouteInfo(
        {
            page: 'item',
            mode: 'list'
        },
        context
    );

    const result = renderTest(() => <AutoMap context={context} />, mockApp),
        overlay = result.root.findByType(Geojson);

    expect(overlay.props).toEqual({
        name: 'item',
        popup: 'item',
        data,
        cluster: true,
        active: true
    });

    await nextTick();

    const leafletOverlay =
        overlay.children[0].children[0].children[0].instance.leafletElement;

    expect(leafletOverlay.getBounds().toBBoxString()).toEqual(
        '-93.28611373901367,44.968927335931234,-93.24045181274414,44.99612540094354'
    );

    result.unmount();
});

test('edit map (leaflet.draw)', async () => {
    const point = {
        type: 'Point',
        coordinates: [45, -95]
    };

    setRouteInfo(
        {
            page: 'item',
            mode: 'edit',
            item_id: 123,
            outbox_id: 1
        },
        {
            geometry: point
        }
    );

    const Component = EmbeddedGeo.makeComponent({
        type: 'geopoint',
        value: point
    });

    const result = renderTest(Component, mockApp),
        overlay = result.root.findByType(Draw);

    const { type, data } = overlay.props;
    expect(type).toEqual('point');
    expect(data).toEqual({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: point }]
    });

    await nextTick();

    const leafletOverlay =
        overlay.children[0].children[0].instance.leafletElement;

    expect(leafletOverlay.getBounds().toBBoxString()).toEqual('45,-95,45,-95');

    const mapInst = result.root.findByType(Map),
        container = mapInst.children[0].instance.container,
        draw = container.getElementsByClassName('leaflet-draw');

    expect(draw.length).toEqual(1);

    result.unmount();
});
