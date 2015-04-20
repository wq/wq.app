/*
 * wq.app 0.7.4 - wq/router.js
 * Simple wrapper for jQuery.mobile.Router
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(["jquery", "jquery.mobile.router"],
function($) {

// Exported module object
// (acts as a singleton Router object)
var router = {};

// Disable automatic page initialization to allow time for registering page
// show events that affect the first page.
// Use pages.jqmInit() or app.jqmInit() to trigger initialization.
$(document).on('mobileinit', function() {
    $.mobile.autoInitializePage = false;
});

// Mimics new Router()
router.init = function(routedefs, handlers, opts) {
    if (_router) {
        // Reconfigure existing router
        _router.conf = $.extend(_router.conf, opts);
        if (opts.defaultHandlerEvents) {
            // Mimic functionality in router constructor
            var events = opts.defaultHandlerEvents.split(",");
            $.each(events, function(i, evt) {
                var ename = _router.evtLookup[evt];
                _router.defaultHandlerEvents[ename] = evt;
            });
        }
    } else
        _conf = $.extend(_conf, opts);
    router.add(routedefs, handlers);
};

// Mimics Router.add()
router.add = function(routedefs, handlers) {
    if (_router)
        // After init, can directly add routes to Router
        _router.add(routedefs, handlers);
    else
        // Before init, need to collect routes in queue
        _pending.push({'r': routedefs, 'h': handlers});
};

// Mimics Router.getParams()
router.getParams = function(search) {
    if (!_router)
        throw "Router is not ready to getParams!";
    return _router.getParams(search);
};

// Internal variables
var _router;       // Actual Router object
var _pending = []; // queue of pending add() requests
var _conf = {'ajaxApp': true};

// Initialization
// Need to wait until mobileinit before initializing
// (since that's what jquery.mobile.router does)
$(document).bind('mobileinit', function() {
    _router = new $.mobile.Router(undefined, undefined, _conf);
    $.each(_pending, function(i, p) {
        _router.add(p.r, p.h);
    });
});

return router;

});
