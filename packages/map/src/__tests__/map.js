define(['./app', 'wq/map'],
function(appTests, map) {

QUnit.module('wq/map');

return appTests.then(function() {

var expectedLayers = [{
    'type': 'geojson',
    'name': 'Map Test',
    'url': 'test.geojson'
}];

QUnit.test("auto map config for list pages", function(assert) {
    assert.deepEqual(
        [{
            'type': 'geojson',
            'name': 'item',
            'url': 'items.geojson',
            'popup': 'item',
            'cluster': true
        }],
        map.getLayerConfs({
            'page': 'item',
            'mode': 'list'
        }),
        'list mode'
    );
    assert.deepEqual(
        [{
            'type': 'geojson',
            'name': 'item',
            'popup': 'item',
            'url': 'items/one.geojson'
        }],
        map.getLayerConfs({
            'page': 'item',
            'mode': 'detail',
            'item_id': 'one'
        }),
        'detail mode'
    );
    assert.deepEqual(
        [{
            'type': 'geojson',
            'name': 'item',
            'url': 'items/one/edit.geojson',
            'flatten': true,
            'draw': {
                'polygon': {},
                'polyline': {},
                'marker': {},
                'rectangle': {},
                'circle': false
            }
        }],
        map.getLayerConfs({
            'page': 'item',
            'mode': 'edit',
            'item_id': 'one'
        }),
        'edit mode'
    );
});

QUnit.test("manual map config for list pages", function(assert) {
    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'listmap1',
            'mode': 'list'
        }),
        "single configuration"
    );

    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'listmap2',
            'mode': 'list'
        }),
        "explicit list mode"
    );
    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'listmap3',
            'mode': 'list'
        }),
        "default used for list"
    );
    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'listmap3',
            'mode': 'detail'
        }),
        "default used for detail"
    );
    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'listmap4',
            'mode': 'list'
        }),
        "explicit main map"
    );
    assert.deepEqual(
        [{
            'type': 'geojson',
            'name': 'Map Test2',
            'url': 'test2.geojson'
        }],
        map.getLayerConfs({
            'page': 'listmap4',
            'mode': 'list'
        }, 'second'),
        "second map"
    );
});

QUnit.test("manual map config for other pages", function(assert) {
    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'othermap1'
        }),
        "single configuration"
    );

    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'othermap2'
        }),
        "explicit mode (all/defaults)"
    );

    assert.deepEqual(
        expectedLayers,
        map.getLayerConfs({
            'page': 'othermap3'
        }),
        "explicit main map"
    );

});

});

});
