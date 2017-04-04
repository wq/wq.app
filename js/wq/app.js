/*!
 * wq.app 1.0.0-dev - wq/app.js
 * Utilizes store and pages to dynamically load and render
 * content from a wq.db-compatible REST service
 * (c) 2012-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', 'jquery.mobile', 'json-forms',
        './store', './model', './outbox', './router', './template',
        './spinner', './console'],
function($, jqm, jsonforms, ds, model, outbox, router, tmpl, spin, console) {

var app = {
    'OFFLINE': 'offline',
    'FAILURE': 'failure',
    'ERROR': 'error'
};

app.models = {};
app.plugins = {};

var _saveTransition = "none",
    _register = {},
    _onShow = {};

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
    // Default (as of 1.0) is to load JSON and render on client.
    config.loadMissingAsJson = (
        config.loadMissingAsJson || !config.loadMissingAsHtml
    );
    config.loadMissingAsHtml = !config.loadMissingAsJson;

    // After a form submission, sync in the background, or wait before
    // continuing?  Default (as of 0.8) is to sync in the background.
    config.backgroundSync = (
        config.backgroundSync || !config.noBackgroundSync
    );
    config.noBackgroundSync = !config.backgroundSync;

    app.config = config;
    app.wq_config = config;

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
    tmpl.setDefault('wq_config', app.wq_config);
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
        'postsync'
    ].forEach(function(hook) {
        if (config[hook]) {
            app[hook] = config[hook];
        }
    });

    // Initialize authentication, if applicable
    var ready;
    if (app.can_login) {
        router.register('logout\/?', app.logout);

        // Load some values from store - not ready till this is done.
        ready = ds.get(['user', 'csrf_token']).then(function(values) {
            var user = values[0];
            var csrfReady = _setCSRFToken(values[1]);
            if (!user) {
                return csrfReady;
            }
            app.user = user;
            tmpl.setDefault('user', user);
            tmpl.setDefault('is_authenticated', true);
            return ds.get('/config').then(function(wq_config) {
                app.wq_config = wq_config;
                tmpl.setDefault('wq_config', app.wq_config);
                $('body').trigger('login');
                return csrfReady;
            });
        });
        ready = ready.then(_checkLogin);
    } else {
        ready = ds.ready;
    }
    ready = ready.then(function() {
        return outbox.unsynced().then(function(unsynced) {
            tmpl.setDefault('unsynced', unsynced);
        });
    });

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

    Object.keys(app.wq_config.pages).forEach(function(page) {
        app.wq_config.pages[page].name = page;
    });

    _callPlugins('init', app.config);

    // Register routes with wq/router.js
    var root = false;
    Object.keys(app.wq_config.pages).forEach(function(page) {
        var conf = _getConf(page);
        if (!conf.url) {
            root = true;
        }
        if (conf.list) {
            conf.modes.forEach(function(mode) {
                var register = _register[mode] || _register.detail;
                var onShow = _onShow[mode] || _onShow.detail;
                register(page, mode);
                onShow(page, mode);
            });
            (conf.server_modes || []).forEach(function(mode) {
                var onShow = _onShow[mode] || _onShow.detail;
                onShow(page, mode);
            });
            app.models[page] = model(conf);
        } else if (conf) {
            if (!conf.server_only) {
                _registerOther(page);
            }
            _onShowOther(page);
        }
    });

    // Register outbox
    router.register('outbox', _outboxList);
    router.register('outbox/', _outboxList);
    router.register('outbox/<slug>', _renderOutboxItem('detail'));
    router.register('outbox/<slug>/edit', _renderOutboxItem('edit'));
    router.addRoute('outbox/<slug>', 's', _showOutboxItem('detail'));
    router.addRoute('outbox/<slug>/edit', 's', _showOutboxItem('edit'));

    // Fallback index page
    if (!root && !app.wq_config.pages.index &&
            config.template.templates.index) {
        router.register('', function(match, ui) {
            var context = {};
            context.pages = Object.keys(app.wq_config.pages).map(
                function(page) {
                    var conf = app.wq_config.pages[page];
                    return {
                        'name': page,
                        'url': conf.url,
                        'list': conf.list
                    };
                }
            );
            router.go('', 'index', context, ui);
        });
    }

    // Handle form events
    $(document).on('submit', 'form', _handleForm);
    $(document).on('click', 'form [type=submit]', _submitClick);

    if (app.config.jqmInit) {
        ready = ready.then(app.jqmInit);
    }

    return ready;
};

var pcount = 0;
app.use = function(plugin) {
    pcount++;
    if (!plugin.name) {
        plugin.name = 'plugin' + pcount;
    }
    app.plugins[plugin.name] = plugin;
    plugin.app = app;
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
    app.wq_config = app.config;
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
app.go = function(page, ui, params, itemid, mode, url, context) {
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
                itemid, {}, page, ui, params, mode, url, context
            );
        } else {
            var localOnly = !app.config.loadMissingAsJson;
            return model.find(itemid, 'id', localOnly).then(function(item) {
                _displayItem(
                    itemid, item, page, ui, params, mode, url, context
                );
            });
        }
    } else {
        return _displayList(page, ui, params, url, context);
    }

};

// Run any/all plugins on the specified page
app.runPlugins = function(page, mode, itemid, url, parentInfo) {
    var lastRoute = router.info,
        context = lastRoute.context,
        routeInfo, getItem;
    routeInfo = _getRouteInfo(
        page, mode, itemid,
        url.replace(app.base_url + '/', ''),
        parentInfo
    );
    if (itemid) {
        if (lastRoute.path == routeInfo.path && context &&
                (context.id || 'new') == itemid) {
            getItem = Promise.resolve(context);
            if (context.outbox_id) {
                routeInfo.outbox_id = context.outbox_id;
            }
        } else {
            getItem = app.models[page].find(itemid);
        }
    } else {
        getItem = Promise.resolve({});
    }
    getItem.then(function(item) {
        routeInfo.item = item;
        if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
            window.MSApp.execUnsafeLocalFunction(function() {
                _callPlugins('run', undefined, [jqm.activePage, routeInfo]);
            });
        } else {
            _callPlugins('run', undefined, [jqm.activePage, routeInfo]);
        }
    });
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

app.emptyOutbox = function(confirmFirst) {
    /* global confirm */
    if (confirmFirst) {
        if (navigator.notification && navigator.notification.confirm) {
            navigator.notification.confirm('Empty Outbox?', function(button) {
                if (button == 1) {
                    app.emptyOutbox();
                }
            });
            return;
        } else {
            if (!confirm('Empty Outbox?')) {
                return;
            }
        }
    }
    return outbox.model.overwrite([]).then(function() {
        app.syncRefresh([null]);
    });
};

