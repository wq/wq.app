/*!
 * wq.app - app.js
 * Utilizes store and pages to dynamically load and render
 * content from a wq.db-compatible REST service
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery', './lib/jquery.mobile',
        './store', './pages', './template', './spinner',
        './lib/es5-shim'],
function($, jqm, ds, pages, tmpl, spin) {

var app = {};

app.init = function(config, templates, svc) {
    if (svc === undefined)
       svc = '';
    app.config = app.default_config = config;
    app['native'] = !!window.cordova;
    app.can_login = !!config.pages.login;
    ds.init(svc, {'format':'json'}, {'applyResult': _applyResult});
    pages.init();
    tmpl.init(templates, templates.partials, config.defaults);
    tmpl.setDefault('native', app['native']);

    if (app.can_login) {
        var user = ds.get('user');
        var csrftoken = ds.get('csrftoken');
        if (user) {
            app.user = user;
            tmpl.setDefault('user', user);
            tmpl.setDefault('is_authenticated', true);
            tmpl.setDefault('csrftoken', csrftoken);
            app.config = ds.get({'url': 'config'});
            $('body').trigger('login');
        }
        app.check_login();
        pages.register('logout\/?', app.logout);
    }

    if (config.transitions) {
        var def = "default";
        if (config.transitions[def])
            jqm.defaultPageTransition = config.transitions[def];
        if (config.transitions.dialog)
            jqm.defaultDialogTransition = config.transitions.dialog;
        if (config.transitions.save)
            _saveTransition = config.transitions.save;
        jqm.maxTransitionWidth = config.transitions.maxwidth || 800;
    }
    
    for (var page in app.config.pages) {
        var conf = _getConf(page);
        if (conf.list) {
            _registerList(page);
            _registerDetail(page);
            _registerEdit(page);
        } else if (conf) {
            _registerOther(page);
        }
    }

    $(document).on('submit', 'form', _handleForm);
}

app.logout = function() {
    if (!app.can_login)
        return;
    delete app.user;
    ds.set('user', null);
    tmpl.setDefault('user', null);
    tmpl.setDefault('is_authenticated', false);
    tmpl.setDefault('csrftoken', null);
    app.config = app.default_config;
    ds.fetch({'url': 'logout'}, true, undefined, true);
    $('body').trigger('logout');
};

app.save_login = function(result) {
    var config = result.config,
        user = result.user,
        csrftoken = result.csrftoken;
    if (!app.can_login)
        return;
    app.config = config;
    ds.set({'url': 'config'}, config);
    app.user = user;
    tmpl.setDefault('user', user);
    tmpl.setDefault('is_authenticated', true);
    tmpl.setDefault('csrftoken', csrftoken);
    ds.set('user', user);
    ds.set('csrftoken', csrftoken);
    $('body').trigger('login');
};

app.check_login = function() {
    if (!app.can_login)
        return;
    ds.fetch({'url': 'login'}, true, function(result) {
        if (result && result.user && result.config) {
            app.save_login(result);
        } else if (result && app.user) {
            app.logout();
        }
    }, true);
};

// Internal variables and functions
var _saveTransition = "none";

// Wrappers for pages.register & pages.go to handle common use cases

// Determine appropriate context & template for pages.go
app.go = function(page, ui, params, itemid, edit, url) {
    if (ui && ui.options && ui.options.data) return; // Ignore form actions
    var conf = _getConf(page);
    if (!conf.list) {
        _renderOther(page, ui, params);
        return;
    }
    ds.getList({'url': conf.url}, function(list) {
        if (itemid) {
            if (edit)
                _renderEdit(page, list, ui, params, itemid, url);
            else
                _renderDetail(page, list, ui, params, itemid, url);
        } else {
            _renderList(page, list, ui, params, url);
        }
    });
}

app.getAnnotationTypeFilter = function(page, obj) {
    return {'for': page};
};

// Generate list view context and render with [url]_list template;
// handles requests for [url] and [url]/
function _registerList(page) {
    var conf = _getConf(page);
    pages.register(conf.url, go);
    pages.register(conf.url + '/', go);
    function go(match, ui, params) {
        app.go(page, ui, params);
    }
}
function _renderList(page, list, ui, params, url) {
    var conf = _getConf(page);
    var pnum = 1, next = null, prev = null, filter;
    if (url === undefined) {
        url = conf.url;
        if (url)
            url += '/';
    }
    if (params) {
        url += "?" + $.param(params);
        if (params['page']) {
            pnum = params['page'];
        } else {
            filter = {};
            for (var key in params) {
                filter[key] = params[key];
            }
            conf.parents.forEach(function(p) {
                if (p == page + 'type')
                     p = 'type';
                if (filter[p]) {
                    filter[p + '_id'] = filter[p];
                    delete filter[p];
                }
            });
        }
    }

    if (pnum > conf.max_local_pages) { 
        // Set max_local_pages to avoid filling up local storage and
        // instead attempt to load HTML directly from the server
        // (using built-in jQM loader)
        var jqmurl = '/' + url;
        spin.start();
        jqm.loadPage(jqmurl).then(function() {
            spin.stop();
            $page = $(":jqmData(url='" + jqmurl + "')");
            if ($page.length > 0)
                jqm.changePage($page);
            else
                pages.notFound(url);
        });
        return;
    }

    var data = filter ? list.filter(filter) : list.page(pnum);

    if (pnum > 1) {
        var prevp = {'page': parseInt(pnum) - 1};
        prev = conf.url + '/?' + $.param(prevp);
    }

    if (pnum < data.info.pages) {
        var nextp = {'page': parseInt(pnum) + 1};
        next = conf.url + '/?' + $.param(nextp);
    }

    var context = {
        'list':     data,
        'page':     pnum,
        'pages':    data.info.pages,
        'per_page': data.info.per_page,
        'total':    data.info.total,
        'previous': prev ? '/' + prev : null,
        'next':     next ? '/' + next : null,
        'multiple': data.info.pages > 1
    };
    _addLookups(page, context, false, function(context) {
        pages.go(url, page + '_list', context, ui);
    });
}

// Generate item detail view context and render with [url]_detail template;
// handles requests for [url]/[id]
function _registerDetail(page) {
    var conf = _getConf(page);
    pages.register(conf.url + '/([^/\?]+)', function(match, ui, params) {
        if (match[1] == 'new')
            return;
        app.go(page, ui, params, match[1]);
    });
}
function _renderDetail(page, list, ui, params, itemid, url) {
    var conf = _getConf(page);
    if (url === undefined)
        url = conf.url + '/' + itemid;
    var item = list.find(itemid);
    if (!item) {
        // Item not found in stored list...
        if (!conf.partial) {
            // If partial is not set, locally stored list is assumed to 
            // contain the entire dataset, so the item probably does not exist.
            pages.notFound(url);
        } else {
            // Set partial to indicate local list does not represent entire 
            // dataset; if an item is not found will attempt to load HTML 
            // directly from the server (using built-in jQM loader)
            var jqmurl = '/' + url;
            spin.start();
            jqm.loadPage(jqmurl).then(function() {
                spin.stop();
                $page = $(":jqmData(url='" + jqmurl + "')");
                if ($page.length > 0)
                    jqm.changePage($page);
                else
                    pages.notFound(url);
            });
        }
        return;
    }
    var context = $.extend({}, item);
    _addLookups(page, context, false, function(context) {
        pages.go(url, page + '_detail', context, ui);
    });
}

// Generate item edit context and render with [url]_edit template;
// handles requests for [url]/[id]/edit and [url]/new
function _registerEdit(page) {
    var conf = _getConf(page);
    pages.register(conf.url + '/([^/]+)/edit', go);
    pages.register(conf.url + '/(new)', go);
    function go(match, ui, params) {
        app.go(page, ui, params, match[1], true);
    }
}
function _renderEdit(page, list, ui, params, itemid, url) {
    var conf = _getConf(page);
    if (itemid != "new") {
        // Edit existing item
        if (url === undefined)
            url = itemid + '/edit';
        var item = list.find(itemid);
        if (!item) {
            pages.notFound(url);
            return;
        }
        var context = $.extend({}, item);
        _addLookups(page, context, true, done);
    } else {
        // Create new item
        var context = $.extend({}, params); //FIXME: defaults
        if (url === undefined) {
            url = 'new';
            if (params && $.param(params))
                url += '?' + $.param(params);
        }
        _addLookups(page, context, true, function(context) {
            if (!conf.annotated) {
                done(context);
                return;
            }

            context['annotations'] = [];
            ds.getList({'url': 'annotationtypes'}, function(list) {
                var types = list.filter(app.getAnnotationTypeFilter(page, context));
                $.each(types, function(i, t) {
                    context['annotations'].push({'annotationtype_id': t.id});
                });
                done(context);
            });
        });
    }
    function done(context) {
        var divid = page + '_' + itemid + '-page';
        pages.go(conf.url + '/' + url, page + '_edit', context, ui, false, divid);
    }
}

// Render non-list pages with with [url] template;
// handles requests for [url] and [url]/
function _registerOther(page) {
    var conf = _getConf(page);
    pages.register(conf.url, go);
    pages.register(conf.url + '/', go);
    function go(match, ui, params) {
        app.go(page, ui, params);
    }
}

function _renderOther(page, ui, params, url) {
    var conf = _getConf(page);
    if (url === undefined)
        url = conf.url;
    pages.go(url, page, params, ui, conf.once ? true : false);
}

// Handle form submit from [url]_edit views
function _handleForm(evt) {
    var $form = $(this);
    var url = $form.attr('action').substring(1);
    var conf = _getConfByUrl(url);

    var vals = {};
    var $files = $form.find('input[type=file]');
    var has_files = ($files.length > 0 && $files.val().length > 0);
    if (!app['native'] && has_files) {
        // Files present and we're not running in Cordova.
        if (window.FormData && window.Blob)
            // Modern browser; use FormData to upload files via AJAX.
            // FIXME: localStorage version of outbox item will be unusable.  
            // Can we serialize this object somehow?
            vals.data = new FormData(this);
        else
            // Looks like we're in a an old browser and we can't upload files
            // via AJAX or Cordova...  Bypass store and assume server is
            // configured to accept regular form posts.
            return; 
    } else {
        // No files, or we're running in Cordova.
        // Use a simple dictionary for values, which is better for outbox
        // serialization.  store will automatically use Cordova FileUpload iff
        // there is a form field named 'fileupload'.
	$.each($form.serializeArray(), function(i, v) {
	    vals[v.name] = v.value;
	});
    }
    // Skip regular form submission, we're saving this via store
    evt.preventDefault();
    
    vals.url = url;
    if (url == conf.url + "/" || !conf.list)
        vals.method = "POST"; // REST API uses POST for new records
    else
        vals.method = "PUT";  // .. but PUT to update existing records
    $('.error').html('');
    spin.start();
    ds.save(vals, undefined, function(item) {
        spin.stop();
        if (item && item.saved) {
            // Save was successful
            var options = {'reverse': true, 'transition': _saveTransition};
            if (conf.list)
                jqm.changePage('/' + conf.url + '/' + item.newid, options);
            else
                jqm.changePage('/' + conf.url + '/', options);
            return;
        }

        if (!item || !item.error) {
            // Save failed for some unknown reason
            showError("Error saving data.");
            return;
        }

        // REST API provided general error information
        if (typeof(item.error) === 'string') {
            showError(item.error);
            return;
        }

        // REST API provided per-field error information
        for (f in item.error) {
            // FIXME: there may be multiple errors per field
            var err = item.error[f][0];
            if (f == 'non_field_errors')
                showError(err);
            else
                showError(err, f);
        }
        if (!item.error.non_field_errors)
            showError('One or more errors were found.');

        function showError(err, field) {
            var sel = '.' + conf.page + '-' + (field ? field + '-' : '') + 'errors';
            $form.find(sel).html(err);
        }
    });
}

// Successful results from REST API contain the newly saved object
function _applyResult(item, result) {
    if (result && result.id) {
        var conf = _getConfByUrl(item.data.url);
        item.saved = true;
        item.newid = result.id;
        ds.getList({'url': conf.url}, function(list) {
            var res = $.extend({}, result);
            if (conf.annotated && res.annotations)
                delete res.annotations;
            list.update([res], 'id', conf.reversed);
        });
        if (conf.annotated && result.annotations) {
            var annots = result.annotations;
            annots.forEach(function(a) {
                a[conf.page + '_id'] = result.id;
            });
            ds.getList({'url': 'annotations'}, function(list) {
                list.update(annots, 'id');
            });
        }
    } else if (app.can_login && result && result.user && result.config) {
        app.save_login(result);
        pages.go("login", "login");
    }
}

// Add various callback functions to context object to automate foreign key 
// lookups within templates
function _addLookups(page, context, editable, callback) {
    var conf = _getConf(page);
    var lookups = {};
    $.each(conf.parents, function(i, v) {
        var pconf = _getConf(v);
        lookups[v] = _parent_lookup(v)
        if (editable) {
            lookups[pconf.url]   = _parent_dropdown_lookup(v);
            lookups[v + '_list'] = _parent_dropdown_lookup(v);
        }
    });
    $.each(conf.children, function(i, v) {
        var cconf = _getConf(v);
        lookups[cconf.url] = _children_lookup(page, v)
    });
    if (conf.annotated) {
        lookups['annotations']    = _annotation_lookup(page);
        lookups['annotationtype'] = _parent_lookup('annotationtype');
    }
    if (conf.related) {
        lookups['relationships']        = _relationship_lookup(page);
        lookups['inverserelationships'] = _relationship_lookup(page, true);
        lookups['relationshiptype']     = _parent_lookup('relationshiptype');
    }
    var queue = [];
    for (key in lookups)
        queue.push(key);

    step();
    function step() {
        if (queue.length == 0) {
            callback(context);
            return;
        }
        var key = queue.shift();
        lookups[key](context, key, step);
    }
}

function _make_lookup(page, fn) {
    return function(context, key, callback) {
        var conf = _getConf(page);
        ds.getList({'url': conf.url}, function(list) {
            context[key] = fn(list);
            callback(context);
        });
    }
}

// Simple foreign key lookup
function _parent_lookup(page) {
    return _make_lookup(page, function(list) {
        return function() {
            return list.find(this[page + '_id']);
        }
    });
}

// List of all potential foreign key values (useful for generating dropdowns)
function _parent_dropdown_lookup(page) {
    return _make_lookup(page, function(list) {
        return function() {
            var obj = this;
            var parents = [];
            list.forEach(function(v) {
                var item = $.extend({}, v);
                if (item.id == obj[page + '_id'])
                    item.selected = true; // Currently selected item
                parents.push(item);
            });
            return parents;
        }; 
    });
}

// List of objects with a foreign key pointing to this one
function _children_lookup(ppage, cpage) {
    return _make_lookup(cpage, function(list) {
        return function() {
            var filter = {};
            filter[ppage + '_id'] = this.id;
            return list.filter(filter);
        }
    });
}

// List of annotations for this object
// (like _children_lookup but with a dropdown helper)
function _annotation_lookup(page) {
    return _make_lookup('annotation', function(list) {
        return function() {
            var filter = {};
            filter[page + '_id'] = this.id;
            var annots = [];
            list.filter(filter).forEach(function(v) {
                var item = $.extend({}, v);
                item.selected = function(){return this == item.value};
                annots.push(item);
            });
            return annots;
        }
    });
}

// List of relationships for this object
// (grouped by type)
function _relationship_lookup(page, inverse) {
    var name = inverse ? 'inverserelationship' : 'relationship';
    return _make_lookup(name, function(list) {
        return function() {
            var filter = {}, groups = {};
            filter[page + '_id'] = this.id;
            list.filter(filter).forEach(function(rel) {
                if (!groups[rel.type])
                    groups[rel.type] = {
                        'type': rel.type,
                        'list': []
                    }
                groups[rel.type].list.push(rel)
            });
            var garray = [];
            for (group in groups) {
                garray.push(groups[group]);
            }
            return garray;
        }
    });
}

// Load configuration based on page id
function _getConf(page) {
    var conf = app.config.pages[page];
    if (!conf)
        throw 'Configuration for "' + page + '" not found!';
    return conf;
}

// Helper to load configuration based on URL 
function _getConfByUrl(url) {
    var parts = url.split('/');
    var conf;
    for (var p in app.config.pages)
        if (app.config.pages[p].url == parts[0]) {
            conf = $.extend({}, app.config.pages[p]);
            conf.page = p;
        }
    if (!conf)
        throw 'Configuration for "/' + url + '" not found!';
    return conf;
}

return app;

});
