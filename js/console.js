/*
 * wq.app - console.js
 * Fallback for code using console.log
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(function() {

if (window.console)
    return window.console
else
    return {
        'log': function() {}
    };

});
