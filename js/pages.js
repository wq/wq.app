/* pages
 * Dynamically generate jQuery Mobile pages for specified URLs
 * (c) 2012 S. Andrew Sheppard
 */

define(['./lib/jquery', './lib/jquery.mobile', './router', './template'],
function($, jqm, router, tmpl) {

// Exported module object
var pages = {};

// Configuration
pages.init = function(baseurl, tmpl404) {
    // Define baseurl (without trailing slash) if it is not /
    if (baseurl)
        _base = baseurl;

    // Define tmpl404 if there is not a template named '404'
    if (tmpl404)
        _404 = tmpl404;
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

// Render page and inject it into DOM
pages.inject = function(path, template, context) {
    var html  = tmpl.render(template, context);
    var title = html.split(/<\/?title>/)[1];
    var body  = html.split(/<\/?body>/)[1];
    if (!body)
        throw "No content found in template!";
    var $page = $(body);
    var url   = _base + '/' + path;
    $page.attr("data-" + jqm.ns + "url", url);
    $page.attr("data-" + jqm.ns + "title", title);
    $oldpage = $(":jqmData(url='" + url + "')");
    if ($oldpage.length)
        $oldpage.replaceWith($page);
    else
        $page.appendTo(jqm.pageContainer);
    $page.page();
    return $page;
};

// Inject and display page
pages.go = function(path, template, context, ui) {
    var $page = pages.inject(path, template, context);
    var options = ui && ui.options || {};
    jqm.changePage($page, options);
};

// Simple 404 page helper
pages.notFound = function(url, ui) {
    var context  = {'url': url};
    pages.go(url, _404, context, ui);
};

var _base = "";
var _404  = "404";

return pages;

});
