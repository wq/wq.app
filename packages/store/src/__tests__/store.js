define(['wq/store'], function(ds) {

QUnit.module('wq/store');

QUnit.test("store should have init function", function(assert) {
    assert.ok(ds.init);
});

});
