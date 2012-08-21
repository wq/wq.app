/*!
 * wq.app - pages.js
 * Dynamically generate jQuery Mobile pages for specified URLs
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery', './lib/jquery.mobile', './router', './template'],
function($, jqm, router, tmpl) {

// Exported module object
var pages = {};

// Configuration
pages.init = function(baseurl, opts) {
    // Define baseurl (without trailing slash) if it is not /
    if (baseurl)
        _base = baseurl;

    if (!opts)
        return;

    // Define tmpl404 if there is not a template named '404'
    if (opts.tmpl404)
        _404 = tmpl404;

    // Re-use rendered templates
    if (opts.injectOnce)
        _injectOnce = opts.injectOnce
};

// Register URL patterns to override default JQM behavior and inject pages
// Callback fn should call pages.go() with desired template
pages.register = function(path, fn, obj) {
    var events = "bC";
    if (!fn) {
        fn = function(match, ui, params) {
            // Assume there is a template with the same name
            pages.go(path, path, params, ui);
        }
    }
    var callback = function(etype, match, ui, page, evt) {
        if (typeof ui.toPage !== "string")
            return; // Capture URLs only, not completed pages
        if (jqm.activePage && ui.toPage == jqm.activePage.jqmData('url'))
            return; // Avoid interfering with hash updates when popups close

        // Prevent default changePage behavior
        evt.preventDefault();

        var params = router.getParams(match[match.length-1]);
        if (typeof fn === "string")
            obj[fn](match, ui, params);
        else
            fn(match, ui, params);
    };
    pages.addRoute(path, events, callback, obj);
};

// Wrapper for router.add - adds URL base and parameter regex to path
pages.addRoute = function(path, events, callback, obj) {
    var rt = {};
    var url = '^' +  _base + '/' + path + '(?:[?](.*))?$';
    rt[url] = {
        'events': events,
        'handler': typeof callback == "string" ? obj[callback] : callback
    }
    router.add(rt);
};

// Render page and inject it into DOM (replace existing page if it exists)
pages.inject = function(path, template, context) {
    var html  = tmpl.render(template, context);
    if (!html.match(/<div/))
        throw "No content found in template!";
    var title = html.split(/<\/?title>/)[1];
    var body  = html.split(/<\/?body>/)[1];
    var $page = $(body ? body : html);
    var url   = _base + '/' + path;
    var $oldpage = $(":jqmData(url='" + url + "')");
    if ($oldpage.length) {
        $oldpage.jqmData('title', title);
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
        var role = $page.jqmData('role');
        if (role == 'page') {
          $page.appendTo(jqm.pageContainer);
          $page.page();
        } else if (role == 'popup') {
          $page.appendTo(jqm.activePage);
          $page.popup();
        }
    }
    return $page;
};

// Render template only once
pages.injectOnce = function(path, template, context) {
    var id = template + "-page";
    var $page = $('#' + id);
    if ($page.length == 0) {
        // Initial render, use context if available
        $page = pages.inject(path, template, context);
        $page.attr("id", id);
    } else {
        // Template was already rendered; ignore context but update URL
        // - it is up to the caller to update the DOM
        $page.attr("data-" + jqm.ns + "url", _base + '/' + path);
        $page.jqmData("url", _base + '/' + path);
    }
    return $page;
}

// Inject and display page
pages.go = function(path, template, context, ui, once) {
    var $page;
    once = once || _injectOnce;
    if (once)
        // Only render the template once
        $page = pages.injectOnce(path, template, context);
    else
        // Default: render the template every time the page is loaded
        $page = pages.inject(path, template, context);

    var role = $page.jqmData('role');
    if (role == 'page') {
        var options = ui && ui.options || {};
        if (once || _injectOnce)
            options.allowSamePageTransition = true;
        jqm.changePage($page, options);
    } else if (role == 'popup') {
        var options = {};
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
    }
    return $page;
};

// Simple 404 page helper
pages.notFound = function(url, ui) {
    var context  = {'url': url};
    pages.go(url, _404, context, ui);
};

var _base = "";
var _404  = "404";
var _injectOnce = false;

return pages;

});
