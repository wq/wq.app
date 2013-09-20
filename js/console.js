/*
 * wq.app 0.4.1 - console.js
 * Fallback for code using console.log
 * (c) 2012-2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(function() {

if (window.console)
    return window.console;
else {
    var fn = function() {};
    return {
        'log':   fn,
        'debug': fn,
        'info':  fn,
        'warn':  fn,
        'error': fn
    };
}
});
