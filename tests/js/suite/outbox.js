define(['./app', 'wq/store', 'wq/outbox'], function(appTests, ds, outbox) {

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

});
