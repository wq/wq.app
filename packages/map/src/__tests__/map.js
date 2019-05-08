import map from '../map';
import tmpl from '@wq/template';
import routeConfig from './config.json';
import geojson from './geojson.json';

/* global L */

const mockApp = {
    config: routeConfig,
    spin: {
        start: () => {},
        stop: () => {}
    },
    store: {
        ajax: () => {
            return Promise.resolve(geojson);
        }
    }
};

const $mockPage = {
    find: () => $mockPage,
    parents: () => $mockPage,
    on: () => {},
    attr: () => {},
    is: () => {}
};

beforeAll(() => {
    Object.keys(mockApp.config.pages).forEach(
        key => (mockApp.config.pages[key].name = key)
    );
    map.app = mockApp;
    map.init({});
    tmpl.init({
        templates: {},
        jQuery: { mobile: {} }
    });
    // L.Browser.svg not set correctly in jsdom
    L.Map.prototype._createRenderer = function(opts) {
        return new L.SVG(opts);
    };
});

beforeEach(() => {
    document.body.innerHTML = '';
});

test('auto map config for list pages', () => {
    expect(
        map.getLayerConfs({
            page: 'item',
            mode: 'list'
        })
    ).toEqual([
        {
            type: 'geojson',
            name: 'item',
            url: 'items.geojson',
            popup: 'item',
            cluster: true
        }
    ]);
    expect(
        map.getLayerConfs({
            page: 'item',
            mode: 'detail',
            item_id: 'one'
        })
    ).toEqual([
        {
            type: 'geojson',
            name: 'item',
            popup: 'item',
            url: 'items/one.geojson'
        }
    ]);
    expect(
        map.getLayerConfs({
            page: 'item',
            mode: 'edit',
            item_id: 'one'
        })
    ).toEqual([
        {
            type: 'geojson',
            name: 'item',
            url: 'items/one/edit.geojson',
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
        map.getLayerConfs({
            page: 'listmap1',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs({
            page: 'listmap2',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs({
            page: 'listmap3',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs({
            page: 'listmap3',
            mode: 'detail'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs({
            page: 'listmap4',
            mode: 'list'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs(
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
});

test('manual map config for other pages', () => {
    expect(
        map.getLayerConfs({
            page: 'othermap1'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs({
            page: 'othermap2'
        })
    ).toEqual(expectedLayers);

    expect(
        map.getLayerConfs({
            page: 'othermap3'
        })
    ).toEqual(expectedLayers);
});

test('list map', async () => {
    const routeInfo = {
        page: 'item',
        mode: 'list',
        page_config: map.app.config.pages.item
    };
    var div = document.createElement('div');
    div.id = 'item-map';
    document.body.appendChild(div);
    map.run($mockPage, routeInfo);
    var layers = map.getLayers(routeInfo);
    await layers['item'].ready;
    expect(layers['item'].getBounds().toBBoxString()).toEqual(
        '-93.28611373901367,44.968927335931234,-93.24045181274414,44.99612540094354'
    );
});

test('edit map (leaflet.draw)', async () => {
    const routeInfo = {
        page: 'item',
        mode: 'edit',
        page_config: map.app.config.pages.item
    };
    var div = document.createElement('div');
    div.id = 'item-map';
    document.body.appendChild(div);
    map.run($mockPage, routeInfo);
    var layers = map.getLayers(routeInfo);
    await layers['item'].ready;
    var draw = div.getElementsByClassName('leaflet-draw');
    expect(draw.length).toEqual(1);
});
