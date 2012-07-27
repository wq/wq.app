/* pages
 * Dynamically generate jQuery Mobile pages for specified URLs
 * (c) 2012 S. Andrew Sheppard
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
        fn = function() {
            // Assume there is a template with the same name
            pages.go(path, path);
        }
    }
    var callback = function(etype, match, ui, page, evt) {
        if (typeof ui.toPage !== "string")
            return; // Capture URLs only, not completed pages

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
    var title = html.split(/<\/?title>/)[1];
    var body  = html.split(/<\/?body>/)[1];
    if (!body)
        throw "No content found in template!";
    var $page = $(body);
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
        $page.appendTo(jqm.pageContainer);
        $page.page();
    }
    return $page;
};

// Render template only once
pages.injectOnce = function(path, template, context) {
    var $page = $('#' + template);
    if ($page.length == 0) {
        // Initial render, use context if available
        $page = pages.inject(path, template, context);
        $page.attr("id", template);
    } else {
        // Template was already rendered; ignore context but update URL
        // - it is up to the caller to update the DOM
        $page.attr("data-" + jqm.ns + "url", _base + '/' + path);
        $page.jqmData("url", _base + '/' + path);
    }
    return $page;
}

// Inject and display page
pages.go = function(path, template, context, ui) {
    var $page;
    var options = ui && ui.options || {};
    if (_injectOnce) {
        // Only render the template once
        $page = pages.injectOnce(path, template, context);
        options.allowSamePageTransition = true;
    } else {
        // Default: render the template every time the page is loaded
        $page = pages.inject(path, template, context);
    }
    jqm.changePage($page, options);
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
