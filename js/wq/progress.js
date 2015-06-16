/*
 * wq.app 0.8.0 - wq/progress.js
 * Simple AJAX polling for HTML5 <progress> element
 * (c) 2014-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['./router', './json'], function(router, json) {

// Exported module variable
var progress = {
    'interval': 0.5 // Polling interval (in seconds)
};

// Internal setInterval ids
var _timers = {};
var _last = {};

// Optionally initialize wq/progress with a page path to auto start polling
progress.init = function(path, onComplete, onFail, onProgress) {
    router.addRoute(path, 's', _startProgress);
    router.addRoute(path, 'h', _stopProgress);
    progress.onComplete = onComplete;
    progress.onFail = onFail;
    progress.onProgress = onProgress;

    function _startProgress(match, ui, params, hash, evt, $page) {
        progress.start($page.find('progress'));
    }
    function _stopProgress(match, ui, params, hash, evt, $page) {
        progress.stop($page.find('progress'));
    }
};

// progress.start accepts a jQuery-wrapped progress element and looks for a
// data-wq-url attribute to poll (and an optional data-interval attribute)
progress.start = function($progress) {
    var url = $progress.data('wq-url');
    var interval = $progress.data('wq-interval') || progress.interval;
    if (!url || _timers[url]) {
        return;
    }
    _timers[url] = setInterval(
        progress.timer($progress, url),
        interval * 1000
    );
};

// progress.stop stops a timer started with progress.start
progress.stop = function($progress) {
    var url = $progress.data('wq-url');
    if (!url || !_timers[url]) {
        return;
    }
    clearInterval(_timers[url]);
};

// progress.complete/progress.fail stop a timer started with progress.start,
// with a hook for custom response
progress.complete = function($progress, data) {
    progress.stop($progress);
    if (progress.onComplete) {
        progress.onComplete($progress, data);
    }
};

progress.fail = function($progress, data) {
    progress.stop($progress);
    if (progress.onFail) {
        progress.onFail($progress, data);
    }
};

// progress.timer generates a function suitable for setInterval
// (with $progress and url bound to scope).
progress.timer = function($progress, url) {
    return function() {
        json.get(url).then(function(data) {
            var done = false;
            if (!data.total) {
                // Set to "intermediate" state
                $progress.attr('value', null);
                $progress.attr('max', null);

                // Fallback for old browsers
                $progress.html('Loading...');
            } else {
                // Set to progress level
                if (_last[url] && data.current < _last[url]) {
                    // Assume out-of order response; no update
                    /* jshint noempty: false */
                } else {
                    _last[url] = data.current;
                    $progress.attr('value', data.current);
                    $progress.attr('max', data.total);

                    // Fallback for old browsers
                    $progress.html(data.current / data.total * 100 + "%");
                }

                // Check for completion
                if (data.current == data.total || data.status == "SUCCESS") {
                    progress.complete($progress, data);
                    done = true;
                }
            }
            if (data.status == "FAILURE") {
                $progress.attr('value', 0);
                progress.fail($progress, data);
            } else if (!done && progress.onProgress) {
                progress.onProgress($progress, data);
            }
        });
    };
};

return progress;

});