app.confirmSubmit = function(form, message) {
    /* global confirm */
    var $form;
    if (navigator.notification && navigator.notification.confirm) {
        $form = $(form);
        if ($form.data('wq-confirm-submit')) {
            return true;
        }
        navigator.notification.confirm(message, function(button) {
            if (button == 1) {
                $form.data('wq-confirm-submit', true);
                $form.trigger('submit');
            }
        });
    } else {
        if (confirm(message)) {
            return true;
        }
    }
    return false;
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
    if (item.deletedId) {
        postsave = modelConf.postdelete || modelConf.postsave;
    } else {
        postsave = modelConf.postsave;
    }
    if (!postsave) {
        // Otherwise, default is to return the page for the item just saved
        if (backgroundSync || item.deletedId) {
            // If backgroundSync, return to list view while syncing
            postsave = modelConf.name + '_list';
        } else {
            // If noBackgroundSync, return to the newly synced item
            postsave = modelConf.name + '_detail';
        }
    }

    // conf.postsave should explicitly indicate which template mode to use
    match = postsave.match(/^([^\/]+)_([^_\/]+)$/);
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
        var urlContext;
        if (item.deletedId) {
            urlContext = {'deleted': true};
        } else {
            urlContext = item.result || item.data;
        }
        url = app.base_url + '/' + tmpl.render(postsave, urlContext);
    } else if (!pconf.list) {
        url = app.base_url + '/' + pconf.url;
    } else {
        if (pconf.modes.indexOf(mode) == -1) {
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
            if (mode != "detail") {
                url += "/" + mode;
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
    if (!items.length || !jqm.activePage.data('wq-sync-refresh')) {
        return;
    }
    outbox.unsynced().then(function(unsynced) {
        tmpl.setDefault('unsynced', unsynced);
        app.refresh();
    });
};

// Return a list of all foreign key fields
app.getParents = function(page) {
    var conf = _getConf(page);
    return conf.form.filter(function(field) {
        return field['wq:ForeignKey'];
    }).map(function(field) {
        return field['wq:ForeignKey'];
    });
};

// Shortcuts for $.mobile.changePage
app.nav = function(url, options) {
    url = app.base_url + '/' + url;
    if (!options) {
        options = {};
    }
    options.allowSamePageTransition = true;
    jqm.changePage(url, options);
};

app.replaceState = function(url) {
    app.nav(url, {
        'transition': 'none',
        'changeHash': false
    });
    setTimeout(function() {
        window.history.replaceState(null, '', app.base_url + '/' + url);
        var hist = jqm.navigate.history;
        hist.stack = [hist.stack[hist.stack.length - 1]];
        hist.activeIndex = 0;
    }, 300);
};

app.refresh = function() {
    jqm.changePage(jqm.activePage.data('url'), {
        'transition': 'none',
        'allowSamePageTransition': true
    });
};

// Internal variables and functions
function _setCSRFToken(csrftoken) {
    outbox.setCSRFToken(csrftoken);
    tmpl.setDefault('csrf_token', csrftoken);
    return ds.set('csrf_token', csrftoken);
}

function _callPlugins(method, lookup, args) {
    var plugin, fn, fnArgs, queue = [];
    for (plugin in app.plugins) {
        fn = app.plugins[plugin][method];
        if (args) {
            fnArgs = args;
        } else if (lookup) {
            fnArgs = [lookup[plugin]];
        }
        if (fn) {
            queue.push(fn.apply(app.plugins[plugin], fnArgs));
        }
    }
    return queue;
}

function _getRouteInfo(page, mode, itemid, url, parentInfo) {
    var conf = _getConf(page);
    router.setPath(url);
    return $.extend(
        parentInfo || {},
        router.info,
        {
            'page': page,
            'page_config': conf,
            'mode': mode,
            'item_id': itemid
        }
    );
}

// Generate list view context and render with [url]_list template;
// handles requests for [url] and [url]/
_register.list = function(page) {
    var conf = _getConf(page);
    router.register(conf.url, go);
    router.register(conf.url + '/', go);
    function go(match, ui, params) {
        app.go(page, ui, params);
    }

    // Special handling for /[parent_list_url]/[parent_id]/[url]
    app.getParents(page).forEach(function(ppage) {
        var pconf = _getConf(ppage);
        var url = pconf.url;
        if (url) {
            url += '/';
        }
        url += '<slug>/' + conf.url;
        router.register(url, goUrl(ppage, url));
        router.register(url + '/', goUrl(ppage, url));
    });
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
};

_onShow.list = function(page) {
    var conf = _getConf(page);
    var url = conf.url ? conf.url + '/?' : '';
    router.addRoute(url, 's', function(match) {
        app.runPlugins(page, 'list', null, match[0]);
    });

    // Special handling for /[parent_list_url]/[parent_id]/[url]
    app.getParents(page).forEach(function(ppage) {
        var pconf = app.config.pages[ppage];
        var purl = pconf.url;
        if (purl) {
            purl += '/';
        }
        purl = '(' + purl + ')<slug>/' + conf.url;
        router.addRoute(purl + '/?', 's', goUrl(ppage));
    });

    function goUrl(ppage) {
        return function(match) {
            var parentInfo = {
                'parent_id': match[2],
                'parent_url': match[1] + match[2],
                'parent_page': ppage
            };
            app.runPlugins(page, 'list', null, match[0], parentInfo);
        };
    }
};

function _displayList(page, ui, params, url, context) {
    spin.stop();

    var conf = _getConf(page);
    var model = app.models[page];
    var pnum = model.opts.page, next = null, prev = null, filter;
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
        }
        filter = {};
        for (var key in params || {}) {
            if (key != 'page') {
                filter[key] = params[key];
            }
        }
        if (context && context.parent_page) {
            conf.form.forEach(function(field) {
                if (field['wq:ForeignKey'] == context.parent_page) {
                    filter[field.name + '_id'] = context.parent_id;
                }
            });
        }
    }
    if (filter && !Object.keys(filter).length) {
        filter = null;
    }

    // Load from server if data might not exist locally
    if (app.config.loadMissingAsHtml) {
        if (!model.opts.client) {
            return _loadFromServer(url, ui);
        }
        if (filter && model.opts.server) {
            return _loadFromServer(url, ui);
        }
        if (pnum > model.opts.page) {
            return _loadFromServer(url, ui);
        }
    }

    var result1;
    if (!pnum && !model.opts.client) {
        pnum = 1;
    }
    if (filter) {
        result1 = model.filterPage(filter);
    } else if (pnum > model.opts.page) {
        result1 = model.page(pnum);
    } else {
        result1 = model.load();
    }
    var result2;
    if (pnum == model.opts.page || (pnum == 1 && !model.opts.client)) {
        result2 = model.unsyncedItems();
    } else {
        result2 = [];
    }
    return Promise.all([result1, result2]).then(function(results) {
        var data = results[0],
            unsyncedItems = results[1],
            parentInfo = {}, routeInfo,
            prevIsLocal, currentIsLocal;
        ['parent_id', 'parent_url', 'parent_page'].forEach(function(key) {
            if (context && context[key]) {
                parentInfo[key] = context[key];
            }
        });

        routeInfo = _getRouteInfo(page, 'list', null, url, parentInfo);
        if (pnum > model.opts.page && (model.opts.client || pnum > 1)) {
            prev = conf.url + '/';
            if (+pnum - 1 > model.opts.page &&
                   (model.opts.client || pnum > 2)) {
                prev += '?' + $.param({
                    'page': +pnum - 1
                });
            } else if (pnum == 1) {
                prevIsLocal = true;
            }
        }

        if (pnum < data.pages && (model.opts.server || pnum)) {
            var nextp = {'page': +pnum + 1};
            next = conf.url + '/?' + $.param(nextp);
            if (nextp.page == 1) {
                currentIsLocal = true;
            }
        }

        context = $.extend({'page_config': conf}, data, {
            'previous': prev ? '/' + prev : null,
            'next':     next ? '/' + next : null,
            'multiple': model.opts.server && data.pages > model.opts.page,
            'previous_is_local': prevIsLocal,
            'current_is_local': currentIsLocal
        }, context);

        // Add any outbox items to context
        context.unsynced = unsyncedItems.length;
        context.unsyncedItems = unsyncedItems;

        return _addLookups(page, context, false, routeInfo).then(
            function(context) {
                return router.go(
                    url, page + '_list', context, ui, conf.once ? true : false
                );
            }
        );
    });
}

