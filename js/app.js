/*!
 * wq.app 0.4.1 - app.js
 * Utilizes store and pages to dynamically load and render
 * content from a wq.db-compatible REST service
 * (c) 2012-2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['./lib/jquery', './lib/jquery.mobile',
        './store', './pages', './template', './spinner',
        './lib/es5-shim'],
function($, jqm, ds, pages, tmpl, spin) {

var app = {};

app.init = function(config, templates, baseurl, svc) {
    if (baseurl === undefined)
        baseurl = '';
    if (svc === undefined)
        svc = baseurl;
    app.config = app.default_config = config;
    app['native'] = !!window.cordova;
    app.can_login = !!config.pages.login;

    ds.init(svc, {'format':'json'}, {'applyResult': _applyResult});
    app.service = ds.service;

    pages.init(baseurl);
    app.base_url = pages.info.base_url;

    tmpl.init(templates, templates.partials, config.defaults);
    tmpl.setDefault('native', app['native']);
    tmpl.setDefault('app_config', app.config);

    if (app.can_login) {
        var user = ds.get('user');
        var csrftoken = ds.get('csrftoken');
        if (user) {
            app.user = user;
            tmpl.setDefault('user', user);
            tmpl.setDefault('is_authenticated', true);
            tmpl.setDefault('csrftoken', csrftoken);
            app.config = ds.get({'url': 'config'});
            tmpl.setDefault('app_config', app.config);
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
};

app.logout = function() {
    if (!app.can_login)
        return;
    delete app.user;
    ds.set('user', null);
    tmpl.setDefault('user', null);
    tmpl.setDefault('is_authenticated', false);
    app.config = app.default_config;
    tmpl.setDefault('app_config', app.config);
    ds.fetch({'url': 'logout'}, true, function(result) {
        tmpl.setDefault('csrftoken', result.csrftoken);
        ds.set('csrftoken', result.csrftoken);
    }, true);
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
    tmpl.setDefault('app_config', config);
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
        } else if (result && result.csrftoken) {
            tmpl.setDefault('csrftoken', result.csrftoken);
            ds.set('csrftoken', result.csrftoken);
        }
    }, true);
};

// Internal variables and functions
var _saveTransition = "none";

// Wrappers for pages.register & pages.go to handle common use cases

// Determine appropriate context & template for pages.go
app.go = function(page, ui, params, itemid, edit, url, context) {
    if (ui && ui.options && ui.options.data) return; // Ignore form actions
    var conf = _getConf(page);
    if (!conf.list) {
        _renderOther(page, ui, params, url, context);
        return;
    }
    spin.start();
    ds.getList({'url': conf.url}, function(list) {
        spin.stop();
        if (itemid) {
            if (edit)
                _renderEdit(page, list, ui, params, itemid, url, context);
            else
                _renderDetail(page, list, ui, params, itemid, url, context);
        } else {
            _renderList(page, list, ui, params, url, context);
        }
    });
};

app.attachmentTypes = {
    annotation: {
        'predicate': 'annotated',
        'type': 'annotationtype',
        'getTypeFilter': function(page, context) {
            return {'for': page};
        }
     },
     identifier: {
        'predicate': 'identified',
        'type': 'authority',
        'getTypeFilter': function(page, context) {
            return {};
        },
        'getDefaults': function(type) {
            return {
                'authority_id': type.id,
                'authority_label': type.label,
                'name': ''
            };
        }
    },
    location: {
        'predicate': 'located',
        'type': null
    },
    relationship: {
        'predicate': 'related',
        'type': 'relationshiptype',
        'getTypeFilter': function(page, context) {
             return {'from_type': page};
        },
        'getChoiceList': function(type) {
            return type.to_type;
        },
        'getChoiceListFilter': function(type) {
            return {};
        },
        'getDefaults': function(type) {
            return {'type_label': type.name};
        }
    },
    inverserelationship: {
        'predicate': 'related',
        'type': 'relationshiptype',
        'getTypeFilter': function(page, context) {
             return {'to_type': page};
        },
        'getChoiceList': function(type) {
            return type.from_type;
        },
        'getChoiceListFilter': function(type) {
            return {};
        },
        'getDefaults': function(type) {
            return {'type_label': type.inverse_name};
        }
    }
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

    (conf.parents || []).forEach(function(ppage) {
        var pconf = _getConf(ppage);
        var url = pconf.url;
        if (url)
            url += '/';
        url += '<slug>/' + conf.url;
        pages.register(url, goUrl(ppage, url));
        pages.register(url + '/', goUrl(ppage, url));
    });
    function goUrl(ppage, url) {
        return function(match, ui, params) {
            var pconf = _getConf(ppage);
            var pageurl = url.replace('<slug>', match[1]);
            spin.start();
            ds.getList({'url': pconf.url}, function(plist) {
                spin.stop();
                var pitem = plist.find(match[1]);
                app.go(page, ui, params, undefined, false, pageurl, {
                    'parent_id': match[1],
                    'parent_url': pitem && (pconf.url + '/' + pitem.id),
                    'parent_label': pitem && pitem.label,
                    'parent_page': ppage
                });
            });
        };
    }
}
function _renderList(page, list, ui, params, url, context) {
    var conf = _getConf(page);
    var pnum = 1, next = null, prev = null, filter;
    if (url === undefined) {
        url = conf.url;
        if (url)
            url += '/';
    }
    if (params || (context && context.parent_page)) {
        if (params)
            url += "?" + $.param(params);
        if (params && params.page) {
            pnum = params.page;
        } else {
            filter = {};
            for (var key in params || {}) {
                filter[key] = params[key];
            }
            (conf.parents || []).forEach(function(ppage) {
                var p = ppage;
                if (p.indexOf(page) === 0)
                     p = p.replace(page, '');
                if (filter[p]) {
                    filter[p + '_id'] = filter[p];
                    delete filter[p];
                } else if (context && context.parent_page == ppage) {
                    filter[p + '_id'] = context.parent_id;
                }
            });
        }
    }

    if (pnum > conf.max_local_pages || filter && conf.partial) {
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
        var prevp = {'page': +pnum - 1};
        prev = conf.url + '/?' + $.param(prevp);
    }

    if (pnum < data.info.pages) {
        var nextp = {'page': +pnum + 1};
        next = conf.url + '/?' + $.param(nextp);
    }

    context = $.extend({}, conf, {
        'list':     data,
        'page':     pnum,
        'pages':    data.info.pages,
        'per_page': data.info.per_page,
        'total':    data.info.total,
        'previous': prev ? '/' + prev : null,
        'next':     next ? '/' + next : null,
        'multiple': data.info.pages > 1
    }, context);
    _addLookups(page, context, false, function(context) {
        pages.go(url, page + '_list', context, ui, conf.once ? true : false);
    });
}

// Generate item detail view context and render with [url]_detail template;
// handles requests for [url]/[id]
function _registerDetail(page) {
    var conf = _getConf(page);
    var url = conf.url;
    var reserved = ["new"];
    if (url) {
        url += "/";
    } else {
        // This list is bound to the root URL, don't mistake other lists for items
        for (var key in app.config.pages)
            reserved.push(app.config.pages[key].url);
    }
    pages.register(url + '<slug>', function(match, ui, params) {
        if (reserved.indexOf(match[1]) > -1)
            return;
        app.go(page, ui, params, match[1]);
    });
}
function _renderDetail(page, list, ui, params, itemid, url, context) {
    var conf = _getConf(page);
    if (url === undefined) {
        url = conf.url;
        if (url)
            url += '/';
        url += itemid;
    }
    var item = list.find(itemid, undefined, undefined, conf.max_local_pages);
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
    context = $.extend({}, conf, item, context);
    _addLookups(page, context, false, function(context) {
        pages.go(url, page + '_detail', context, ui, conf.once ? true : false);
    });
}

// Generate item edit context and render with [url]_edit template;
// handles requests for [url]/[id]/edit and [url]/new
function _registerEdit(page) {
    var conf = _getConf(page);
    pages.register(conf.url + '/<slug>/edit', go);
    pages.register(conf.url + '/(new)', go);
    function go(match, ui, params) {
        app.go(page, ui, params, match[1], true);
    }
}
function _renderEdit(page, list, ui, params, itemid, url, context) {
    var conf = _getConf(page);
    if (itemid != "new") {
        // Edit existing item
        if (url === undefined)
            url = itemid + '/edit';
        var item = list.find(itemid, undefined, undefined, conf.max_local_pages);
        if (!item) {
            pages.notFound(url);
            return;
        }
        context = $.extend({}, conf, item, context);
        _addLookups(page, context, true, done);
    } else {
        // Create new item
        context = $.extend({}, conf, params, context); //FIXME: defaults
        if (url === undefined) {
            url = 'new';
            if (params && $.param(params))
                url += '?' + $.param(params);
        }
        _addLookups(page, context, "new", done);
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

function _renderOther(page, ui, params, url, context) {
    var conf = _getConf(page);
    if (url === undefined)
        url = conf.url;
    context = $.extend({}, conf, params, context);
    pages.go(url, page, context, ui, conf.once ? true : false);
}

// Handle form submit from [url]_edit views
function _handleForm(evt) {
    var $form = $(this);
    if ($form.data('json') !== undefined && !$form.data('json'))
        return; // Defer to default (HTML-based) handler

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

    vals.csrftoken = ds.get('csrftoken');

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
        var errs = Object.keys(item.error);

        // General API errors have a single "detail" attribute
        if (errs.length == 1 && errs[0] == 'detail') {
            showError(item.error.detail);
        } else {

            // Form errors (other than non_field_errors) are keyed by field name
            for (var f in item.error) {
                // FIXME: there may be multiple errors per field
                var err = item.error[f][0];
                if (f == 'non_field_errors')
                    showError(err);
                else
                    showError(err, f);
            }
            if (!item.error.non_field_errors)
                showError('One or more errors were found.');
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
            for (var aname in app.attachmentTypes)
                _updateAttachments(conf, res, aname);
            list.update([res], 'id', conf.reversed);
        });
    } else if (app.can_login && result && result.user && result.config) {
        app.save_login(result);
        pages.go("login", "login");
    }
}

function _updateAttachments(conf, res, aname) {
    var info = app.attachmentTypes[aname];
    var aconf = _getConf(aname, true);
    if (!aconf || !conf[info.predicate] || !res[aconf.url])
        return;
    var attachments = res[aconf.url];
    attachments.forEach(function(a) {
        a[conf.page + '_id'] = res.id;
    });
    ds.getList({'url': aconf.url}, function(list) {
        list.update(attachments, 'id');
    });
    delete res[aconf.url];
}

// Add various callback functions to context object to automate foreign key
// lookups within templates
function _addLookups(page, context, editable, callback) {
    var conf = _getConf(page);
    var lookups = {};
    var field;
    if (conf.choices) {
        for (field in conf.choices) {
            lookups[field + '_label'] = _choice_label_lookup(field, conf.choices[field]);
            if (editable) {
                lookups[field + '_choices'] = _choice_dropdown_lookup(field, conf.choices[field]);
            }
        }
    }
    $.each(conf.parents || [], function(i, v) {
        var pconf = _getConf(v);
        var col;
        if (v.indexOf(page) === 0)
            col = v.replace(page, '') + '_id';
        else
            col = v + '_id';
        lookups[v] = _parent_lookup(v, col);
        if (editable) {
            lookups[v + '_list'] = _parent_dropdown_lookup(v, col);
            if (pconf.url)
                lookups[pconf.url] = lookups[v + '_list'];
        }
    });
    $.each(conf.children || [], function(i, v) {
        var cconf = _getConf(v);
        lookups[cconf.url] = _children_lookup(page, v);
    });

    // Load annotations and identifiers
    for (var aname in app.attachmentTypes) {
        var info = app.attachmentTypes[aname];
        var aconf = _getConf(aname, true);
        if (!aconf || !conf[info.predicate])
            continue;

        if (info.type)
            lookups[info.type] = _parent_lookup(info.type);
        if (editable) {
            if (aconf.choices) {
                for (field in aconf.choices) {
                    lookups[field + '_choices'] = _choice_dropdown_lookup(field, aconf.choices[field]);
                }
            }
            if (info.getChoiceList) {
                lookups.item_choices = _item_choice_lookup(page, aname);
            }
        }
        if (editable == "new")
            lookups[aconf.url] = _default_attachments(page, aname);
        else
            lookups[aconf.url] = _children_lookup(page, aname);
    }
    var queue = [];
    for (var key in lookups)
        queue.push(key);

    spin.start();
    step();
    function step() {
        if (!queue.length) {
            spin.stop();
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
            context[key] = fn(list, context);
            callback(context);
        });
    };
}

// Preset list of choices
function _choice_label_lookup(name, choices) {
    return function(context, key, callback) {
        context[key] = function() {
            if (!this[name])
                return;
            var label;
            choices.forEach(function(choice) {
                if (choice.value == this[name])
                    label = choice.label;
            });
            return label;
        };
        callback(context);
    };
}

function _choice_dropdown_lookup(name, choices) {
    return function(context, key, callback) {
        context[key] = function() {
            var list = [];
            choices.forEach(function(choice) {
                var item = $.extend({}, choice);
                if (choice.value == this[name])
                    item.selected = true;
                list.push(item);
            });
            return list;
        };
        callback(context);
    };
}

function _item_choice_lookup(page, aname) {
    return function(context, key, callback) {
        var conf = _getConf(aname);
        var info = app.attachmentTypes[aname];
        var tconf = _getConf(info.type);
        ds.getList({'url': tconf.url}, function(types) {
            var lists = [], listLookup = {};
            types.filter(info.getTypeFilter(page)).forEach(function(type) {
                lists.push(info.getChoiceList(type));
            });
            if (!lists.length)
                callback(context);
            else
                addList(0);
            function addList(index) {
                var lconf = _getConf(lists[index]);
                ds.getList({'url': lconf.url}, function(list) {
                    listLookup[lists[index]] = function(type) {
                        var items = list.filter(info.getChoiceListFilter(type));
                        items.forEach(function(item, i) {
                            if (item.id == this.item_id) {
                                item = $.extend({}, item);
                                item.selected = true;
                                items[i] = item;
                            }
                        }, this);
                        return items;
                    };
                    if (index < lists.length - 1)
                        addList(index + 1);
                    else {
                        context[key] = function() {
                            if (this.type_id) {
                                var type = types.find(this.type_id);
                                var listid = info.getChoiceList(type);
                                return listLookup[listid].call(this, type);
                            }
                        };
                        callback(context);
                    }
                });
            }
        });
    };
}

// Simple foreign key lookup
function _parent_lookup(page, column) {
    if (!column) column = page + '_id';
    return _make_lookup(page, function(list) {
        return function() {
            return list.find(this[column]);
        };
    });
}

// List of all potential foreign key values (useful for generating dropdowns)
function _parent_dropdown_lookup(page, column) {
    if (!column) column = page + '_id';
    return _make_lookup(page, function(list) {
        return function() {
            var obj = this;
            var parents = [];
            list.forEach(function(v) {
                var item = $.extend({}, v);
                if (item.id == obj[column])
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
        };
    });
}

// List of empty annotations for new objects
function _default_attachments(ppage, apage) {
    var info = app.attachmentTypes[apage];
    if (!info.type)
        return function(context, key, callback) {
            context[key] = [];
            callback(context);
        };
    return _make_lookup(info.type, function(list, context) {
        var filter = info.getTypeFilter(ppage, context);
        var types = list.filter(filter);
        var attachments = [];
        types.forEach(function(t) {
            var obj = {};
            if (info.getDefaults)
                obj = info.getDefaults(t);
            obj.type_id = t.id;
            attachments.push(obj);
        });
        return attachments;
    });
}

// Load configuration based on page id
function _getConf(page, silentFail) {
    var conf = app.config.pages[page];
    if (!conf)
        if (silentFail)
            return;
        else
            throw 'Configuration for "' + page + '" not found!';
    if (conf.alias)
        return _getConf(conf.alias);
    return $.extend({'page': page}, conf);
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
