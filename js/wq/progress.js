/*
 * wq.app 0.6.0-dev - progress.js
 * Simple AJAX polling for HTML5 <progress> element
 * (c) 2014, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./pages', './json'], function(pages, json) {

// Exported module variable
var progress = {
    'interval': 0.5 // Polling interval (in seconds)
};

// Internal setInterval ids
var _timers = {};
var _last = {};

// Optionally initialize wq/progress with a page path to auto start polling
progress.init = function(path, onComplete, onFail) {
    pages.addRoute(path, 's', _startProgress);
    pages.addRoute(path, 'h', _stopProgress);
    progress.onComplete = onComplete;
    progress.onFail = onFail;

    function _startProgress(match, ui, params, hash, evt, $page) {
        progress.start($page.find('progress'));
    }
    function _stopProgress(match, ui, params, hash, evt, $page) {
        progress.stop($page.find('progress'));
    }
};

// progress.start accepts a jQuery-wrapped progress element and looks for a
// data-url attribute to poll (and an optional data-interval attribute)
progress.start = function($progress) {
    var url = $progress.data('url');
    var interval = $progress.data('interval') || progress.interval;
    if (!url || _timers[url])
        return;
    _timers[url] = setInterval(
        progress.timer($progress, url),
        interval * 1000
    );
};

// progress.stop stops a timer started with progress.start
progress.stop = function($progress) {
    var url = $progress.data('url');
    if (!url || !_timers[url])
        return;
    clearInterval(_timers[url]);
};

// progress.complete/progress.fail stop a timer started with progress.start,
// with a hook for custom response
progress.complete = function($progress, data) {
    progress.stop($progress);
    if (progress.onComplete)
        progress.onComplete($progress, data);
};

progress.fail = function($progress, data) {
    progress.stop($progress);
    if (progress.onFail)
        progress.onFail($progress, data);
};

// progress.timer generates a function suitable for setInterval
// (with $progress and url bound to scope).
progress.timer = function($progress, url) {
    return function() {
        json.get(url, function(data) {
            if (!data.total) {
                // Set to "intermediate" state
                $progress.prop('total', null);
                $progress.prop('value', null);

                // Fallback for old browsers
                $progress.html('Loading...');
            } else {
                // Set to progress level
                if (_last[url] && data.current < _last[url]) {
                    // Assume out-of order response; no update
                    /* jshint noempty: false */
                } else {
                    _last[url] = data.current;
                    $progress.prop('value', data.current);
                    $progress.prop('max', data.total);

                    // Fallback for old browsers
                    $progress.html(data.current / data.total * 100 + "%");
                }

                // Check for completion
                if (data.current == data.total || data.status == "SUCCESS")
                    progress.complete($progress, data);
            }
            if (data.status == "FAILURE")
                progress.fail($progress, data);
        });
    };
};

return progress;

});
