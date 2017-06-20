define(['wq/store', 'wq/model'], function(store, model) {

QUnit.module('wq/model');

var ds = store.getStore('model-test');
ds.init({
    'service': '/tests',
    'defaults': {
        'format': 'json'
    }
});
var items = model({
    'url': 'items',
    'store': ds,
    'cache': 'all',
});
var itemtypes = model({
    'url': 'itemtypes',
    'store': ds,
    'cache': 'all',
});

QUnit.test("load data list", function(assert) {
    var done = assert.async();
    items.load().then(function(data) {
        assert.ok(data);
        assert.equal(data.list.length, 3, "list should have 3 items");
        assert.equal(data.count, 3, "count should reflect list length");
        assert.equal(data.pages, 1, "assume one page unless specified");
        done();
    });
});

QUnit.test("find item", function(assert) {
    var done = assert.async();
    items.find("one").then(function(item) {
        assert.equal(item.id, "one", "item identifier");
        assert.equal(item.label, "ONE", "item label");
        assert.equal(item.contacts.length, 2, "nested array");
        done();
    });
});

QUnit.test("filter by single value", function(assert) {
    var done = assert.async();
    items.filter({'type_id': 1}).then(function(items) {
        assert.equal(items.length, 2, "filter should return two results");
        assert.equal(items[0].id, "one", "first result should be item 'one'");
        assert.equal(items[1].id, "two", "second result should be item 'two'");
        done();
    });
});

QUnit.test("filter by multiple values", function(assert) {
    var done = assert.async();
    items.filter({'color': ['#f00', '#00f']}).then(function(items) {
        assert.equal(items.length, 2, "filter should return two results");
        assert.equal(items[0].id, "one", "first result should be item 'one'");
        assert.equal(
            items[1].id, "three", "second result should be item 'three'"
        );
        done();
    });
});

QUnit.test("filter by boolean (true)", function(assert) {
    var done = assert.async();
    Promise.all([
        testBooleanResult(assert, true, '1'),
        testBooleanResult(assert, 1, '1'),
        testBooleanResult(assert, 't', '1')
    ]).then(done).catch(done);
});

QUnit.test("filter by boolean (false)", function(assert) {
    var done = assert.async();
    Promise.all([
        testBooleanResult(assert, false, '2'),
        testBooleanResult(assert, 0, '2'),
        testBooleanResult(assert, 'f', '2')
    ]).then(done).catch(done);
});

QUnit.test("filter by boolean (null)", function(assert) {
    var done = assert.async();
    Promise.all([
        testBooleanResult(assert, null, '3'),
        testBooleanResult(assert, 'null', '3')
    ]).then(done).catch(done);
});

QUnit.test("filter by boolean (empty)", function(assert) {
    var done = assert.async();
    Promise.all([
        testBooleanResult(assert, undefined, null),
        testBooleanResult(assert, '', null),
        testBooleanResult(assert, 'foo', null)
    ]).then(done).catch(done);
});

function testBooleanResult(assert, value, expectId) {
    var expectCount = expectId ? 1 : 0;
    return itemtypes.filter({'is_active': value}).then(function(items) {
        assert.equal(
            items.length, expectCount,
            "is_active=" + value +
            " should return " + expectCount + " result(s)"
        );
        if (expectId) {
            assert.equal(
                items[0].id, expectId,
                "is_active=" + value +
                " should return itemtype '" + expectId + "'"
            );
        }
    });
}

QUnit.test("filter by boolean & non-boolean", function(assert) {
    var done = assert.async();
    Promise.all([
        itemtypes.filter({'is_active': 'true', 'id': '1'}),
        itemtypes.filter({'id': '1', 'is_active': 'true'})
    ]).then(function(results) {
        assert.equal(
            results[0].length, results[1].length,
            'key order should not affect filter result'
        );
    }).then(done).catch(done);
});

});