// Generate item detail view context and render with [url]_detail template;
// handles requests for [url]/[id]
_register.detail = function(page, mode) {
    var conf = _getConf(page);
    var url = _getDetailUrl(conf.url, mode);
    var reserved = _getDetailReserved(conf.url);
    router.register(url, function(match, ui, params) {
        if (reserved.indexOf(match[1]) > -1) {
            return;
        }
        app.go(page, ui, params, match[1], mode);
    });
};

// Register an onshow event for item detail views
_onShow.detail = function(page, mode) {
    var conf = _getConf(page);
    var url = _getDetailUrl(conf.url, mode);
    var reserved = _getDetailReserved(conf.url);
    router.addRoute(url, 's', function(match) {
        if (reserved.indexOf(match[1]) > -1) {
            return;
        }
        app.runPlugins(page, mode, match[1], match[0]);
    });
};

function _getDetailUrl(url, mode) {
    if (url) {
        url += "/";
    }
    url += '<slug>';
    if (mode != 'detail') {
        url += '/' + mode;
    }
    return url;
}

function _getDetailReserved(url) {
    var reserved = ["new"];
    if (!url) {
        // This list is bound to root URL, don't mistake other lists for items
        for (var key in app.wq_config.pages) {
            reserved.push(app.wq_config.pages[key].url);
        }
    }
    return reserved;
}

