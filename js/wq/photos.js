/*
 * wq.app 0.8.1-dev - wq/photos.js
 * Helpers for working with Cordova photo library
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Camera */

define(['jquery', './template', './store', './spinner'],
function($, tmpl, ds, spin) {

var LOCALFORAGE_PREFIX = '__lfsc__:blob~~local_forage_type~image/jpeg~';

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
        function(data) {
            load(data, input, preview);
        },
        function(msg) {
            error(msg);
        },
    options);
}

function load(data, input, preview) {
    spin.start('Loading image...');
    // localforageSerializer is defined by localstorage.js, but might not be
    // loaded already - so use async require.
    require(['localforageSerializer'], function(serializer) {
        var blob = serializer.deserialize(LOCALFORAGE_PREFIX + data);
        var number = Math.round(Math.random() * 1e10);
        var name = $('#' + input).val() || ('photo' + number + '.jpg');
        var file = {
            'name': name,
            'type': 'image/jpeg',
            'body': blob
        };
        ds.set(name, file).then(function() {
            $('#' + input).val(name);
            spin.stop();
            photos.preview(preview, blob);
        });
    });
}

function error(msg) {
    spin.start("Error Loading Image: " + msg, 1.5, {
        "theme": $.mobile.pageLoadErrorMessageTheme,
        "textonly": true
    });
}

var _defaults = {
    quality: 75,
    destinationType: 0 //Camera.DestinationType.DATA_URL
};

return photos;
});
