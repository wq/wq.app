define([
    './app',
    './model',
    './store',
    './map',
], function() {
    var tests = Array.prototype.slice.call(arguments);
    Promise.all(tests).then(function() {
        QUnit.start();
    });
});
