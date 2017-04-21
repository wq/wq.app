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

});
