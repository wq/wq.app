/*
 * wq.app 0.7.4 - wq/photos.js
 * Helpers for working with Cordova photo library
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Camera */
/* global alert */

define(['jquery'], function($) {

var photos = {};

photos.preview = function(imgid, file, fallback) {
    if (window.FileReader) {
        var reader = new FileReader();
        reader.onload = function(evt) {
            $('#'+imgid).attr('src', evt.target.result);
        };
        reader.readAsDataURL(file);
    } else if (fallback) {
        $('#'+imgid).attr('src', fallback);
    }
};


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
