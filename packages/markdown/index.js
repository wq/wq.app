/*!
 * wq.app 2.0.0-dev - wq/map.js
 * Markdown and syntax highlighting for @wq/app
 * (c) 2013-2019, S. Andrew Sheppard
 * https://wq.io/license
 */

var map = require('./src/mapserv.js');
var locate = require('./src/locate.js');
map.locate = locate;
module.exports = map;
