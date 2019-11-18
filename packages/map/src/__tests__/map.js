import map from '../map';
import { routeMapConf } from '../hooks';
import renderTest from '@wq/react/test';
import routeConfig from './config.json';
import geojson from './geojson.json';

const mockReduxStore = {
    getState: () => state,
    subscribe: () => {},
    dispatch: () => {}
};
const state = {
    routeInfo: {},
    context: {}
};

const mockApp = {
    config: routeConfig,
    spin: {
        start: () => {},
        stop: () => {}
    },
    store: {
        _store: mockReduxStore,
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
    map.init({});
});

function getLayerConfs(routeInfo) {
    return routeMapConf(map.config, routeWithPath(routeInfo)).layers;
}

function routeWithPath(routeInfo) {
    const { page, mode, item_id } = routeInfo;
    let path = routeConfig.pages[page].url;
    if (mode === 'list') {
        path = `${path}/`;
    } else if (mode === 'detail') {
        path = `${path}/${item_id}`;
    } else if (mode) {
        path = `${path}/${item_id}/${mode}`;
    }
    return { page, mode, item_id, path };
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
    ).toEqual([
        {
            type: 'geojson',
            name: 'item',
            url: '/items/one/edit.geojson',
            flatten: true,
            draw: {
                polygon: {},
                polyline: {},
                marker: {},
                rectangle: {},
                circle: false
            }
        }
    ]);
});

const expectedLayers = [
    {
        type: 'geojson',
        name: 'Map Test',
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

    state.routeInfo = routeWithPath({
        page: 'item',
        mode: 'list'
    });

    const result = renderTest(AutoMap, mockApp),
        overlay = result.root.findByType(Geojson);

    expect(overlay.props).toEqual({
        name: 'item',
        popup: 'item',
        url: '/items.geojson',
        cluster: true
    });
});

test('edit map', async () => {
    const { AutoMap } = map.components,
        { Geojson } = map.config.overlays,
        point = {
            type: 'Point',
            coordinates: [45, -95]
        };

    state.routeInfo = routeWithPath({
        page: 'item',
        mode: 'edit',
        item_id: 123
    });
    state.routeInfo.outbox_id = 1;
    state.context = {
        geometry: JSON.stringify(point)
    };

    const result = renderTest(AutoMap, mockApp),
        overlay = result.root.findByType(Geojson);

    expect(overlay.props).toEqual({
        name: 'item',
        url: '/items/123/edit.geojson',
        draw: {
            circle: false,
            marker: {},
            polygon: {},
            polyline: {},
            rectangle: {}
        },
        data: point,
        flatten: true
    });
});
