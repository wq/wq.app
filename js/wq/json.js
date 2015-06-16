/*
 * wq.app 0.8.0 - wq/json.js
 * Simple wrapper around jQuery.ajax & object functions
 * (so projects can supply non-jQuery implementations if needed.)
 * (c) 2013-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Promise */

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
