import map, { EmbeddedGeo } from '@wq/map';
import leaflet from '../index';
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
    const { AutoMap } = map.components,
        { Geojson } = map.config.overlays;

    setRouteInfo({
        page: 'item',
        mode: 'list'
    });

    const result = renderTest(AutoMap, mockApp),
        overlay = result.root.findByType(Geojson);

    expect(overlay.props).toEqual({
        name: 'item',
        popup: 'item',
        url: '/items.geojson',
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
    const { Map } = leaflet.components,
        { Draw } = map.config.overlays,
        point = {
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
