/*
 * wq.app 0.7.4 - wq/console.js
 * Fallback for code using console.log
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
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
