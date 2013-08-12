/*
 * wq.app 0.4.0 - online.js
 * Monitor network state.
 * (c) 2012-2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./console'],
function(console) {

// Exported module object
var ol = {
  'online': navigator.onLine,
  'messages': {
    'online':  "&#10003; Online",
    'offline': "&#10005; Offline"
  },
  'update': function() {
    _update();
  },
  'init': function(callback) {
    if (callback)
      _callback = callback;
  }
};

// Internal functions
var _last_type = null;
function _callback(type, msg) {
    if (type != _last_type)
        console.log(type + ' - ' + msg);
    _last_type = type;
}

function _update(evt) {
    ol.online = navigator.onLine;
    var type = ol.online ? "online"          : "offline";
    var msg  = ol.online ? "&#10003; Online" : "&#10005; Offline";
    _callback(type, msg);
}

// Initialization
if (document.addEventListener) {
    document.addEventListener('offline', _update, false);
    document.addEventListener('online',  _update, false);
} else if (document.attachEvent) {
    document.attachEvent('onoffline', _update);
    document.attachEvent('ononline',  _update);
}
window.setInterval(_update, 1000 * 10);

return ol;

});
