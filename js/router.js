/*
 * wq.app - router.js
 * Simple wrapper for jQuery.mobile.Router
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(["./lib/jquery", "./lib/jquery.mobile.router"],
function($) {

// Exported module object
// (acts as a singleton Router object)
var router = {};

// Mimics Router.add()
router.add = function(routedefs, handlers) {
   if (_router)
      // After init, can directly add routes to Router
      _router.add(routedefs, handlers);
   else
      // Before init, need to collect routes in queue
      _pending.push({'r': routedefs, 'h': handlers});
}

// Mimics Router.getParams()
router.getParams = function(search) {
   if (!_router)
       throw "Router is not ready to getParams!";
   return _router.getParams(search);
}

// Internal variables
var _router;       // Actual Router object 
var _pending = []; // queue of pending add() requests

// Initialization
// Need to wait until mobileinit before initializing
// (since that's what jquery.mobile.router does)
$(document).live('mobileinit', function() {
    _router = new $.mobile.Router(undefined, undefined, {'ajaxApp': true});
    $.each(_pending, function(i, p) {
        _router.add(p.r, p.h);
    });
});

return router;

});
