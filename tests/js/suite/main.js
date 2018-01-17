define([
    './app',
    './model',
    './store',
    './map',
    './pandas',
    './outbox',
], function() {
    var tests = Array.prototype.slice.call(arguments);
    Promise.all(tests).then(function() {
        QUnit.start();
    });
});
