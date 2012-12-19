/*!
 * wq.app - app.js
 * Utilizes store and pages to dynamically load and render
 * content from a wq.db-compatible REST service
 * (c) 2012 S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery', './lib/jquery.mobile',
        './store', './pages', './template', './spinner'],
function($, jqm, ds, pages, tmpl, spin) {

var app = {};

app.init = function(config, templates, svc) {
    if (svc === undefined)
       svc = '';
    app.config = app.default_config = config;
    app.native = !!window.cordova;
    ds.init(svc, {'format':'json'}, {'applyResult': _applyResult});
    pages.init();
    tmpl.init(templates, templates.partials, config.defaults);
    tmpl.setDefault('native', app.native);

    var user = ds.get('user');
    if (user) {
        app.user = user;
        tmpl.setDefault('user', user);
        app.config = ds.get({'url': 'config'});
    }
    if (document.cookie) {
        app.check_login();
    }

    if (config.transitions) {
        if (config.transitions['default'])
            jqm.defaultPageTransition = config.transitions['default'];
        if (config.transitions.dialog)
            jqm.defaultDialogTransition = config.transitions.dialog;
        if (config.transitions.save)
            _saveTransition = config.transitions.save;
        jqm.maxTransitionWidth = config.transitions.maxwidth || 800;
    }
    
    pages.register('logout\/?', app.logout);
    for (var page in app.config.pages) {
        var conf = app.config.pages[page];
        if (conf.list) {
            _registerList(page);
            _registerDetail(page);
            _registerEdit(page);
        } else if (conf) {
            _registerOther(page);
        }
    }

    $('form').live("submit", _handleForm);
}

app.logout = function() {
    delete app.user;
    ds.set('user', null);
    tmpl.setDefault('user', null);
    app.config = app.default_config;
    ds.fetch({'url': 'logout'}, true, undefined, true);
};

app.save_login = function(user, config) {
    app.config = config;
    ds.set({'url': 'config'}, config);
    app.user = user;
    tmpl.setDefault('user', user);
    ds.set('user', user);
};

app.check_login = function() {
    ds.fetch({'url': 'login'}, false, function(result) {
        if (result && result.user && result.config) {
            app.save_login(result.user, result.config);
        } else if (result && app.user) {
            app.logout();
        }
    }, true);
};

// Internal variables and functions
var _saveTransition = "none";

// Wrappers for pages.register to handle common use cases

// Generate list view context and render with [url]_list template;
// handles requests for [url] and [url]/
function _registerList(page) {
    var conf = app.config.pages[page];
    pages.register(conf.url, go);
    pages.register(conf.url + '/', go);
    function go(match, ui, params) {
        if (ui && ui.options && ui.options.data) return; // Ignore form actions
        ds.getList({'url': conf.url}, function(list) {
            var pnum = 1, next = null, prev = null, filter;
            if (params) {
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
                var url = conf.url + '/';
                if (params)
                    url += "?" + $.param(params);
                pages.go(url, page + '_list', context, ui);
            });
        });
    }
}

// Generate item detail view context and render with [url]_detail template;
// handles requests for [url]/[id]
function _registerDetail(page) {
    var conf = app.config.pages[page];
    pages.register(conf.url + '/([^/\?]+)', function(match, ui, params) {
        if (ui && ui.options && ui.options.data) return; // Ignore form actions
        if (match[1] == "new") return;
        ds.getList({'url': conf.url}, function(list) {
            var url = conf.url + '/' + match[1];
            var item = list.find(match[1]);
            if (!item) {
                // Item not found in stored list...
                if (!conf.partial) {
                    // List is assumed to contain entire dataset,
                    // so the item probably does not exist
                    pages.notFound(url);
                } else {
                    // List does not represent entire dataset;
                    // attempt to load HTML directly from the server
                    // (using built-in jQM loader)
                    var jqmurl = '/' + url;
                    jqm.loadPage(jqmurl).then(function() {
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
        });
    });
}

// Generate item edit context and render with [url]_edit template;
// handles requests for [url]/[id]/edit and [url]/new
function _registerEdit(page) {
    var conf = app.config.pages[page];
    pages.register(conf.url + '/([^/]+)/edit', go);
    pages.register(conf.url + '/new', go);
    function go(match, ui, params) {
        ds.getList({'url': conf.url}, function(list) {
            var url;
            if (match && match[1]) {
                // Edit existing item
                url = match[1] + '/edit';
                var context = $.extend({}, list.find(match[1]));
                if (!context) {
                    pages.notFound(url);
                    return;
                }
                _addLookups(page, context, true, done);
            } else {
                // Create new item
                var context = {}; //FIXME: defaults
                url = 'new';
                _addLookups(page, context, true, function(context) {
                    if (!conf.annotated) {
                        done(context);
                        return;
                    }

                    context['annotations'] = [];
                    ds.getList({'url': 'annotationtypes'}, function(list) {
                        var types = list.filter({'for': page});
                        $.each(types, function(i, t) {
                            context['annotations'].push({'annotationtype_id': t.id});
                        });
                        done(context);
                    });
                });
            }
            function done(context) {
                pages.go(conf.url + '/' + url, page + '_edit', context, ui);
            }
        });
    }
}

// Render non-list pages with with [url] template;
// handles requests for [url] and [url]/
function _registerOther(page) {
    var conf = app.config.pages[page];
    pages.register(conf.url, go);
    pages.register(conf.url + '/', go);
    function go(match, ui, params) {
        if (ui && ui.options && ui.options.data) return; // Ignore form actions
        pages.go(conf.url, page, params, ui);
    }
}

// Handle form submit from [url]_edit views
function _handleForm(evt) {
    evt.preventDefault();
    var $form = $(this);
    var url = $form.attr('action').substring(1);
    var conf = _getConfByUrl(url);

    var vals = {};
    if (app.native) {	
	$.each($form.serializeArray(), function(i, v) {
	    vals[v.name] = v.value;
	});
    } else {
        vals.data = new FormData(this);
    }
    
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
            jqm.changePage('/' + conf.url + '/' + item.newid, options);
            return;
        }

        if (!item || !item.error) {
            // Save failed for some unknown reason
            showError("Error saving data.");
            return;
        }

        // Rest API provided detailed error information
        if (typeof(item.error) === 'string') {
            showError(item.error);
            return;
        }

        if (item.error.field_errors) {
            for (f in item.error.field_errors) {
                var err = item.error.field_errors[f][0];
                showError(err, f);
            }
        }

        if (item.error.errors) {
            var err = item.error.errors[0];
            showError(err);
        }

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
            delete res.updates;
            list.update([res], 'id');
        });
        if (result.updates) {
            for (var page in result.updates) {
                var pconf = app.config.pages[page];
                ds.getList({'url': pconf.url}, function(list) {
                    list.update(result.updates[page], 'id');
                });
            }
        }
    } else if (result && result.user && result.config) {
        app.save_login(result.user, result.config);
        pages.go("login", "login");
    }
}

// Add various callback functions to context object to automate foreign key 
// lookups within templates
function _addLookups(page, context, editable, callback) {
    var conf = app.config.pages[page];
    var lookups = {};
    $.each(conf.parents, function(i, v) {
        lookups[v] = _parent_lookup(v)
        if (editable)
           lookups[app.config.pages[v].url] = _parent_dropdown_lookup(v);
    });
    $.each(conf.children, function(i, v) {
        lookups[app.config.pages[v].url] = _children_lookup(page, v)
    });
    if (conf.annotated) {
        lookups['annotations']    = _annotation_lookup(page);
        lookups['annotationtype'] = _parent_lookup('annotationtype');
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
        var conf = app.config.pages[page]
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

// Helper to load configuration based on URL 
function _getConfByUrl(url) {
    var parts = url.split('/');
    var conf;
    for (var p in app.config.pages)
        if (app.config.pages[p].url == parts[0]) {
            conf = $.extend({}, app.config.pages[p]);
            conf.page = p;
        }
    return conf;
}

return app;

});
