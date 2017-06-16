/*
 * wq.app 1.0.0rc2 - wq/json.js
 * Simple wrapper around jQuery.ajax & object functions
 * (so projects can supply non-jQuery implementations if needed.)
 * (c) 2013-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', 'localforage'], function($) {

var json = {};

json.extend = $.extend;

json.param = $.param;

json.isArray = $.isArray;

json.get = function(url, params, jsonp) {
    return Promise.resolve($.ajax(url, {
        'data': params,
//        'cache': false,
        'dataType': jsonp ? "jsonp" : "json"
    }));
};

return json;

});
