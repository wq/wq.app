/*!
 * wq.app 0.7.4 - wq/pages.js
 * Dynamically generate jQuery Mobile pages for specified URLs
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', 'jquery.mobile', './router', './template', './console'],
function($, jqm, router, tmpl, console) {

// Exported module object
var pages = {
    'config': {
        'tmpl404': "404",
        'injectOnce': false,
        'debug': false
    },
    'slug': '([^/?#]+)',
    'query': '(?:[?](.*))?(?:[#](.*))?$'
};

// Configuration
pages.init = function(baseurl, config) {
    // Define baseurl (without trailing slash) if it is not /
    if (baseurl)
        pages.info.base_url = baseurl;

    pages.config = $.extend(pages.config, config || {});

    // Configuration options:
    // Define `tmpl404` if there is not a template named '404'
    // Set `injectOnce`to true to re-use rendered templates
    // Set `debug` to true to log template & context information
};

pages.jqmInit = jqm.initializePage;

// Register URL patterns to override default JQM behavior and inject pages
// Callback fn should call pages.go() with desired template
pages.register = function(path, fn, obj, prevent) {
    var events = "bC";
    if (!fn) {
        fn = function(match, ui, params) {
            // Assume there is a template with the same name
            pages.go(path, path, params, ui);
        };
    }
    if (prevent === undefined) {
        prevent = function(match, ui, params) {
            /* jshint unused: false */
            // By default, prevent default changePage behavior 
            // (unless this is a form post and is not being handled by app.js)
            if (ui && ui.options && ui.options.data && ui.options.fromPage) {
                var $form = ui.options.fromPage.find('form');
                if ($form.data('json') !== undefined && !$form.data('json'))
                    return false;
            }
            return true;
        };
    }
    var callback = function(match, ui, params, hash, evt, $page) {
        var curpath = jqm.activePage && jqm.activePage.jqmData('url');

        // Capture URLs only, not completed pages
        if (typeof ui.toPage !== "string")
            return;
        
        // Don't handle urls that app.js specifically marked for server loading
        if (ui.options && ui.options.wqSkip)
            return;

        // Avoid interfering with hash updates when popups open & close
        if ((curpath == match[0] || curpath + '#' + hash == match[0]) &&
               !ui.options.allowSamePageTransition)
            return;
        
        // Prevent default changePage behavior?
        if (typeof prevent === 'function' && prevent(match, ui, params))
            evt.preventDefault();
        else if (typeof prevent !== 'function' && prevent)
            evt.preventDefault();

        fn = (typeof fn == "string" ? obj[fn] : fn);
        fn(match, ui, params, hash, evt, $page);
    };
    pages.addRoute(path, events, callback);
};

// Wrapper for router.add - adds URL base and parameter regex to path
pages.addRoute = function(path, events, fn, obj) {
    var rt = {};
    path = path.replace(/<slug>/g, pages.slug);
    var url = '^' +  pages.info.base_url + '/' + path + pages.query;
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
    router.add(rt);
};

// Render page and inject it into DOM (replace existing page if it exists)
function _inject(path, template, context, pageid) {
    _updateInfo(path);
    var html  = tmpl.render(template, context);
    if (!html.match(/<div/))
        throw "No content found in template '" + template + "'!";
    var title = html.split(/<\/?title>/)[1];
    var body  = html.split(/<\/?body[^>?]*>/)[1];
    if (body)
        html = body;
    var $page = $(html.trim());

    // Check for <div data-role=page>, in case it is not the only element in
    // the selection (due to an external footer or something)
    var $rolePage = $page.filter(":jqmData(role='page')");
    if ($rolePage.length > 0) {
        if (pages.config.debug && $rolePage.length != $page.length) {
            console.info(
                ($page.length - $rolePage.length) +
                " extra element(s) ignored."
            );
        }
        $page = $rolePage;
    }

    var role = $page.jqmData('role');
    var url   = pages.info.full_path;
    var $oldpage;
    if (pageid) {
        if (pageid === true)
            pageid = template + '-page';
        $oldpage = $('#' + pageid);
    } else {
        $oldpage = $(":jqmData(url='" + url + "')");
    }
    if (role == 'popup' || role == 'panel') {
        $page.appendTo(jqm.activePage[0]);
        if (role == 'popup')
            $page.popup();
        else
            $page.panel();
        $page.trigger('create');
    } else {
        if ($oldpage.length) {
            $oldpage.remove();
        }
        $page.attr("data-" + jqm.ns + "url", url);
        $page.attr("data-" + jqm.ns + "title", title);
        if (pageid)
            $page.attr('id', pageid);
        $page.appendTo(jqm.pageContainer);
        $page.page();
    }
    return $page;
}

// Render template only once
function _injectOnce(path, template, context, id) {
    if(!id)
        id = template + "-page";
    var $page = $('#' + id);
    if (!$page.length) {
        // Initial render, use context if available
        $page = _inject(path, template, context);
        $page.attr("id", id);
    } else {
        // Template was already rendered; ignore context but update URL
        // - it is up to the caller to update the DOM
        _updateInfo(path);
        $page.attr("data-" + jqm.ns + "url", pages.info.full_path);
        $page.jqmData("url", pages.info.full_path);
    }
    return $page;
}

// Inject and display page
pages.go = function(path, template, context, ui, once, pageid) {
    if (pages.config.debug) {
        console.log(
            "Rendering " + pages.info.base_url + '/' + path +
            " with template '" + template +
            "' and context:"
        );
        console.log(context);
        pages.info.context = context;
    }
    var $page, role, options;
    once = once || pages.config.injectOnce;
    if (once)
        // Only render the template once
        $page = _injectOnce(path, template, context, pageid);
    else
        // Default: render the template every time the page is loaded
        $page = _inject(path, template, context, pageid);

    role = $page.jqmData('role');
    if (role == 'page') {
        options = ui && ui.options || {};
        options._jqmrouter_bC = true;
        if (once || _injectOnce)
            options.allowSamePageTransition = true;
        jqm.changePage($page, options);
    } else if (role == 'popup') {
        options = {};
        if (ui && ui.options) {
            options.transition = ui.options.transition;
            options.positionTo = $page.jqmData('position-to');
            var link = ui.options.link;
            if (link) {
                if (link.jqmData('position-to'))
                    options.positionTo = link.jqmData('position-to');
                // 'origin' won't work since we're opening the popup manually
                if (!options.positionTo || options.positionTo == 'origin')
                    options.positionTo = link[0];
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
pages.notFound = function(url, ui) {
    var context  = {'url': url};
    pages.go(url, pages.config.tmpl404, context, ui);
};

// Context variable (accessible in templates via pages_info)
pages.info = {
    'base_url': ""
};

function _updateInfo(path) {
    pages.info.prev_path = pages.info.path;
    pages.info.path = path;
    pages.info.path_enc = escape(path);
    pages.info.full_path = pages.info.base_url + "/" + path;
    pages.info.full_path_enc = escape(pages.info.full_path);
    pages.info.params = router.getParams(path);
    tmpl.setDefault('pages_info', pages.info);
}

return pages;

});
