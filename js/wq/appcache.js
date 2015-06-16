/*
 * wq.app 0.8.0 - wq/appcache.js
 * Monitor HTML5 appcache events and trigger callback
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['./online', './console'],
function(ol, console) {

// Exported module object
var ac = {};

// Allow custom callback
ac.init = function(callback) {
    if (callback) {
        _callback = callback;
    }
};

// Allow manual trigger of update
ac.update = function() {
    _update();
};

// Messages (exported so they can be overridden)
ac.messages = {
    // Standard status types
    'uncached': "Offline mode is disabled.",
    'idle':     " ",

    // Standard status & event types
    'checking':    "Checking for updates...",
    'downloading': "Downloading application...",
    'updateready': "New version is ready!",
    'obsolete':    "Caching issue - contact vendor!",

    // Standard event types
    'noupdate':    "Software is up-to-date.",
    'progress':    "Downloading application...",
    'cached':      "Application ready for offline use.",
    'error':       "Error updating application!",

    // Additional (non-standard) statuses
    'nosupport':   "This browser does not appear to support offline mode.",
    'unknown':     "Unknown error!",
    'offline':     "Working offline."
};

// Internal variables and functions

// Actual application cache object
var _ac = window.applicationCache;

// Status types (returned in _ac.status)
var _stypes = {};
if (_ac) {
    _stypes[_ac.UNCACHED]    = 'uncached';
    _stypes[_ac.IDLE]        = 'idle';
    _stypes[_ac.CHECKING]    = 'checking';
    _stypes[_ac.DOWNLOADING] = 'downloading';
    _stypes[_ac.UPDATEREADY] = 'updateready';
    _stypes[_ac.OBSOLETE]    = 'obsolete';
}

// Event types
var _etypes = {
    'cached':      true,
    'checking':    true,
    'downloading': true,
    'error':       true,
    'noupdate':    true,
    'progress':    true,
    'obsolete':    true,
    'updateready': true
};

// Default callback (meant to be overridden)
function _callback(type, msg) {
    console.log(type + ' - ' + msg);
}

// Determine type from event or from _ac.status, then trigger callback
function _update(evt) {

    var type;
    if (evt && _etypes[evt.type]) {
        type = evt.type;
    } else if (!_ac) {
        type = 'nosupport';
    } else if (_stypes[_ac.status]) {
        type = _stypes[_ac.status];
    } else {
        type = 'unknown';
    }

    if ((type == 'idle' || type == 'error') && !ol.online) {
        type = 'offline';
    }

    var msg = ac.messages[type] ? ac.messages[type] : ac.messages.unknown;

    if (type == 'progress' && evt.loaded & evt.total) {
        msg += ' (' + evt.loaded + ' of ' + evt.total + ')';
    }

    _callback(type, msg);
}

// Initialization
if (_ac) {
    for (var type in _etypes) {
        _ac.addEventListener(type, _update, true);
    }
}


return ac;

});
