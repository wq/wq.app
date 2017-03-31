/*!
 * wq.app 1.0.0-dev - wq/router.js
 * Respond to URL changes with locally generated pages and custom events
 * (c) 2012-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global escape */

define(['jquery', 'jquery.mobile', 'jquery.mobile.router',
        './template', './console'],
function($, jqm, jqmr, tmpl, console) {

// Exported module object
var router = {
    'config': {
        'tmpl404': "404",
        'injectOnce': false,
        'debug': false
    },
    'slug': '([^/?#]+)',
    'query': '(?:[?](.*))?(?:[#](.*))?$'
};
var _jqmRouter;

// Configuration
router.init = function(config) {
    // Define baseurl (without trailing slash) if it is not /
    if (typeof config == "string" || arguments.length > 1) {
        throw "router.init() now takes a single configuration argument";
    }
    if (config && config.base_url) {
        router.info.base_url = config.base_url;
    }

    router.config = $.extend(router.config, config || {});

    // Configuration options:
    // Define `tmpl404` if there is not a template named '404'
    // Set `injectOnce`to true to re-use rendered templates
    // Set `debug` to true to log template & context information

    _jqmRouter = new jqm.Router(undefined, undefined, {
        'ajaxApp': true
    });
};

router.jqmInit = jqm.initializePage;

// Register URL patterns to override default JQM behavior and inject router
// Callback fn should call router.go() with desired template
router.register = function(path, fn, obj, prevent) {
    var events = "bC";
    if (!fn) {
        fn = function(match, ui, params) {
            // Assume there is a template with the same name
            router.go(path, path, params, ui);
        };
    }
    if (prevent === undefined) {
        prevent = function(match, ui, params) {
            /* jshint unused: false */
            // By default, prevent default changePage behavior
            // (unless this is a form post and is not being handled by app.js)
            if (ui && ui.options && ui.options.data && ui.options.fromPage) {
                var $form = ui.options.fromPage.find('form');
                var dataJson = $form.data('wq-json');
                if (dataJson !== undefined && !dataJson) {
                    return false;
                }
            }
            return true;
        };
    }
    var callback = function(match, ui, params, hash, evt, $page) {
        var curpath = jqm.activePage && jqm.activePage.jqmData('url');

        // Capture URLs only, not completed pages
        if (typeof ui.toPage !== "string") {
            return;
        }

        // Don't handle urls that app.js specifically marked for server loading
        if (ui.options && ui.options.wqSkip) {
            return;
        }

        // Avoid interfering with hash updates when popups open & close
        if ((curpath == match[0] || curpath + '#' + hash == match[0]) &&
               !ui.options.allowSamePageTransition) {
            return;
        }

        // Prevent default changePage behavior?
        if (typeof prevent === 'function' && prevent(match, ui, params)) {
            evt.preventDefault();
        } else if (typeof prevent !== 'function' && prevent) {
            evt.preventDefault();
        }

        fn = (typeof fn == "string" ? obj[fn] : fn);
        fn(match, ui, params, hash, evt, $page);
    };
    router.addRoute(path, events, callback);
};

// Wrapper for router.add - adds URL base and parameter regex to path
router.addRoute = function(path, events, fn, obj) {
    var rt = {};
    path = path.replace(/<slug>/g, router.slug);
    var url = '^' +  router.info.base_url + '/' + path + router.query;
    var callback = function(etype, match, ui, page, evt) {
        var hash = match.pop();
        var params = router.getParams(match.pop());
        fn = (typeof fn == "string" ? obj[fn] : fn);
        fn(match, ui, params, hash, evt, $(page));
    };
    rt[url] = {
        'events': events,
        'handler': callback,
        'step': 'all'
    };
    _jqmRouter.add(rt);
};

// Update router path
router.setPath = _updateInfo;

// Inject and display page
router.go = function(path, template, context, ui, once, pageid) {
    _updateInfo(path, context);
    var url = router.info.full_path;
    if (router.config.debug) {
        console.log(
            "Rendering " + url +
            " with template '" + template +
            "' and context:"
        );
        console.log(context);
    }
    var $page, role, options;
    once = once || router.config.injectOnce;
    if (once) {
        // Only render the template once
        $page = tmpl.injectOnce(template, context, url, pageid);
    } else {
        // Default: render the template every time the page is loaded
        $page = tmpl.inject(template, context, url, pageid);
    }

    role = $page.jqmData('role');
    if (role == 'page') {
        options = ui && ui.options || {};
        options._jqmrouter_bC = true;
        if (once) {
            options.allowSamePageTransition = true;
        }
        jqm.changePage($page, options);
    } else if (role == 'popup') {
        options = {};
        if (ui && ui.options) {
            options.transition = ui.options.transition;
            options.positionTo = $page.data('wq-position-to');
            var link = ui.options.link;
            if (link) {
                if (link.jqmData('position-to')) {
                    options.positionTo = link.jqmData('position-to');
                }
                // 'origin' won't work since we're opening the popup manually
                if (!options.positionTo || options.positionTo == 'origin') {
                    options.positionTo = link[0];
                }
                // Remove link highlight *after* popup is closed
                $page.bind('popupafterclose.resetlink', function() {
                    link.removeClass('ui-btn-active');
                    $(this).unbind('popupafterclose.resetlink');
                });
            }
        }
        $page.popup('open', options);
    } else if (role == 'panel') {
        $page.panel('open');
    }
    return $page;
};

// Simple 404 page helper
router.notFound = function(url, ui) {
    var context  = {'url': url};
    router.go(url, router.config.tmpl404, context, ui);
};

// Mimics Router.getParams()
router.getParams = function(search) {
    return _jqmRouter.getParams(search);
};

// Context variable (accessible in templates via router_info)
router.info = {
    'base_url': ""
};

function _updateInfo(path, context) {
    router.info.prev_path = router.info.path;
    router.info.path = path;
    router.info.path_enc = escape(path);
    router.info.full_path = router.info.base_url + "/" + path;
    router.info.full_path_enc = escape(router.info.full_path);
    router.info.params = router.getParams(path.split('?')[1]);
    if (context) {
        router.info.context = context;
    }
    tmpl.setDefault('router_info', router.info);
    tmpl.setDefault('rt', router.info.base_url);
}

return router;

});