// Generate item edit context and render with [url]_edit template;
// handles requests for [url]/[id]/edit and [url]/new
_register.edit = function(page) {
    var conf = _getConf(page);
    router.register(conf.url + '/<slug>/edit', go);
    router.register(conf.url + '/(new)', go);
    function go(match, ui, params) {
        app.go(page, ui, params, match[1], 'edit');
    }
};

// Register an onshow event for item edit views
_onShow.edit = function(page) {
    var conf = _getConf(page);
    var url = conf.url ? conf.url + '/' : '';
    router.addRoute(url + '<slug>/edit', 's', go);
    router.addRoute(url + '(new)', 's', go);
    function go(match) {
        var itemid = match[1];
        app.runPlugins(page, 'edit', itemid, match[0]);
    }
};

function _displayItem(itemid, item, page, ui, params, mode, url, context) {
    var conf = _getConf(page);
    var model = app.models[page];
    spin.stop();
    if (url === undefined) {
        url = conf.url;
        if (url) {
            url += '/';
        }
        url += itemid;
        if (mode != 'detail' && itemid != 'new') {
            url += '/' + mode;
        }
        if (params && $.param(params)) {
            url += '?' + $.param(params);
        }
    }
    if (item) {
        if (mode == 'edit') {
            return _renderEdit(itemid, item, page, ui, params, url, context);
        } else {
            return _renderDetail(item, page, mode, ui, params, url, context);
        }
    } else {
        if (model.opts.server && app.config.loadMissingAsHtml) {
            // opts.server indicates that the local list does not represent
            // the entire dataset; if an item is not found, attempt to load
            // HTML directly from the server (using built-in jQM loader)
            return _loadFromServer(url, ui);
        } else {
            // If opts.server is false, locally stored list is assumed to
            // contain the entire dataset, so the item probably does not exist.
            return router.notFound(url);
        }
    }
}

