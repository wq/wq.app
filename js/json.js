/*
 * wq.app 0.4.1 - json.js
 * Simple wrapper around jQuery.ajax
 * (so projects can supply non-jQuery implementations if needed.)
 * (c) 2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery'], function($) {

var json = {};

json.get = function fetch(url, success, error) {
   $.ajax(url, {
       'dataType': 'json',
       'success': success,
       'error': error
   });
};

return json;

});
