/*
 * wq.app 0.8.1-dev - wq/photos.js
 * Helpers for working with Cordova photo library
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Camera */
/* global alert */

define(['jquery', './template'], function($, tmpl) {

var photos = {};

photos.init = function() {
    tmpl.setDefault('image_url', function() {
        try {
            return this.body && _getUrl(this.body);
        } catch (e) {
            // Image will be blank, but at least template won't crash
        }
    });
};

photos.preview = function(imgid, file) {
    $('#'+imgid).attr('src', _getUrl(file));
};

function _getUrl(file) {
    var URL = window.URL || window.webkitURL;
    return URL && URL.createObjectURL(file);
}

photos.take = function(input, preview) {
    var options = $.extend({
        sourceType: Camera.PictureSourceType.CAMERA,
        correctOrientation: true,
        saveToPhotoAlbum: true
    }, _defaults);
    _start(options, input, preview);
};

photos.pick = function(input, preview) {
    var options = $.extend({
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM
    }, _defaults);
    _start(options, input, preview);
};

function _start(options, input, preview) {
    navigator.camera.getPicture(
        function(uri) {
            load(uri, input, preview);
        },
        function(msg) {
            error(msg);
        },
    options);
}

function load(uri, input, preview) {
    $('#' + preview).attr('src', uri);
    $('#' + input).val(uri);
}

function error(msg) {
    alert(msg);
}

var _defaults = {
    quality: 75,
    destinationType: 1 //Camera.DestinationType.FILE_URI
};

return photos;
});
