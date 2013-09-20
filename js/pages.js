/*!
 * wq.app 0.4.1 - pages.js
 * Dynamically generate jQuery Mobile pages for specified URLs
 * (c) 2012-2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery', './lib/jquery.mobile', './router', './template'],
function($, jqm, router, tmpl) {

// Exported module object
var pages = {
    'slug': '([^/?#]+)'
};

// Configuration
pages.init = function(baseurl, opts) {
    // Define baseurl (without trailing slash) if it is not /
    if (baseurl)
        pages.info.base_url = baseurl;

    if (!opts)
        return;

    // Define tmpl404 if there is not a template named '404'
    if (opts.tmpl404)
        _404 = tmpl404;

    // Re-use rendered templates
    if (opts.injectOnce)
        _injectOnce = opts.injectOnce;
};

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
    if (!prevent) {
        prevent = function(match, ui, params) {
            // By default, always prevent default changePage behavior
            return true;
        };
    }
    var callback = function(match, ui, params, hash, evt, page) {
        var curpath = jqm.activePage && jqm.activePage.jqmData('url');
        if (typeof ui.toPage !== "string")
            return; // Capture URLs only, not completed pages
        if (curpath == match[0] || curpath + '#' + hash == match[0])
            return; // Avoid interfering with hash updates when popups open & close

        // Prevent default changePage behavior
        if (prevent(match, ui, params))
            evt.preventDefault();

        fn = (typeof fn == "string" ? obj[fn] : fn);
        fn(match, ui, params, hash, evt, page);
    };
    pages.addRoute(path, events, callback);
};

// Wrapper for router.add - adds URL base and parameter regex to path
pages.addRoute = function(path, events, fn, obj) {
    var rt = {};
    path = path.replace(/<slug>/g, pages.slug);
    var url = '^' +  pages.info.base_url + '/' + path + '(?:[?](.*))?(?:[#](.*))?$';
    var callback = function(etype, match, ui, page, evt) {
        hash = match.pop();
        params = router.getParams(match.pop());
        fn = (typeof fn == "string" ? obj[fn] : fn);
        fn(match, ui, params, hash, evt, page);
    };
    rt[url] = {
        'events': events,
        'handler': callback,
        'step': 'all'
    };
    router.add(rt);
};

// Render page and inject it into DOM (replace existing page if it exists)
pages.inject = function(path, template, context, pageid) {
    _updateInfo(path);
    var html  = tmpl.render(template, context);
    if (!html.match(/<div/))
        throw "No content found in template '" + template + "'!";
    var title = html.split(/<\/?title>/)[1];
    var body  = html.split(/<\/?body[^>?]*>/)[1];
    if (body)
        html = body;
    var $page = $(html.trim());
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
    } else if ($oldpage.length) {
        $oldpage.jqmData('title', title);
        if (pageid)
            $oldpage.jqmData('url', url);
        var $header     = $(":jqmData(role='header')",  $page).find("h1,h2,h3");
        var $oldheader  = $(":jqmData(role='header')",  $oldpage).find("h1,h2,h3");
        $oldheader.html($header.html());
        var $content    = $(":jqmData(role='content')", $page);
        var $oldcontent = $(":jqmData(role='content')", $oldpage);
        $oldcontent.html($content.html());
        $oldpage.trigger('create');
        $page = $oldpage;
    } else {
        $page.attr("data-" + jqm.ns + "url", url);
        $page.attr("data-" + jqm.ns + "title", title);
        if (pageid)
            $page.attr('id', pageid);
        $page.appendTo(jqm.pageContainer);
        $page.page();
    }
    return $page;
};

// Render template only once
pages.injectOnce = function(path, template, context, id) {
    if(!id)
        id = template + "-page";
    var $page = $('#' + id);
    if (!$page.length) {
        // Initial render, use context if available
        $page = pages.inject(path, template, context);
        $page.attr("id", id);
    } else {
        // Template was already rendered; ignore context but update URL
        // - it is up to the caller to update the DOM
        _updateInfo(path);
        $page.attr("data-" + jqm.ns + "url", pages.info.full_path);
        $page.jqmData("url", pages.info.full_path);
    }
    return $page;
};

// Inject and display page
pages.go = function(path, template, context, ui, once, pageid) {
    var $page, role, options;
    once = once || _injectOnce;
    if (once)
        // Only render the template once
        $page = pages.injectOnce(path, template, context, pageid);
    else
        // Default: render the template every time the page is loaded
        $page = pages.inject(path, template, context, pageid);

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
            if (ui.options.link && ui.options.link.jqmData('position-to'))
                options.positionTo = ui.options.link.jqmData('position-to');
            else
                options.positionTo = $page.jqmData('position-to');
            // Default of 'origin' won't work since we are opening the popup manually
            if (!options.positionTo || options.positionTo == 'origin')
                options.positionTo = ui.options.link[0];
            // Remove link highlight *after* popup is closed
            $page.bind('popupafterclose.resetlink', function() {
                ui.options.link.removeClass('ui-btn-active');
                $(this).unbind('popupafterclose.resetlink');
            });
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
    pages.go(url, _404, context, ui);
};

// Context variable (accessible in templates via pages_info)
pages.info = {
    'base_url': ""
};

function _updateInfo(path) {
    pages.info.prev_path = pages.info.path;
    pages.info.path = path;
    pages.info.full_path = pages.info.base_url + "/" + path;
    tmpl.setDefault('pages_info', pages.info);
}

var _404  = "404";
var _injectOnce = false;

return pages;

});
