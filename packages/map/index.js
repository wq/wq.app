/*!
 * wq.app 2.0.0-dev - wq/map.js
 * Leaflet integration for @wq/app pages
 * (c) 2013-2019, S. Andrew Sheppard
 * https://wq.io/license
 */

var map = require('./src/mapserv.js');
var locate = require('./src/locate.js');
map.locate = locate;
module.exports = map;
