import map from '../map';
import { routeMapConf } from '../hooks';
import { EmbeddedGeo } from '../inputs';
import renderTest from '@wq/react/test';
import routeConfig from './config.json';
import geojson from './geojson.json';
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
    plugins: { map }
};

beforeAll(() => {
    Object.keys(mockApp.config.pages).forEach(
        key => (mockApp.config.pages[key].name = key)
    );
    map.app = mockApp;
    map.init(routeConfig.map);
});

function getLayerConfs(routeInfo) {
    return routeMapConf(map.config, routeWithPath(routeInfo)).layers;
}

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

test('auto map config for list pages', () => {
    expect(
        getLayerConfs({
            page: 'item',
            mode: 'list'
        })
    ).toEqual([
        {
            type: 'geojson',
            name: 'item',
            active: true,
            url: '/items.geojson',
            popup: 'item',
            cluster: true
        }
    ]);
    expect(
        getLayerConfs({
            page: 'item',
            mode: 'detail',
            item_id: 'one'
        })
    ).toEqual([
        {
            type: 'geojson',
            name: 'item',
            active: true,
            popup: 'item',
            url: '/items/one.geojson'
        }
    ]);
    expect(
        getLayerConfs({
            page: 'item',
            mode: 'edit',
            item_id: 'one'
        })
    ).toEqual([]);
});

const expectedLayers = [
    {
        type: 'geojson',
        name: 'Map Test',
        active: true,
        url: 'test.geojson'
    }
];

test('manual map config for list pages', () => {
    expect(
        getLayerConfs({
            page: 'listmap1',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: 'listmap2',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: 'listmap3',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: 'listmap3',
            mode: 'detail'
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: 'listmap4',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    // FIXME: Restore multiple map support
    /*
    expect(
        getLayerConfs(
            {
                page: 'listmap4',
                mode: 'list'
            },
            'second'
        )
    ).toEqual([
        {
            type: 'geojson',
            name: 'Map Test2',
            url: 'test2.geojson'
        }
    ]);
    */
});

test('manual map config for other pages', () => {
    expect(
        getLayerConfs({
            page: 'othermap1'
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: 'othermap2'
        })
    ).toEqual(expectedLayers);

    expect(
        getLayerConfs({
            page: 'othermap3'
        })
    ).toEqual(expectedLayers);
});

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

    result.unmount();
});

test('edit map', async () => {
    const { Draw } = map.config.overlays,
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
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: point
            }
        ]
    });

    result.unmount();
});

test('special layer types', async () => {
    const { AutoMap } = map.components,
        { Geojson } = map.config.overlays;

    setRouteInfo({
        page: 'special'
    });

    const result = renderTest(AutoMap, mockApp),
        overlays = result.root
            .findAllByType(Geojson)
            .map(overlay => overlay.props);

    expect(overlays).toHaveLength(2);
    expect(overlays[0]).toEqual({
        name: 'Group 1-0',
        active: true,
        url: 'layer1.geojson'
    });
    expect(overlays[1]).toEqual({
        name: 'Group 1-1',
        active: true,
        url: 'layer2.geojson'
    });

    result.unmount();
});

test('toggle layers', async () => {
    setRouteInfo({
        page: 'multilayer'
    });
    expect(store.getState().map).toEqual({
        basemaps: [
            {
                name: 'Basemap 1',
                type: 'tile',
                url: 'http://example.org/street/{z}/{x}/{y}.png',
                active: true
            },
            {
                name: 'Basemap 2',
                url: 'http://example.org/aerial/{z}/{x}/{y}.png',
                type: 'tile',
                active: false
            }
        ],
        overlays: [
            {
                name: 'Layer 1',
                type: 'geojson',
                url: 'layer1.geojson',
                active: true
            },
            {
                name: 'Layer 2',
                type: 'geojson',
                url: 'layer2.geojson',
                active: true
            },
            {
                name: 'Layer 3',
                type: 'geojson',
                url: 'layer3.geojson',
                active: false
            }
        ],
        bounds: [
            [-4, -4],
            [4, 4]
        ],
        mapProps: undefined,
        mapId: undefined,
        highlight: null,
        instance: null
    });

    map.setBasemap('Basemap 2');
    expect(store.getState().map.basemaps).toEqual([
        {
            name: 'Basemap 1',
            type: 'tile',
            url: 'http://example.org/street/{z}/{x}/{y}.png',
            active: false
        },
        {
            name: 'Basemap 2',
            url: 'http://example.org/aerial/{z}/{x}/{y}.png',
            type: 'tile',
            active: true
        }
    ]);

    map.hideOverlay('Layer 2');
    map.showOverlay('Layer 3');

    expect(store.getState().map.overlays).toEqual([
        {
            name: 'Layer 1',
            type: 'geojson',
            url: 'layer1.geojson',
            active: true
        },
        {
            name: 'Layer 2',
            type: 'geojson',
            url: 'layer2.geojson',
            active: false
        },
        {
            name: 'Layer 3',
            type: 'geojson',
            url: 'layer3.geojson',
            active: true
        }
    ]);
});

test('highlight layer', async () => {
    const { AutoMap } = map.components,
        { Highlight } = map.config.overlays;

    setRouteInfo({
        page: 'multilayer'
    });

    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [45, -95]
                }
            }
        ]
    };

    map.setHighlight(geojson);

    const result = renderTest(AutoMap, mockApp),
        overlay = result.root.findByType(Highlight);

    expect(overlay.props.data).toEqual(geojson);

    result.unmount();
});
