/*!
 * wq.app - locate.js
 * Geolocation utilities via Leaflet's Map.locate
 * (c) 2013 S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/leaflet', './spinner'], 
function(L, spin) {

// Exported module object
var locate = {};

// Use an existing map if available
var _map;
locate.init = function(map) {
    _map = map;
}

// Simple geolocation function
locate.locate = function(success, error, high) {
    var map = _map || L.map(L.DomUtil.create('div'));
    var opts = {}; 

    // If no success callback, assume setView
    if (!success) {
        success = function(){};
        if (!error) error = success;
        opts['setView'] = true;
    }
    if (high) {
        opts['enableHighAccuracy'] = true;
        opts['timeout'] = 60 * 1000;
    }

    map.off('locationfound');
    map.off('locationerror');
    map.on('locationfound', go(success));
    map.on('locationerror', go(error));

    spin.start();
    map.locate(opts)
    function go(fn) {
        return function(evt) {
            spin.stop();
            fn(evt);
        }
    }
}

return locate;

});
