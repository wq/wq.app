/*
 * wq.app 0.7.0-dev - owl.js
 * Client for the Offline Web Log service.
 * (c) 2014, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['wq/store', 'jquery', 'jquery.mobile'],
function(ds, $, jqm) {

// Module object is main logging function
function owl(action, data, path) {
    if (!owl.config.key)
        throw "Missing log key (hint: try owl.init)!";
    if (!action) {
        action = "view";
    }
    if (!path) {
        path = owl.getPath();
    }
    var post = {
        "path": path,
        "action": action,
        "client_date": Date.now() / 1000,
        "referer": document.referrer,
    }
    if (data) {
        post.data = JSON.stringify(data);
    }
    var queue = owl.ds.get(owl.config.key) || [];
    queue.push(post);
    owl.ds.set(owl.config.key, queue);
}

owl.config = {};
owl.ds = ds.getStore('owl');

// Initiallize configuration and set up event listeners
owl.init = function init(config) {
    owl.config = $.extend({
        'key': "" + Math.round(1e10 * Math.random()),
        'url': "/owl",
        'ping': 30,
        'sync': 1,
        'scroll': true,
        'async': true,
        'maxFailures': 5,
        'wait': 60
    }, config);
    owl("init");
    owl.syncAll();
    $('body').on('pagecontainershow', function() {
        owl("view");
    });
    Object.keys(owl.events).forEach(function(evt) {
        $(window).on(evt, function() {
            var data;
            if (owl.events[evt])
                data = owl.events[evt]();
            owl("event:" + evt, data);
        });
    });

    if (owl.config.sync) {
        owl._syncInterval = setInterval(owl.sync, owl.config.sync * 1000);
    }
    if (owl.config.ping) {
        owl._pingInterval = setInterval(function() {
            owl("ping");
        }, owl.config.ping * 1000);
    }
}

// Sync log to server (with logic to handle errors & prevent simultaneous sync)
var _syncing = {};
var _waiting = {};
owl.sync = function sync(key) {
    if (!key) {
        key = owl.config.key;
    }
    if (!key) {
        throw "Missing log key (hint: try owl.init)!";
    }
    if (!owl.config.url) {
        throw "Missing server URL (hint: try owl.init)!";
    }
    if (_syncing[key])
        return;
    _syncing[key] = true;
    var failkey = key + '-fail';
    var queue = owl.ds.get(key);
    if (queue && queue.length) {
        queue.forEach(function(d) {
            d.client_key = key
        });
        var failures = owl.ds.get(failkey) || 0;
        if (failures > owl.config.maxFailures) {
            _syncing[key] = false;
            if (!_waiting[key]) {
                _waiting[key] = setTimeout(function() {
                    owl.ds.set(failkey, 0);
                    _waiting[key] = false;
                }, owl.config.wait * 1000);
            }
            return;
        }
        $.ajax(owl.config.url, {
            'type': 'POST',
            'async': owl.config.async,
            'data': JSON.stringify(queue),
            'contentType': "application/json",
            'beforeSend': function(xhr) {
                var cookie = document.cookie.split(';');
                var csrftoken = null;
                cookie.forEach(function(c) {
                    var vals = c.trim().split('=');
                    if (vals[0].trim() == "csrftoken")
                        csrftoken = vals[1].trim();
                });
                if (!csrftoken)
                    return;
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            'success': function success() {
                _syncing[key] = false;
                owl.ds.set(key, null);
                owl.ds.set(failkey, 0);
            },
            'error': function error(jqxhr, text, err) {
                _syncing[key] = false;
                owl('sendfail', text + ' ' + err);
                failures++;
                owl.ds.set(failkey, failures);
            }
        });
    }
};

owl.syncAll = function() {
    owl.ds.keys().forEach(owl.sync);
}

// Log events
function _closing() {
    owl.config.async = false;
    return null;
}

owl.events = {
    'pagehide': _closing,
    'unload': _closing,
    'throttledresize': function() {
        var $win = $(window);
        return {
            'width': $win.width(),
            'height': $win.height()
        }
    },
    'scrollstop': function() {
        var $win = $(window);
        return {
            'top': $win.scrollTop(),
            'left': $win.scrollLeft()
        }
    }
}

// Utility to get the current URL path
owl.getPath = function getPath() {
    // $('.ui-page-active').data("url");
    var loc = window.location;
    return loc.pathname; // + loc.search
}

return owl;

});
