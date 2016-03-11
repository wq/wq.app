define(['wq/store', 'wq/model'], function(store, model) {

QUnit.module('wq/model');

var ds = store.getStore('model-test');
ds.init({
    'service': '/tests',
    'defaults': {
        'format': 'json'
    }
});
var items = model({'url': 'items', 'store': ds});

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

});
