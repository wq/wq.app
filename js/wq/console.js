/*
 * wq.app 1.0.0rc2 - wq/console.js
 * Fallback for code using console.log
 * (c) 2012-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(function() {

if (window.console) {
    return window.console;
} else {
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
