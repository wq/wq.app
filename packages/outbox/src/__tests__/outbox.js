define(['./app', 'wq/app', 'wq/store', 'wq/outbox', 'data/config'],
function(appTests, app, ds, outbox, config) {

QUnit.module('wq/outbox');

QUnit.test("form with no explicit storage", function(assert) {
    testOutbox({
        'assert': assert,
        'data': {'test': 123},
        'options': {},
        'expectItem': {
            'id': 1,
            'synced': false,
            'data': {'test': 123},
            'options': {}
        },
        'expectStored': null
    });
});

QUnit.test("form with storage=store", function(assert) {
    var blob = new Blob([1,2,3], {'type': 'text/plain'});
    testOutbox({
        'assert': assert,
        'data': {
            'file': {
                  'type': 'text/plain',
                  'name': 'test.txt',
                  'body': blob
             }
        },
        'options': {
            'storage': 'store'
        },
        'expectItem': {
            'id': 1,
            'synced': false,
            'options': {
                'storage': 'store'
            }
        },
        'expectStored': {
            'file': {
                 'type': 'text/plain',
                 'name': 'test.txt',
                 'body': blob
            }
        }
    });
});

QUnit.test("form with storage=temporary", function(assert) {
    testOutbox({
        'assert': assert,
        'data': {'secret': 'code'},
        'options': {
            'storage': 'temporary'
        },
        'expectItem': {
            'id': 1,
            'synced': false,
            'options': {
                'storage': 'temporary'
            }
        },
        'expectStored': null
    });
});

function testOutbox(test) {
    var assert = test.assert,
        done = assert.async();
    outbox.model.overwrite([]).then(function() {
        return outbox.save(test.data, test.options, true);
    }).then(function() {
        return ds.get('outbox');
    }).then(function(actualOutbox) {
        var expectOutbox = {
            "list": [test.expectItem],
            "pages": 1,
            "count": 1,
            "per_page": 1
        };
        assert.deepEqual(
            actualOutbox,
            expectOutbox,
            'inlined item data should be: ' +
            JSON.stringify(test.expectItem.data)
        );
        return ds.get('outbox_1');
    }).then(function(actualStored) {
        assert.deepEqual(
            actualStored,
            test.expectStored,
            'stored item data should be: ' + JSON.stringify(test.expectStored)
        );
        return outbox.loadItem(1);
    }).then(function(actualItem) {
        assert.deepEqual(
            actualItem.data,
            test.data,
            'reconstituted item data should be: ' + JSON.stringify(test.data)
        );
    }).then(done);
}

QUnit.test('sync dependent records in order', function(assert) {
    var done = assert.async();

    var itemtype = {
        'data': {
            'label': 'New ItemType'
        },
        'options': {
            'url': config.pages.itemtype.url,
            'modelConf': config.pages.itemtype
        }
    };

    var attribute = {
        'data': {
            'label': 'New Attribute'
        },
        'options': {
            'url': config.pages.attribute.url,
            'modelConf': config.pages.attribute
        }
    };

    var item = {
        'data': {
            'type_id': 'outbox-1',
            'color': 'red',
            'values[0][attribute_id]': 'outbox-2',
            'values[0][value]': 'Test Value',
        },
        'options': {
             'url': config.pages.item.url,
             'modelConf': config.pages.item
        }
    };

    // Save three records to outbox
    outbox.model.overwrite([]).then(function() {
        return outbox.save(itemtype.data, itemtype.options, true);
    }).then(function() {
        return outbox.save(attribute.data, attribute.options, true);
    }).then(function() {
        return outbox.save(item.data, item.options, true);
    }).then(function() {
        return ds.get('outbox');
    }).then(function(actualOutbox) {
        var expectOutbox = {
            "list": [{
                 'id': 3,
                 'data': item.data,
                 'options': item.options,
                 'synced': false,
                 'parents': ["1", "2"],
            }, {
                 'id': 2,
                 'data': attribute.data,
                 'options': attribute.options,
                 'synced': false,
            }, {
                 'id': 1,
                 'data': itemtype.data,
                 'options': itemtype.options,
                 'synced': false,
            }],
            "pages": 1,
            "count": 3,
            "per_page": 3
        };
        assert.deepEqual(
            actualOutbox,
            expectOutbox,
            "outbox should contain itemtype, attribute, and item records"
        );

        // Sync records.  sendAll() should automatically sync the parent
        // records (itemtype, attribute) before syncing item.
        return outbox.sendAll();
    }).then(function() {
        return ds.get('outbox');
    }).then(function(actualOutbox) {
        // All records should now be synced and have results
        var results = {};
        actualOutbox.list.forEach(function(item) {
            var name = (
                item.options &&
                item.options.modelConf &&
                item.options.modelConf.name
            );
            assert.ok(item.synced, name + ' synced');
            results[name] = item.result;
        });

        assert.equal(
            results.item.type_id,
            results.itemtype.id,
            "item should get type_id from synced itemtype"
        );

        assert.equal(
            results.item.values[0].attribute_id,
            results.attribute.id,
            "item.values[0] should get attribute_id from synced attribute"
        );

    }).then(function() {
        // Reset models
        return Promise.all([
            app.models.itemtype.prefetch(),
            app.models.attribute.prefetch(),
            app.models.item.prefetch(),
        ]);
    }).then(done);
});

});
