import locate from '../locate';
import map from '../map';
import routeConfig from './config.json';

const mockApp = {
    config: routeConfig,
    plugins: { map: map }
};

const $mockPage = {
    find: () => $mockPage,
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
    locate.app = mockApp;
});

test('locate plugin', () => {
    const routeInfo = {
        page: 'point',
        mode: 'edit',
        page_config: locate.app.config.pages.point
    };
    var div = document.createElement('div');
    div.id = 'point-map';
    document.body.appendChild(div);
    map.run($mockPage, routeInfo);
    locate.run($mockPage, routeInfo);

    var lastError;
    locate.config.onError = err => (lastError = err);
    locate.locators['point'].setMode('gps');
    expect(lastError.message).toBe(
        'Geolocation error: Geolocation not supported..'
    );
});
