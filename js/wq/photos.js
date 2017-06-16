/*
 * wq.app 1.0.0rc2 - wq/photos.js
 * Helpers for working with Cordova photo library
 * (c) 2012-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Camera */

define(['jquery', 'jquery.mobile', 'localforage',
        './template', './store', './spinner'],
function($, jqm, localForage, tmpl, ds, spin) {

var LOCALFORAGE_PREFIX = '__lfsc__:blob~~local_forage_type~image/jpeg~';

var photos = {
    'name': "photos"
};

var _defaults = {
    quality: 75,
    destinationType: 0 //Camera.DestinationType.DATA_URL
};

photos.init = function() {
    tmpl.setDefault('image_url', function() {
        try {
            return this.body && _getUrl(this.body);
        } catch (e) {
            // Image will be blank, but at least template won't crash
        }
    });
};

photos.run = function($page) {
    $page.on('change', 'input[type=file]', photos.preview);
    $page.on('click', 'button[data-wq-action=take]', photos.take);
    $page.on('click', 'button[data-wq-action=pick]', photos.pick);
};

photos.preview = function(imgid, file) {
    if (typeof imgid !== 'string' && !file) {
        imgid = $(this).data('wq-preview');
        if (!imgid) {
            return;
        }
        file = this.files[0];
        if (!file) {
            return;
        }
    }
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
    _start.call(this, options, input, preview);
};

photos.pick = function(input, preview) {
    var options = $.extend({
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM
    }, _defaults);
    _start.call(this, options, input, preview);
};

function _start(options, input, preview) {
    if (typeof input !== 'string' && !preview) {
        input = $(this).data('wq-input');
        if (!input) {
            return;
        }
        preview = jqm.activePage.find('#' + input).data('wq-preview');
    }
    navigator.camera.getPicture(
        function(data) {
            load(data, input, preview);
        },
        function(msg) {
            error(msg);
        },
    options);
}

photos.base64toBlob = function(data) {
    return localForage.getSerializer().then(function(serializer) {
        return serializer.deserialize(LOCALFORAGE_PREFIX + data);
    });
};

photos.storeFile = function(name, type, blob, input) {
    // Save blob data for later retrieval
    var file = {
        'name': name,
        'type': type,
        'body': blob
    };
    return ds.set(name, file).then(function() {
        if (input) {
            $('#' + input).val(name);
        }
    });
};

function load(data, input, preview) {
    spin.start('Loading image...');
    photos.base64toBlob(data).then(function(blob) {
        var number = Math.round(Math.random() * 1e10);
        var name = $('#' + input).val() || ('photo' + number + '.jpg');
        photos.storeFile(name, 'image/jpeg', blob, input).then(function() {
            spin.stop();
            if (preview) {
                photos.preview(preview, blob);
            }
        });
    });
}

function error(msg) {
    spin.start("Error Loading Image: " + msg, 1.5, {
        "theme": jqm.pageLoadErrorMessageTheme,
        "textonly": true
    });
}

return photos;
});
