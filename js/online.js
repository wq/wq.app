/*
 * wq.app - online.js
 * Monitor network state.
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(function() {

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
function _callback(type, msg) {
    console.log(type + ' - ' + msg);
};

function _update(evt) {
    ol.online = navigator.onLine;
    var type = ol.online ? "online"          : "offline";
    var msg  = ol.online ? "&#10003; Online" : "&#10005; Offline";
    _callback(type, msg);
};

// Initialization
document.addEventListener('offline', _update, false);
document.addEventListener('online',  _update, false);
window.setInterval(_update, 1000 * 10);

return ol;

});
