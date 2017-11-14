'use strict';

define('test1', {
    'test': 1
});

define('test2', [], function () {
    return "two";
});

define('test', ['test1', 'test2'], function () {
    var _arguments = Array.prototype.slice.call(arguments),
        test1 = _arguments[0],
        test2 = _arguments[1];

    console.log(test1);
    console.log(test2);
});