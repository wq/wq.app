/*
 * wq.app 1.0.0rc2 - wq/spinner.js
 * Wrapper for jQuery Mobile's spinner
 * (c) 2012-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery.mobile'],
function(jqm) {

// Exported module object
var spin = {};

spin.start = function(msg, duration, opts) {
    if (!opts) {
        opts = {};
    }
    if (msg) {
        opts.text = msg;
        opts.textVisible = true;
    }
    jqm.loading('show', opts);

    if (duration) {
        setTimeout(spin.stop, duration * 1000);
    }
};

spin.stop = function() {
    jqm.loading('hide');
};

return spin;

});
