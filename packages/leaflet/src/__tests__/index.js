import map from '@wq/map';
import leaflet from '../index';
import renderTest, { nextTick } from '@wq/react/test';
import routeConfig from './config.json';
import geojson from './geojson.json';

/* global L */

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
    plugins: { map, leaflet }
};

beforeAll(() => {
    Object.keys(mockApp.config.pages).forEach(
        key => (mockApp.config.pages[key].name = key)
    );
    map.app = mockApp;
    map.init({});
    // L.Browser.svg not set correctly in jsdom
    L.Map.prototype._createRenderer = function(opts) {
        return new L.SVG(opts);
    };
});

beforeEach(() => {
    document.body.innerHTML = '';
});

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

    await nextTick();

    const leafletOverlay =
        overlay.children[0].children[0].instance.leafletElement;

    expect(leafletOverlay.getBounds().toBBoxString()).toEqual(
        '-93.28611373901367,44.968927335931234,-93.24045181274414,44.99612540094354'
    );
});

test('edit map (leaflet.draw)', async () => {
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

    await nextTick();

    const leafletOverlay =
        overlay.children[0].children[0].instance.leafletElement;

    expect(leafletOverlay.getBounds().toBBoxString()).toEqual('45,-95,45,-95');

    /* FIXME: Restore and test leaflet.draw support
    var draw = div.getElementsByClassName('leaflet-draw');
    expect(draw.length).toEqual(1);
    */
});