function _renderDetail(item, page, mode, ui, params, url, context) {
    var conf = _getConf(page),
        routeInfo = _getRouteInfo(page, mode, item.id || 'new', url, null);
    if (context && context.outbox_id) {
        routeInfo.outbox_id = context.outbox_id;
    }
    context = $.extend({'page_config': conf}, item, context);
    return _addLookups(page, context, false, routeInfo).then(
        function(context) {
            var divid = page + '_' + mode + '_' + (item.id || 'new') + '-page',
                template = page + '_' + mode,
                once = conf.once ? true : false;
            return router.go(url, template, context, ui, once, divid);
        }
    );
}

function _renderEdit(itemid, item, page, ui, params, url, context) {
    var conf = _getConf(page),
        routeInfo = _getRouteInfo(page, 'edit', itemid, url, null);
    if (context && context.outbox_id) {
        routeInfo.outbox_id = context.outbox_id;
    }
    if (itemid == "new") {
        // Create new item
        context = $.extend(
            {'page_config': conf}, params, conf.defaults, context
        );
        return _addLookups(page, context, "new", routeInfo).then(done);
    } else {
        // Edit existing item
        context = $.extend({'page_config': conf}, item, context);
        return _addLookups(page, context, true, routeInfo).then(done);
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

// Register an onshow event for non-list single pages
function _onShowOther(page) {
    var conf = _getConf(page);
    router.addRoute(conf.url + '/?', 's', function(match) {
        app.runPlugins(page, null, null, match[0]);
    });
}

function _renderOther(page, ui, params, url, context) {
    var conf = _getConf(page),
        routeInfo;
    if (url === undefined) {
        url = conf.url;
    }
    if (params && $.param(params)) {
        url += "?" + $.param(params);
    }
    context = $.extend({'page_config': conf}, context);
    routeInfo = _getRouteInfo(
        page, null, null, url, null
    );
    Promise.all(_callPlugins(
        'context', undefined, [context, routeInfo]
    )).then(function(pluginContext) {
        pluginContext.forEach(function(pc) {
            $.extend(context, pc);
        });
        router.go(url, page, context, ui, conf.once ? true : false);
    });
}

function _parseJsonForm(item) {
    var values = [], key;
    for (key in item.data) {
        values.push({
            'name': key,
            'value': item.data[key]
        });
    }
    item.data = jsonforms.convert(values);
    for (key in item.data) {
        if ($.isArray(item.data[key])) {
            item.data[key].forEach(function(row, i) {
                row['@index'] = i;
            });
        }
    }
}

function _outboxList(match, ui) {
    outbox.model.load().then(function(data) {
        data.list.forEach(_parseJsonForm);
        router.go('outbox', 'outbox', data, ui);
    });
}

function _renderOutboxItem(mode) {
    // Display outbox item using model-specific detail/edit view
    return function(match, ui, params) {
        outbox.model.find(match[1]).then(function(item) {
            _parseJsonForm(item);
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
            if (mode != 'detail') {
                url += '/' + mode;
            }
            var context = {
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
                 ui, params, mode, url, context
            ).then(function($page) {
                if (mode == 'edit' && item.error) {
                    app.showOutboxErrors(item, $page);
                }
            });
        });
    };
}

function _showOutboxItem(mode) {
    return function(match) {
        var context = router.info.context || {};
        if (context.outbox_id != match[1]) {
            return;
        }
        app.runPlugins(
            context.page_config.name,
            mode,
            context.id || 'new',
            match[0]
        );
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
    var url = $form.attr('action').replace(app.service + "/", "");
    var conf = _getConfByUrl(url);
    var vals = {};
    var $files = $form.find('input[type=file]');
    var has_files = false;
    $files.each(function(i, input) {
        if ($(input).val().length > 0) {
            has_files = true;
        }
    });
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
    // Handle blob-stored files created by (e.g.) wq/photos.js
    $form.find('input[data-wq-type=file]').each(function() {
         // wq/photo.js files are already in storage, copy over to form
         var name = this.name;
         var value = this.value;
         var curVal = $.isArray(vals[name]) ? vals[name][0] : vals[name];
         if (curVal && typeof curVal === "string") {
             delete vals[name];
         }
         if (!value) {
             return;
         }
         ready = ready.then(ds.get(value).then(function(data) {
             if (data) {
                 addVal(name, data);
                 return ds.set(value, null);
             }
         }));
    });

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
    if (vals._method) {
        options.method = vals._method;
        delete vals._method;
    } else {
        options.method = "POST";
    }

    options.modelConf = conf;

    if (conf.label_template) {
        options.label = tmpl.render(conf.label_template, vals);
    }

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
            $form.attr('data-wq-outbox-id', item.id);
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
    if ($page.is('form') && item.options.method == 'DELETE') {
        if (!$page.find('.error').length) {
            // Delete form does not contain error placeholders
            // but main form might
            $page = $page.parents('.ui-page');
        }
    }
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
        errs.forEach(function(f) {
            // FIXME: there may be multiple errors per field
            var err = item.error[f][0];
            if (f == 'non_field_errors') {
                showError(err);
            } else {
                if (typeof(err) !== 'object') {
                    showError(err, f);
                } else {
                    // Nested object errors (e.g. attachment)
                    item.error[f].forEach(function(err, i) {
                        for (var n in err) {
                            var fid = f + '-' + i + '-' + n;
                            showError(err[n][0], fid);
                        }
                    });
                }
            }
        });
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
        model = app.models[modelConf.name];
        if (item.deletedId) {
            return model.remove(item.deletedId);
        } else {
            return model.update([result]).then(function() {
                return Promise.all(_callPlugins(
                    'onsave', undefined, [item, result]
                ));
            });
        }
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
function _addLookups(page, context, editable, routeInfo) {
    var conf = _getConf(page);
    var lookups = {};

    function addLookups(field, nested) {
        var fname = nested || field.name;
        // Choice (select/radio) lookups
        if (field.choices) {
            lookups[fname + '_label'] = _choice_label_lookup(
                field.name, field.choices
            );
            if (editable) {
                lookups[fname + '_choices'] = _choice_dropdown_lookup(
                    field.name, field.choices
                );
            }
        }

        // Foreign key lookups
        if (field['wq:ForeignKey']) {
            var nkey;
            if (nested) {
                nkey = fname.match(/^\w+\.(\w+)\[(\w+)\]$/);
            } else {
                nkey = fname.match(/^(\w+)\[(\w+)\]$/);
            }
            if (!nkey) {
                if (nested) {
                    lookups[fname] = _this_parent_lookup(field);
                } else {
                    lookups[fname] = _parent_lookup(field, context);
                }
                if (!context[fname + '_label']) {
                    lookups[fname + '_label'] = _parent_label_lookup(field);
                }
            }
            if (editable) {
                lookups[fname + '_list'] = _parent_dropdown_lookup(
                    field, context, nkey
                );
            }
        }

        // Load types/initial list of nested forms
        // (i.e. repeats/attachments/EAV/child model)
        if (field.children) {
            field.children.forEach(function(child) {
                var fname = field.name + '.' + child.name;
                addLookups(child, fname);
            });
            if (editable == "new" && !context[field.name]) {
                lookups[field.name] = _default_attachments(field, context);
            }
        }
    }
    conf.form.forEach(function(field) {
        addLookups(field, false);
    });

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
        results.forEach(function(result, i) {
            var parts = keys[i].split('.'), nested;
            if (parts.length != 2) {
                return;
            }
            nested = context[parts[0]];
            if (!nested) {
                return;
            }
            if (!$.isArray(nested)) {
                nested = [nested];
            }
            nested.forEach(function(row) {
                row[parts[1]] = row[parts[1]] || result;
            });
        });
        return Promise.all(_callPlugins(
            'context', undefined, [context, routeInfo]
        ));
    }).then(function(pluginContext) {
        pluginContext.forEach(function(pc) {
            $.extend(context, pc);
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
            if (choice.name == this[name]) {
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
            if (choice.name == this[name]) {
                choice.selected = true;
            } else {
                choice.selected = false;
            }
        }, this);
        return choices;
    }
    return Promise.resolve(choiceDropdown);
}

/* jshint ignore:start */
function _item_choice_lookup(page, field, context) {
    // FIXME: restore this for e.g. relate pattern
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
/* jshint ignore:end */

// Simple foreign key lookup
function _parent_lookup(field, context) {
    var model = app.models[field['wq:ForeignKey']];
    var id = context[field.name + '_id'];
    if (id) {
        if (id.match && id.match(/^outbox/)) {
            return _getOutboxRecord(model, id);
        } else {
            return model.find(id);
        }
    } else {
        return null;
    }
}

// Foreign key lookup for objects other than root
function _this_parent_lookup(field) {
    var model = app.models[field['wq:ForeignKey']];
    return Promise.all([
        _getOutboxRecordLookup(model),
        model.getIndex('id')
    ]).then(
        function(results) {
            return function() {
                var parentId = this[field.name + '_id'];
                return results[0][parentId] || results[1][parentId];
            };
        }
    );
}

// Foreign key label
function _parent_label_lookup(field) {
    return _this_parent_lookup(field).then(function(lookup) {
        return function() {
            var p = lookup.call(this);
            return p && p.label;
        };
    });
}

// List of all potential foreign key values (useful for generating dropdowns)
function _parent_dropdown_lookup(field, context, nkey) {
    var model = app.models[field['wq:ForeignKey']];
    var result;
    if (field.filter) {
        result = model.filter(_computeFilter(field.filter, context));
    } else {
        result = model.load().then(function(data) {
            return _getOutboxRecords(model).then(function(records) {
                return records.concat(data.list);
            });
        });
    }
    return result.then(function(choices) {
        return function() {
            var parents = [], current;
            if (nkey) {
                current = this[nkey[1]] && this[nkey[1]][nkey[2]];
            } else {
                current = this[field.name + '_id'];
            }
            choices.forEach(function(v) {
                var item = $.extend({}, v);
                if (item.id == current) {
                    item.selected = true; // Currently selected item
                }
                parents.push(item);
            }, this);
            return parents;
        };
    });
}

function _getOutboxRecords(model) {
    return model.unsyncedItems().then(function(items) {
        return items.map(function(item) {
            var record = item.data;
            record.label = item.label;
            record.id = 'outbox-' + item.id;
            record.outbox_id = item.id;
            record.outbox = true;
            return record;
        });
    });
}

function _getOutboxRecordLookup(model) {
    return _getOutboxRecords(model).then(function(records) {
        var lookup = {};
        records.forEach(function(record) {
            lookup[record.id] = record;
        });
        return lookup;
    });
}

function _getOutboxRecord(model, id) {
    return _getOutboxRecordLookup(model).then(function(records) {
        return records[id];
    });
}

// List of empty annotations for new objects
function _default_attachments(field, context) {
    if (field.type != 'repeat') {
        return Promise.resolve({});
    }
    if (!field.initial) {
        return Promise.resolve([]);
    }
    if (typeof field.initial == 'string' || typeof field.initial == 'number') {
        var attachments = [];
        for (var i = 0; i < +field.initial; i++) {
            attachments.push({
                '@index': i,
                'new_attachment': true
            });
        }
        return Promise.resolve(attachments);
    }
    var typeField;
    field.children.forEach(function(tf) {
        if (tf.name == field.initial.type_field) {
            typeField = tf;
        }
    });
    if (!typeField) {
        return Promise.resolve([]);
    }

    var model = app.models[typeField['wq:ForeignKey']];
    var filterConf = field.initial.filter;
    if (!filterConf || !Object.keys(filterConf).length) {
        if (typeField.filter) {
            filterConf = typeField.filter;
        }
    }
    var filter = _computeFilter(filterConf, context);
    return model.filter(filter).then(function(types) {
        var attachments = [];
        types.forEach(function(t, i) {
            var obj = {
                '@index': i,
                'new_attachment': true
            };
            obj[typeField.name + '_id'] = t.id;
            obj[typeField.name + '_label'] = t.label;
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
    return $.extend({
        'page': page,
        'form': [],
        'modes': (conf.list ? ['list', 'detail', 'edit'] : [])
    }, conf);
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

function _computeFilter(filter, context) {
    var computedFilter = {};
    Object.keys(filter).forEach(function(key) {
        var values = filter[key];
        if (!$.isArray(values)) {
            values = [values];
        }
        values = values.map(function(value) {
            if (value && value.indexOf && value.indexOf('{{') > -1) {
                return tmpl.render(value, context);
            } else {
                return value;
            }
        });
        if (values.length > 1) {
            computedFilter[key] = values;
        } else {
            computedFilter[key] = values[0];
        }
    });
    return computedFilter;
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
