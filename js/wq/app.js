/*!
 * wq.app 0.8.0 - wq/app.js
 * Utilizes store and pages to dynamically load and render
 * content from a wq.db-compatible REST service
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Promise */

define(['jquery', 'jquery.mobile',
        './store', './model', './outbox', './router', './template',
        './spinner', './console',
        'es5-shim'],
function($, jqm, ds, model, outbox, router, tmpl, spin, console) {

var app = {
    'OFFLINE': 'offline',
    'FAILURE': 'failure',
    'ERROR': 'error'
};

app.models = {};

app.init = function(config) {
    if (arguments.length > 1) {
        throw "app.init() now takes a single configuration argument";
    }
    // Router (wq/router.js) configuration
    if (!config.router) {
        config.router = {
            'base_url': ''
        };
    }

    // Store (wq/store.js) configuration
    if (!config.store) {
        config.store = {
            'service': config.router.base_url,
            'defaults': {'format': 'json'}
        };
    }
    if (!config.store.fetchFail) {
        config.fetchFail = _fetchFail;
    }

    // Outbox (wq/outbox.js) configuration
    if (!config.outbox) {
        config.outbox = {};
    }
    if (!config.outbox.updateModels) {
        config.outbox.updateModels = _updateModels;
    }

    // Propagate debug setting to other modules
    if (config.debug) {
        config.router.debug = config.debug;
        config.store.debug = config.debug;
        config.template.debug = config.debug;
    }

    // Load missing (non-local) content as JSON, or as server-rendered HTML?
    // Default is server-rendered HTML
    config.loadMissingAsHtml = (
        config.loadMissingAsHtml || !config.loadMissingAsJson
    );
    config.loadMissingAsJson = !config.loadMissingAsHtml;

    // After a form submission, sync in the background, or wait before
    // continuing?  Default (as of 0.8) is to sync in the background.
    config.backgroundSync = (
        config.backgroundSync || !config.noBackgroundSync
    );
    config.noBackgroundSync = !config.backgroundSync;

    app.config = config;
    app.wq_config = {'pages': config.pages};

    app['native'] = !!window.cordova;
    app.can_login = !!config.pages.login;

    // Initialize wq/store.js
    ds.init(config.store);
    app.service = ds.service;

    // Initialize wq/outbox.js
    outbox.init(config.outbox);

    // Initialize wq/router.js
    router.init(config.router);
    app.base_url = router.info.base_url;

    // Initialize wq/template.js
    tmpl.init(config.template);
    tmpl.setDefault('native', app['native']);
    tmpl.setDefault('app_config', app.config);
    tmpl.setDefault('svc', app.service);

    // Option to submit forms in the background rather than wait for each post
    var seconds;
    if (config.backgroundSync) {
        seconds = config.backgroundSync;
        if (seconds === true) {
            seconds = 30;
        }
		if (seconds > 0) {
			app._syncInterval = setInterval(function() {
				app.sync();
			}, seconds * 1000);
		}
    }

    // Option to override various hooks
    [
        'postsave',
        'saveerror',
        'showOutboxErrors',
        'presync',
        'postsync',
        'parentFilters'
    ].forEach(function(hook) {
        if (config[hook]) {
            app[hook] = config[hook];
        }
    });

    // Option to update attachmentTypes configuration
    var aname;
    if (config.attachmentTypes) {
        for (aname in config.attachmentTypes) {
            app.attachmentTypes[aname] = $.extend(
                app.attachmentTypes[aname] || {},
                config.attachmentTypes[aname]
            );
        }
    }

    // Initialize authentication, if applicable
    var ready;
    if (app.can_login) {
        router.register('logout\/?', app.logout);
        _checkLogin();

        // Load some values from store - not ready till this is done.
        ready = ds.get(['user', 'csrf_token']).then(function(values) {
            var user = values[0];
            _setCSRFToken(values[1]);
            if (!user) {
                return;
            }
            app.user = user;
            tmpl.setDefault('user', user);
            tmpl.setDefault('is_authenticated', true);
            return ds.get('/config').then(function(wq_config) {
                tmpl.setDefault('wq_config', app.wq_config);
                app.wq_config = wq_config;
                $('body').trigger('login');
            });
        });
    } else {
        ready = ds.ready;
    }

    // Configure jQuery Mobile transitions
    if (config.transitions) {
        var def = "default";
        if (config.transitions[def]) {
            jqm.defaultPageTransition = config.transitions[def];
        }
        if (config.transitions.dialog) {
            jqm.defaultDialogTransition = config.transitions.dialog;
        }
        if (config.transitions.save) {
            _saveTransition = config.transitions.save;
        }
        jqm.maxTransitionWidth = config.transitions.maxwidth || 800;
    }

    // Register routes with wq/router.js
    for (var page in app.wq_config.pages) {
        app.wq_config.pages[page].name = page;
        var conf = _getConf(page);
        if (conf.list) {
            _registerList(page);
            _registerDetail(page);
            _registerEdit(page);
            app.models[page] = model(conf);
        } else if (conf) {
            _registerOther(page);
        }
    }

    // Register outbox
    router.register('outbox', _outboxList);
    router.register('outbox/', _outboxList);
    router.register('outbox/<slug>', _outboxItem(false));
    router.register('outbox/<slug>/edit', _outboxItem(true));

    // Handle form events
    $(document).on('submit', 'form', _handleForm);
    $(document).on('click', 'form [type=submit]', _submitClick);

    if (app.config.jqmInit) {
        ready = ready.then(app.jqmInit);
    }

    return ready;
};

app.prefetchAll = function() {
    return Promise.all(Object.keys(app.models).map(function(name) {
        return app.models[name].prefetch();
    }));
};

app.jqmInit = router.jqmInit;

app.logout = function() {
    if (!app.can_login) {
        return;
    }
    delete app.user;
    tmpl.setDefault('user', null);
    tmpl.setDefault('is_authenticated', false);
    app.wq_config = {'pages': app.config.pages};
    tmpl.setDefault('wq_config', app.wq_config);
    ds.set('user', null).then(function() {
        $('body').trigger('logout');
    });

    // Notify server (don't need to wait for this)
    ds.fetch('/logout').then(function(result) {
        _setCSRFToken(result.csrftoken);
    });
};

// Determine appropriate context & template for router.go
app.go = function(page, ui, params, itemid, edit, url, context) {
    if (ui && ui.options && ui.options.data) {
        return; // Ignore form actions
    }
    var conf = _getConf(page);
    if (!conf.list) {
        _renderOther(page, ui, params, url, context);
        return;
    }
    var model = app.models[page];
    spin.start();

    if (itemid) {
        if (itemid == 'new') {
            return _displayItem(
                itemid, {}, page, ui, params, edit, url, context
            );
        } else {
            var localOnly = !app.config.loadMissingAsJson;
            return model.find(itemid, 'id', localOnly).then(function(item) {
                _displayItem(
                    itemid, item, page, ui, params, edit, url, context
                );
            });
        }
    } else {
        return _displayList(page, ui, params, url, context);
    }

};

// Sync outbox and handle result
app.sync = function(retryAll) {
    if (app.syncing) {
        return;
    }
    outbox.unsynced().then(function(unsynced) {
        if (!unsynced) {
            return;
        }
        app.syncing = true;
        tmpl.setDefault('syncing', true);
        app.presync();
        outbox.sendAll(retryAll).then(function(items) {
            app.syncing = false;
            tmpl.setDefault('syncing', false);
            app.postsync(items);
        });
    });
};

// Hook for handling navigation after form submission
app.postsave = function(item, backgroundSync) {
    var options = {
        'reverse': true,
        'transition': _saveTransition,
        'allowSamePageTransition': true
    };
    var postsave, pconf, match, mode, url, itemid, modelConf;

    // conf.postsave can be set redirect to another page
    modelConf = item.options.modelConf;
    postsave = modelConf.postsave;
    if (!postsave) {
        // Otherwise, default is to return the page for the item just saved
        if (backgroundSync) {
            // If backgroundSync, return to list view while syncing
            postsave = modelConf.name + '_list';
        } else {
            // If noBackgroundSync, return to the newly synced item
            postsave = modelConf.name + '_detail';
        }
    }

    // conf.postsave should explicitly indicate which template mode to use
    match = postsave.match(/^(.+)_([^_]+)$/);
    if (match) {
        postsave = match[1];
        mode = match[2];
    }

    // Retrieve configuration for postsave page, if any
    pconf = _getConf(postsave, true);

    // Compute URL
    if (!pconf) {
        // If conf.postsave is not the name of a list page, assume it's a
        // simple page or a URL
        url = app.base_url + '/' + postsave;
    } else if (!pconf.list) {
        url = app.base_url + '/' + pconf.url;
    } else {
        if (mode != 'list' && mode != 'detail' && mode != 'edit') {
            throw "Unknown template mode!";
        }
        
        // For list pages, the url can differ depending on the mode
        url = app.base_url + '/' + pconf.url + '/';

        if (mode != 'list') {
            // Detail or edit view; determine item id and add to url
            if (postsave == modelConf.name && !item.synced) {
                // Config indicates return to detail/edit view of the model
                // that was just saved, but the item hasn't been synced yet.
                // Navigate to outbox URL instead.
                url = app.base_url + '/outbox/' + item.id;
                if (mode != 'edit' && item.error) {
                    // Return to edit form if there was an error
                    mode = 'edit';
                }
            } else {
                // Item has been successfully synced
                if (postsave == modelConf.name) {
                    // If postsave page is the same as the item's page, use the
                    // new id
                    itemid = item.result && item.result.id;
                } else {
                    // Otherwise, look for a foreign key reference
                    // FIXME: what if the foreign key has a different name?
                    itemid = item.result && item.result[postsave + '_id'];
                }
                if (!itemid) {
                    throw "Could not find " + postsave + " id in result!";
                }
                url += itemid;
            }
            if (mode == "edit") {
                url += "/edit";
            }
        }
    }

    // Navigate to computed URL
    if (app.config.debug) {
        console.log("Successfully saved; continuing to " + url);
    }
    jqm.changePage(url, options);
};

// Hook for handling navigation / alerts after a submission error
// (only used when noBackgroundSync is set)
app.saveerror = function(item, reason, $form) {
    /* jshint unused: false */
    // Save failed for some reason, perhaps due to being offline
    // (override to customize behavior, e.g. display an outbox)
    if (app.config.debug) {
        console.warn("Could not save: " + reason);
    }
    if (reason == app.OFFLINE) {
        app.postsave(item, false);
    } else {
        app.showOutboxErrors(item, $form);
    }
};

// Hook for handling alerts before a background sync event
// (only used when backgroundSync is set)
app.presync = function() {
    if (app.config.debug) {
        console.log("Syncing...");
    }
};

// Hook for handling alerts after a background sync event
app.postsync = function(items) {
    /* jshint unused: false */
    // Called after every sync with result from outbox.sendAll().
    // (override to customize behavior, e.g. update a status icon)
    var msg;
    if (app.config.debug && items.length) {
        var result = true;
        items.forEach(function(item) {
            if (!item) {
                result = null;
            }
            if (!item.synced && result) {
                result = false;
            }
        });
        if (result) {
            console.log("Successfully synced.");
        } else {
            if (result === false) {
                msg = "Sync error!";
            } else {
                msg = "Sync failed!";
            }
            outbox.unsynced().then(function(unsynced) {
               console.warn(msg + " " + unsynced + " items remain unsynced");
            });
        }
    }
    app.syncRefresh(items);
};

app.syncRefresh = function(items) {
    if (items.length && jqm.activePage.data('wq-sync-refresh')) {
        jqm.changePage(jqm.activePage.data('url'), {
            'transition': 'none',
            'allowSamePageTransition': true
        });
    }
};

app.attachmentTypes = {
    annotation: {
        'predicate': 'annotated',
        'type': 'annotationtype',
        'getTypeFilter': function(page, context) {
            /* jshint unused: false */
            return {};
        }
    },
    identifier: {
        'predicate': 'identified',
        'type': 'authority',
        'typeColumn': 'authority_id',
        'getTypeFilter': function(page, context) {
            /* jshint unused: false */
            return {};
        },
        'getDefaults': function(type, context) {
            /* jshint unused: false */
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
    markdown: {
        'predicate': 'marked',
        'type': 'markdowntype',
        'getTypeFilter': function(page, context) {
            /* jshint unused: false */
            return {};
        }
    },
    relationship: {
        'predicate': 'related',
        'type': 'relationshiptype',
        'getTypeFilter': function(page, context) {
            /* jshint unused: false */
            return {'from_type': page};
        },
        'getChoiceList': function(type, context) {
            /* jshint unused: false */
            return type.to_type;
        },
        'getChoiceListFilter': function(type, context) {
            /* jshint unused: false */
            return {};
        },
        'getDefaults': function(type, context) {
            /* jshint unused: false */
            return {
                'type_label': type.name,
                'to_type': type.to_type
            };
        }
    },
    inverserelationship: {
        'predicate': 'related',
        'type': 'relationshiptype',
        'getTypeFilter': function(page, context) {
            /* jshint unused: false */
            return {'to_type': page};
        },
        'getChoiceList': function(type, context) {
            /* jshint unused: false */
            return type.from_type;
        },
        'getChoiceListFilter': function(type, context) {
            /* jshint unused: false */
            return {};
        },
        'getDefaults': function(type, context) {
            /* jshint unused: false */
            return {
                'type_label': type.inverse_name,
                'from_type': type.from_type
            };
        }
    }
};

app.parentFilters = {};

// Normalize structure of app.wq_config.pages[page].parents
app.getParents = function(page) {
    var conf = _getConf(page), parents = {};
    if (!conf.parents) {
        /* jshint noempty: false */
        // conf.parents is empty; return empty object
    } else if (conf.parents.length !== undefined) {
        // conf.parents is an array; foreign keys have the same name as the
        // parent they point to.
        parents = {};
        conf.parents.forEach(function(p) {
            parents[p] = [p];
        });
    } else {
        // conf.parents is an object: keys are parents, values are arrays with
        // names of one or more foreign key fields.
        parents = conf.parents;
    }
    return parents;
};

// Internal variables and functions
var _saveTransition = "none";

function _setCSRFToken(csrftoken) {
    outbox.setCSRFToken(csrftoken);
    tmpl.setDefault('csrf_token', csrftoken);
    return ds.set('csrf_token', csrftoken);
}

// Generate list view context and render with [url]_list template;
// handles requests for [url] and [url]/
function _registerList(page) {
    var conf = _getConf(page);
    router.register(conf.url, go);
    router.register(conf.url + '/', go);
    function go(match, ui, params) {
        app.go(page, ui, params);
    }

    // Special handling for /[parent_list_url]/[parent_id]/[url]
    for (var ppage in app.getParents(page)) {
        var pconf = _getConf(ppage);
        var url = pconf.url;
        if (url) {
            url += '/';
        }
        url += '<slug>/' + conf.url;
        router.register(url, goUrl(ppage, url));
        router.register(url + '/', goUrl(ppage, url));
    }
    function goUrl(ppage, url) {
        return function(match, ui, params) {
            var pconf = _getConf(ppage);
            var pageurl = url.replace('<slug>', match[1]);
            spin.start();
            app.models[ppage].find(match[1]).then(function(pitem) {
                spin.stop();
                var context = {
                    'parent_id': match[1],
                    'parent_url': pitem && (pconf.url + '/' + pitem.id),
                    'parent_label': pitem && pitem.label,
                    'parent_page': ppage
                };
                context['parent_is_' + ppage] = true;
                app.go(page, ui, params, undefined, false, pageurl, context);
            });
        };
    }
}
function _displayList(page, ui, params, url, context) {
    spin.stop();

    var conf = _getConf(page);
    var model = app.models[page];
    var pnum = 1, next = null, prev = null, filter;
    if (url === undefined) {
        url = conf.url;
        if (url) {
            url += '/';
        }
    }
    if ((params && $.param(params)) || (context && context.parent_page)) {
        if (params && $.param(params)) {
            url += "?" + $.param(params);
        }
        if (params && params.page) {
            pnum = params.page;
        } else {
            filter = {};
            for (var key in params || {}) {
                filter[key] = params[key];
            }
            if (context && context.parent_page) {
                var parents = app.getParents(page);
                Object.keys(parents).forEach(function(ppage) {
                    parents[ppage].forEach(function(field) {
                        if (context && context.parent_page == ppage) {
                            filter[field + '_id'] = context.parent_id;
                        }
                    });
                });
            }
        }
    }

    if (pnum > conf.max_local_pages || filter && conf.partial) {
        // Set max_local_pages to avoid filling up local storage and
        // instead attempt to load HTML directly from the server
        // (using built-in jQM loader)
        if (app.config.loadMissingAsHtml) {
            return _loadFromServer(url, ui);
        }
    }

    var result1 = filter ? model.filterPage(filter) : model.page(pnum);
    var result2 = model.unsyncedItems();
    return Promise.all([result1, result2]).then(function(results) {
        var data = results[0];
        var unsyncedItems = results[1];
        if (pnum > 1) {
            var prevp = {'page': +pnum - 1};
            prev = conf.url + '/?' + $.param(prevp);
        }

        if (pnum < data.pages) {
            var nextp = {'page': +pnum + 1};
            next = conf.url + '/?' + $.param(nextp);
        }

        context = $.extend({}, data, {
            'previous': prev ? '/' + prev : null,
            'next':     next ? '/' + next : null,
            'multiple': data.pages > 1
        }, context);

        // Add any outbox items to context
        context.unsynced = unsyncedItems.length;
        context.unsyncedItems = unsyncedItems;

        return _addLookups(page, context, false).then(function(context) {
            return router.go(
                url, page + '_list', context, ui, conf.once ? true : false
            );
        });
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
        // This list is bound to root URL, don't mistake other lists for items
        for (var key in app.wq_config.pages) {
            reserved.push(app.wq_config.pages[key].url);
        }
    }
    router.register(url + '<slug>', function(match, ui, params) {
        if (reserved.indexOf(match[1]) > -1) {
            return;
        }
        app.go(page, ui, params, match[1]);
    });
}

// Generate item edit context and render with [url]_edit template;
// handles requests for [url]/[id]/edit and [url]/new
function _registerEdit(page) {
    var conf = _getConf(page);
    router.register(conf.url + '/<slug>/edit', go);
    router.register(conf.url + '/(new)', go);
    function go(match, ui, params) {
        app.go(page, ui, params, match[1], true);
    }
}

function _displayItem(itemid, item, page, ui, params, edit, url, context) {
    var conf = _getConf(page);
    spin.stop();
    if (url === undefined) {
        url = conf.url;
        if (url) {
            url += '/';
        }
        url += itemid;
        if (edit && itemid != 'new') {
            url += '/edit';
        }
        if (params && $.param(params)) {
            url += '?' + $.param(params);
        }
    }
    if (item) {
        if (edit) {
            return _renderEdit(itemid, item, page, ui, params, url, context);
        } else {
            return _renderDetail(item, page, ui, params, url, context);
        }
    } else {
        if (conf.partial && app.config.loadMissingAsHtml) {
            // conf.partial indicates that the local list does not represent
            // the entire dataset; if an item is not found, attempt to load
            // HTML directly from the server (using built-in jQM loader)
            return _loadFromServer(url, ui);
        } else {
            // If conf.partial is not set, locally stored list is assumed to
            // contain the entire dataset, so the item probably does not exist.
            return router.notFound(url);
        }
    }
}

function _renderDetail(item, page, ui, params, url, context) {
    var conf = _getConf(page);
    context = $.extend({'page_config': conf}, item, context);
    return _addLookups(page, context, false).then(function(context) {
        var divid = page + '_detail_' + (item.id || 'new') + '-page';
        return router.go(
            url, page + '_detail', context, ui, conf.once ? true : false, divid
        );
    });
}

function _renderEdit(itemid, item, page, ui, params, url, context) {
    var conf = _getConf(page);
    if (itemid == "new") {
        // Create new item
        context = $.extend({'page_config': conf}, conf.defaults, context);
        return _addLookups(page, context, "new").then(done);
    } else {
        // Edit existing item
        context = $.extend({'page_config': conf}, item, context);
        return _addLookups(page, context, true).then(done);
    }
    function done(context) {
        var divid = page + '_edit_' + itemid + '-page';
        return router.go(
            url, page + '_edit', context, ui, false, divid
        );
    }
}

// Render non-list pages with with [url] template;
// handles requests for [url] and [url]/
function _registerOther(page) {
    var conf = _getConf(page);
    router.register(conf.url, go);
    router.register(conf.url + '/', go);
    function go(match, ui, params) {
        app.go(page, ui, params);
    }
}

function _renderOther(page, ui, params, url, context) {
    var conf = _getConf(page);
    if (url === undefined) {
        url = conf.url;
    }
    context = $.extend({}, conf, params, context);
    router.go(url, page, context, ui, conf.once ? true : false);
}

function _outboxList(match, ui) {
    outbox.model.load().then(function(data) {
        router.go('outbox', 'outbox', data, ui);
    });
}

function _outboxItem(edit) {
    // Display outbox item using model-specific detail/edit view
    return function(match, ui, params) {
        outbox.model.find(match[1]).then(function(item) {
            var id, idMatch = item.options.url.match(new RegExp(
                item.options.modelConf.url + '/([^\/]+)$'
            ));
            if (item.data.id) {
                id = item.data.id;
            } else if (idMatch) {
                id = idMatch[1];
            } else {
                id = 'new';
            }
            var url = 'outbox/' + item.id;
            if (edit) {
                url += '/edit';
            }
            var context = {
                'unsynced': true,
                'outbox_id': item.id,
                'error': item.error
            };
            if (id == 'new') {
                $.extend(context, item.data);
            } else {
                context.id = id;
            }
            _displayItem(
                 id, item.data, item.options.modelConf.name,
                 ui, params, edit, url, context
            ).then(function($page) {
                if (edit && item.error) {
                    app.showOutboxErrors(item, $page);
                }
            });
        });
    };
}

// Handle form submit from [url]_edit views
function _handleForm(evt) {
    var $form = $(this), $submitVal, backgroundSync;
    if (evt.isDefaultPrevented()) {
        return;
    }
    if ($form.data('wq-submit-button-name')) {
        $submitVal = $("<input>")
           .attr("name", $form.data('wq-submit-button-name'))
           .attr("value", $form.data('wq-submit-button-value'));
        $form.append($submitVal);
    }
    if ($form.data('wq-json') !== undefined && !$form.data('wq-json')) {
        return; // Defer to default (HTML-based) handler
    }

    if ($form.data('wq-background-sync') !== undefined) {
        backgroundSync = $form.data('wq-background-sync');
    } else {
        backgroundSync = app.config.backgroundSync;
    }

    var outboxId = $form.data('wq-outbox-id');
    var preserve = $form.data('wq-outbox-preserve');
    var url = $form.attr('action').replace(app.base_url + "/", "");
    var conf = _getConfByUrl(url);
    var vals = {};
    var $files = $form.find('input[type=file]');
    var has_files = ($files.length > 0 && $files.val().length > 0);
    var ready;

    if (has_files && !window.Blob) {
        // Files present but there's no Blob API.  Looks like we're in a an old
        // browser that can't upload files via AJAX.  Bypass wq/outbox.js
        // entirely and hope server is able to respond to regular form posts
        // with HTML (hint: wq.db is).
        return;
    }

    // Modern browser and/or no files present; skip regular form submission,
    // we're saving this via wq/outbox.js
    evt.preventDefault();

    // Use a simple JSON structure for values, which is better for outbox
    // serialization.
    function addVal(name, val) {
        if (vals[name] !== undefined) {
            if (!$.isArray(vals[name])) {
                vals[name] = [vals[name]];
            }
            vals[name].push(val);
        } else {
            vals[name] = val;
        }
    }
    ready = Promise.resolve();
    $.each($form.serializeArray(), function(i, v) {
        addVal(v.name, v.value);
    });
    // Handle <input type=file>.  Use HTML JSON form-style objects, but
    // with Blob instead of base64 encoding to represent the actual file.
    if (has_files) {
        $files.each(function() {
            var name = this.name, file, slice;
            if (!this.files || !this.files.length) {
                return;
            }
            for (var i = 0; i < this.files.length; i++) {
                file = this.files[i];
                slice = file.slice || file.webkitSlice;
                addVal(name, {
                    'type': file.type,
                    'name': file.name,
                    // Convert to blob for better serialization
                    'body': slice.call(file, 0, file.size, file.type)
                });
            }
        });
    }
    // Handle Cordova files
    if (app['native']) {
        $files = $form.find('input[data-wq-type=file]');
        // FIXME
    }

    if ($submitVal) {
        $submitVal.remove();
    }

    var options = {
        'url': url
    };
    if (outboxId) {
        options.id = outboxId;
        if (preserve && preserve.split) {
            options.preserve = preserve.split(/,/);
        }
    }
    if (url == conf.url + "/" || !conf.list) {
        options.method = "POST"; // REST API uses POST for new records
    } else {
        options.method = "PUT";  // .. but PUT to update existing records
    }

    options.modelConf = conf;
    $form.find('.error').html('');
    Promise.all([ds.get('csrf_token'), ready]).then(function(results) {
        options.csrftoken = results[0];
        outbox.save(vals, options, true).then(function(item) {
            if (backgroundSync) {
                // Send user to next screen while app syncs in background
                app.postsave(item, true);
				if (backgroundSync > 0) {
					app.sync();
				}
                return;
            }

            // Submit form immediately and wait for server to respond
            spin.start();
            outbox.sendItem(item, true).then(function(item) {
                spin.stop();
                if (!item || item.synced) {
                    // Item was synced
                    app.postsave(item, false);
                    return;
                }
                // Something went wrong
                var error;
                if (!item.error) {
                    // Save failed without server error: probably offline
                    error = app.OFFLINE;
                } else if (typeof(item.error) === 'string') {
                    // Save failed and error information is not in JSON format
                    // (likely a 500 server failure)
                    error = app.FAILURE;
                } else {
                    // Save failed and error information is in JSON format
                    // (likely a 400 bad data error)
                    error = app.ERROR;
                }
                app.saveerror(item, error, $form);
            });
        });
    });
}

app.showOutboxErrors = function(item, $page) {
    if (!item.error) {
        showError("Error saving data.");
        return;
    } else if (typeof(item.error) === 'string') {
        showError(item.error);
        return;
    }
    // Save failed and error information is in JSON format
    // (likely a 400 bad data error)
    var errs = Object.keys(item.error);

    if (errs.length == 1 && errs[0] == 'detail') {
        // General API errors have a single "detail" attribute
        showError(item.error.detail);
    } else {
        // REST API provided per-field error information

        // Form errors (other than non_field_errors) are keyed by fieldname
        for (var f in item.error) {
            // FIXME: there may be multiple errors per field
            var err = item.error[f][0];
            if (f == 'non_field_errors') {
                showError(err);
            } else {
                showError(err, f);
            }
        }
        if (!item.error.non_field_errors) {
            showError('One or more errors were found.');
        }
    }

    function showError(err, field) {
        if (field) {
            field = field + '-';
        } else {
            field = '';
        }
        var sel = '.' + item.options.modelConf.name + '-' + field + 'errors';
        $page.find(sel).html(err);
    }
};

// Remember which submit button was clicked (and its value)
function _submitClick() {
    var $button = $(this),
        $form = $(this.form),
        name = $button.attr('name'),
        value = $button.attr('value');
    if (name !== undefined && value !== undefined) {
        $form.data('wq-submit-button-name', name);
        $form.data('wq-submit-button-value', value);
    }
}


// Successful results from REST API contain the newly saved object
function _updateModels(item, result) {
    var modelConf = item.options.modelConf;
    if (modelConf.list && item.synced) {
        // Extract any nested attachment arrays and update related models
        var res = $.extend({}, result);
        var results = Object.keys(app.attachmentTypes).map(function(aname) {
            var info = app.attachmentTypes[aname];
            var aconf = _getConf(aname, true);
            if (!aconf || !modelConf[info.predicate] || !res[aconf.url]) {
                return Promise.resolve();
            }
            var attachments = res[aconf.url];
            attachments.forEach(function(a) {
                a[modelConf.name + '_id'] = res.id;
            });
            delete res[aconf.url];
            return app.models[aname].update(attachments);
        });

        // Update primary model
        return Promise.all(results).then(function() {
            app.models[modelConf.name].update([res]);
        });
    } else if (app.can_login && result && result.user && result.config) {
        return _saveLogin(result);
    }
}


function _saveLogin(result) {
    var config = result.config,
        user = result.user,
        csrftoken = result.csrftoken;
    if (!app.can_login) {
        return;
    }
    app.wq_config = config;
    tmpl.setDefault('wq_config', config);
    app.user = user;
    tmpl.setDefault('user', user);
    tmpl.setDefault('is_authenticated', true);
    return Promise.all([
        ds.set('/config', config),
        ds.set('user', user),
        _setCSRFToken(csrftoken)
    ]).then(function() {
        $('body').trigger('login');
    });
}

function _checkLogin() {
    if (!app.can_login) {
        return;
    }
    setTimeout(function() {
        ds.fetch('/login').then(function(result) {
            if (result && result.user && result.config) {
                _saveLogin(result);
            } else if (result && app.user) {
                app.logout();
            } else if (result && result.csrftoken) {
                _setCSRFToken(result.csrftoken);
            }
        });
    }, 10);
}

// Add various callback functions to context object to automate foreign key
// lookups within templates
function _addLookups(page, context, editable) {
    var conf = _getConf(page);
    var lookups = {};
    var field;
    if (conf.choices) {
        for (field in conf.choices) {
            lookups[field + '_label'] = _choice_label_lookup(
                field, conf.choices[field]
            );
            if (editable) {
                lookups[field + '_choices'] = _choice_dropdown_lookup(
                    field, conf.choices[field]
                );
            }
        }
    }
    // Foreign key lookups
    var parents = app.getParents(page);
    for (var ppage in parents) {
        parents[ppage].forEach(_addParentLookup);
    }
    function _addParentLookup(col) {
        var pconf;
        lookups[col] = _parent_lookup(ppage, col + '_id', context);
        if (editable) {
            pconf = _getConf(ppage);
            lookups[col + '_list'] = _parent_dropdown_lookup(
                page, ppage, col + '_id', context
            );
        }
    }
    (conf.children || []).forEach(function(v) {
        var cconf = _getConf(v);
        lookups[cconf.url] = _children_lookup(page, v, context);
    });

    // Load annotations and identifiers
    for (var aname in app.attachmentTypes) {
        var info = app.attachmentTypes[aname];
        var aconf = _getConf(aname, true);
        if (!aconf || !conf[info.predicate]) {
            continue;
        }

        if (info.type) {
            lookups[info.type] = _this_parent_lookup(
                info.type, info.typeColumn || 'type_id', context
            );
        }
        if (editable) {
            if (aconf.choices) {
                for (field in aconf.choices) {
                    lookups[field + '_choices'] = _choice_dropdown_lookup(
                        field, aconf.choices[field]
                    );
                }
            }
            if (info.getChoiceList) {
                lookups.item_choices = _item_choice_lookup(
                    page, aname, context
                );
            }
        }
        if (editable == "new") {
            lookups[aconf.url] = _default_attachments(page, aname, context);
        } else {
            lookups[aconf.url] = _children_lookup(page, aname, context);
        }
    }

    // Process lookup functions
    spin.start();
    var keys = Object.keys(lookups);
    var queue = keys.map(function(key) {
        return lookups[key];
    });
    return Promise.all(queue).then(function(results) {
        results.forEach(function(result, i) {
            var key = keys[i];
            context[key] = result;
        });
        spin.stop();
        return context;
    });
}

// Preset list of choices
function _choice_label_lookup(name, choices) {
    function choiceLabel() {
        if (!this[name]) {
            return;
        }
        var label;
        choices.forEach(function(choice) {
            if (choice.value == this[name]) {
                label = choice.label;
            }
        }, this);
        return label;
    }
    return Promise.resolve(choiceLabel);
}

function _choice_dropdown_lookup(name, choices) {
    choices = choices.map(function(choice) {
        return $.extend({}, choice);
    });
    function choiceDropdown() {
        choices.forEach(function(choice) {
            if (choice.value == this[name]) {
                choice.selected = true;
            } else {
                choice.selected = false;
            }
        }, this);
        return choices;
    }
    return Promise.resolve(choiceDropdown);
}

function _item_choice_lookup(page, aname, context) {
    var info = app.attachmentTypes[aname];
    var tmodel = app.models[info.type];
    var tfilter = info.getTypeFilter(page, context);
    return tmodel.filter(tfilter).then(function(types) {
        if (!types.length) {
            return [];
        }
        var queue = types.map(function(type) {
            var lname = info.getChoiceList(type, context);
            var lmodel = app.models[lname];
            var lfilter = info.getChoiceListFilter(type, context);
            return lmodel.filter(lfilter).then(function(items) {
                items = items.map(function(item) {
                    return $.extend({}, item);
                });
                return function() {
                    items.forEach(function(item) {
                        if (item.id == this.item_id) {
                            item.selected = true;
                        } else {
                            item.selected = false;
                        }
                    }, this);
                    return items;
                };
            });
        });
        return Promise.all(queue).then(function(results) {
            var listLookup = {};
            results.forEach(function(fn, i) {
                listLookup[types[i].id] = fn;
            });
            return function() {
                if (this.type_id) {
                    return listLookup[this.type_id].call(this);
                }
            };
        });
    });
}

// Simple foreign key lookup
function _parent_lookup(page, column, context) {
    var model = app.models[page];
    return model.find(context[column]);
}

// Foreign key lookup for objects other than root
function _this_parent_lookup(page, column) {
    var model = app.models[page];
    return model.getIndex('id').then(function(index) {
        return function() {
            return index[this[column]];
        };
    });
}

// List of all potential foreign key values (useful for generating dropdowns)
function _parent_dropdown_lookup(cpage, ppage, column, context) {
    var model = app.models[ppage];
    var result;
    if (app.parentFilters[column]) {
        result = model.filter(
            app.parentFilters[column](ppage, cpage, context)
        );
    } else {
        result = model.load().then(function(data) {
            return data.list;
        });
    }
    return result.then(function(choices) {
        return function() {
            var parents = [];
            choices.forEach(function(v) {
                var item = $.extend({}, v);
                if (item.id == this[column]) {
                    item.selected = true; // Currently selected item
                }
                parents.push(item);
            }, this);
            return parents;
        };
    });
}

// List of objects with a foreign key pointing to this one
function _children_lookup(ppage, cpage, context) {
    var filter = {};
    var model = app.models[cpage];

    // FIXME: handle alternative names for FKs
    filter[ppage + '_id'] = context.id;

    return model.filter(filter).then(function(data) {
        var result = [];
        data.forEach(function(item, i) {
            item = $.extend({}, item);
            item['@index'] = i;
            result[i] = item;
        });
        return result;
    });
}

// List of empty annotations for new objects
function _default_attachments(ppage, apage, context) {
    var info = app.attachmentTypes[apage];
    if (!info.type) {
        return Promise.resolve([]);
    }

    var model = app.models[info.type];
    var filter = info.getTypeFilter(ppage, context);
    return model.filter(filter).then(function(types) {
        var attachments = [];
        types.forEach(function(t, i) {
            var obj = {};
            if (info.getDefaults) {
                obj = info.getDefaults(t, context);
            }
            obj.type_id = t.id;
            obj['@index'] = i;
            attachments.push(obj);
        });
        return attachments;
    });
}

// Load configuration based on page id
function _getConf(page, silentFail) {
    var conf = app.wq_config.pages[page];
    if (!conf) {
        if (silentFail) {
            return;
        } else {
            throw 'Configuration for "' + page + '" not found!';
        }
    }
    return $.extend({'page': page}, conf);
}

// Helper to load configuration based on URL
function _getConfByUrl(url) {
    var parts = url.split('/');
    var conf;
    for (var p in app.wq_config.pages) {
        if (app.wq_config.pages[p].url == parts[0]) {
            conf = app.wq_config.pages[p];
        }
    }
    if (!conf) {
        throw 'Configuration for "/' + url + '" not found!';
    }
    return conf;
}

function _loadFromServer(url, ui) {
    var jqmurl = '/' + url, options = ui && ui.options || {};
    options.wqSkip = true;
    if (app.config.debug) {
        console.log("Loading " + url + " from server");
    }
    return Promise.resolve(jqm.changePage(jqmurl, options));
}

function _fetchFail(query, error) {
    /* jshint unused: false */
    spin.start("Error Loading Data", 1.5, {
        "theme": jqm.pageLoadErrorMessageTheme,
        "textonly": true
    });
}

return app;

});
