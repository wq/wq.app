/*!
 * wq.app 0.7.4 - wq/app.js
 * Utilizes store and pages to dynamically load and render
 * content from a wq.db-compatible REST service
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', 'jquery.mobile',
        './store', './pages', './template', './spinner', './console',
        'es5-shim'],
function($, jqm, ds, pages, tmpl, spin, console) {

var app = {
    'OFFLINE': 'offline',
    'FAILURE': 'failure',
    'ERROR': 'error'
};

app.init = function(config, templates, baseurl, svc) {
    if (baseurl === undefined)
        baseurl = '';
    if (svc === undefined)
        svc = baseurl;
    app.config = config;
    app.wq_config = {'pages': config.pages};

    app['native'] = !!window.cordova;
    app.can_login = !!config.pages.login;

    // Initialize wq/store.js
    var dsconf = config.store || {};
    if (config.debug)
        dsconf.debug = config.debug;
    if (!dsconf.applyResult)
        dsconf.applyResult = _applyResult;
    if (!dsconf.fetchFail)
        dsconf.fetchFail = _fetchFail;
    ds.init(svc, {'format': 'json'}, dsconf);
    app.service = ds.service;

    // Initialize wq/pages.js
    var pagesconf = {};
    if (config.debug)
        pagesconf.debug = config.debug;
    pages.init(baseurl, pagesconf);
    app.base_url = pages.info.base_url;

    // Initialize wq/template.js
    tmpl.init(templates, templates.partials, config.defaults);
    tmpl.setDefault('native', app['native']);
    tmpl.setDefault('app_config', app.config);

    // Option to submit forms in the background rather than wait for each post
    var seconds;
    if (config.backgroundSync) {
        seconds = config.backgroundSync;
        if (seconds === true)
            seconds = 30;
        app._syncInterval = setInterval(function() {
            app.sync();
        }, seconds * 1000);
    }

    // Option to override various hooks
    [
        'postsubmit',
        'postsave',
        'saveerror',
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
    if (app.can_login) {
        var user = ds.get('user');
        var csrftoken = ds.get('csrftoken');
        if (user) {
            app.user = user;
            tmpl.setDefault('user', user);
            tmpl.setDefault('is_authenticated', true);
            tmpl.setDefault('csrftoken', csrftoken);
            tmpl.setDefault('csrf_token', csrftoken);
            app.wq_config = ds.get({'url': 'config'});
            tmpl.setDefault('wq_config', app.wq_config);
            $('body').trigger('login');
        }
        _checkLogin();
        pages.register('logout\/?', app.logout);
    }

    // Configure jQuery Mobile transitions
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

    // Register routes with wq/pages.js
    for (var page in app.wq_config.pages) {
        var conf = _getConf(page);
        if (conf.list) {
            _registerList(page);
            _registerDetail(page);
            _registerEdit(page);
        } else if (conf) {
            _registerOther(page);
        }
    }

    // Handle form events
    $(document).on('submit', 'form', _handleForm);
    $(document).on('click', 'form [type=submit]', _submitClick);

    if (app.config.jqmInit) {
        app.jqmInit();
    }
};

app.jqmInit = pages.jqmInit;

app.logout = function() {
    if (!app.can_login)
        return;
    delete app.user;
    ds.set('user', null);
    tmpl.setDefault('user', null);
    tmpl.setDefault('is_authenticated', false);
    app.wq_config = {'pages': app.config.pages};
    tmpl.setDefault('wq_config', app.wq_config);
    ds.fetch({'url': 'logout'}, true, function(result) {
        tmpl.setDefault('csrftoken', result.csrftoken);
        tmpl.setDefault('csrf_token', result.csrftoken);
        ds.set('csrftoken', result.csrftoken);
    }, true);
    $('body').trigger('logout');
};

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

// Sync outbox and handle result
app.sync = function(retryAll) {
    if (app.syncing || !ds.unsaved())
        return;
    app.syncing = true;
    app.presync();
    ds.sendAll(function(result) {
        app.syncing = false;
        app.postsync(result);
    }, retryAll);
};

// Hooks for form submissions sent immediately (non-backgroundSync)

// Hook for handling navigation after server response to form submission
app.postsave = function(item, result, conf) {
    // Save was successful, redirect to next screen
    var options = {
        'reverse': true,
        'transition': _saveTransition,
        'allowSamePageTransition': true
    };
    var postsave, pconf, match, mode, url, itemid;

    // conf.postsave can be set redirect to another page
    postsave = conf.postsave;
    if (!postsave) {
        // Otherwise, default is to return the page for the item just saved
        postsave = conf.page;
    }

    // conf.postsave can explicitly indicate which template mode to use
    match = postsave.match(/^(.+)_([^_]+)$/);
    if (match) {
        postsave = match[1];
        mode = match[2];
        if (mode != 'list' && mode != 'detail' && mode != 'edit') {
            throw "Unknown template mode!";
        }
        // Otherwise, default is 'detail' for list pages (see below).
    }

    // Retrieve configuration for postsave page, if any
    pconf = _getConf(postsave, true);

    // Compute URL
    if (!pconf || !pconf.url || !pconf.list) {
        // If conf.postsave is not the name of a list page, assume it's a
        // simple page or a URL
        url = app.base_url + '/' + postsave;
    } else {
        // For list pages, the url can differ depending on the mode
        url = app.base_url + '/' + pconf.url + '/';

        // Default mode is to return to the detail view
        if (!mode) {
            mode = 'detail';
        }

        if (mode != 'list') {
            // Detail or edit view; determine item id and add to url

            // If postsave page is the same as the item's page, use the new id
            if (postsave == conf.page) {
                itemid = item.newid;
            } else {
                // Otherwise, look for a foreign key reference
                // FIXME: what if the foreign key has a different name?
                itemid = result[postsave + '_id'];
            }
            if (!itemid) {
                throw "Could not find " + postsave + " id in result!";
            }
            url += itemid;
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
app.saveerror = function(item, reason, conf) {
    /* jshint unused: false */
    // Save failed for some reason, perhaps due to being offline
    // (override to customize behavior, e.g. display an outbox)
    if (app.config.debug) {
        console.warn("Could not save: " + reason);
    }
};

// Hooks for background sync

// Hook for handling navigation after form submission with backgroundSync on
app.postsubmit = function(item, conf) {
    /* jshint unused: false */
    // (override to customize behavior, e.g. return to a list view)
};

// Hook for handling alerts before a background sync event
app.presync = function() {
    /* jshint unused: false */
    if (app.config.debug) {
        console.log("Syncing...");
    }
};

// Hook for handling alerts after a background sync event
app.postsync = function(result) {
    /* jshint unused: false */
    // Called after every sync with result from ds.sendAll().
    // (override to customize behavior, e.g. update a status icon)
    var msg;
    if (app.config.debug) {
        if (result) {
            console.log("Successfully synced.");
        } else {
            if (result === false)
                msg = "Sync error!";
            else
                msg = "Sync failed!";
            console.warn(msg + " " + ds.unsaved() + " items remain unsaved");
        }
    }
};

app.attachmentTypes = {
    annotation: {
        'predicate': 'annotated',
        'type': 'annotationtype',
        'getTypeFilter': function(page, context) {
            /* jshint unused: false */
            return {'for': page};
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

// Generate list view context and render with [url]_list template;
// handles requests for [url] and [url]/
function _registerList(page) {
    var conf = _getConf(page);
    pages.register(conf.url, go);
    pages.register(conf.url + '/', go);
    function go(match, ui, params) {
        app.go(page, ui, params);
    }

    // Special handling for /[parent_list_url]/[parent_id]/[url]
    for (var ppage in app.getParents(page)) {
        var pconf = _getConf(ppage);
        var url = pconf.url;
        if (url)
            url += '/';
        url += '<slug>/' + conf.url;
        pages.register(url, goUrl(ppage, url));
        pages.register(url + '/', goUrl(ppage, url));
    }
    function goUrl(ppage, url) {
        return function(match, ui, params) {
            var pconf = _getConf(ppage);
            var pageurl = url.replace('<slug>', match[1]);
            spin.start();
            ds.getList({'url': pconf.url}, function(plist) {
                spin.stop();
                var pitem = plist.find(match[1]);
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
            for (var ppage in app.getParents(page)) {
                // FIXME: leverage field name information (added in #16)
                var p = ppage;
                if (p.indexOf(page) === 0)
                    p = p.replace(page, '');
                if (filter[p]) {
                    filter[p + '_id'] = filter[p];
                    delete filter[p];
                } else if (context && context.parent_page == ppage) {
                    filter[p + '_id'] = context.parent_id;
                }
            }
        }
    }

    if (pnum > conf.max_local_pages || filter && conf.partial) {
        // Set max_local_pages to avoid filling up local storage and
        // instead attempt to load HTML directly from the server
        // (using built-in jQM loader)
        _loadFromServer(url, ui);
        return;
    }

    var data = filter ? list.filter(filter) : list.page(pnum);
    if (conf.partial && !data.length && list.info.count) {
        // No local filter, but list.page() just returned an empty dataset even
        // though list info indicates there is at least some data in the list.
        // Try loading from server.
        _loadFromServer(url, ui);
        return;
    }

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

    // Add any outbox items to context
    var unsavedItems = list.unsavedItems();
    context.unsaved = unsavedItems.length;
    context.unsavedItems = unsavedItems;

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
        // This list is bound to root URL, don't mistake other lists for items
        for (var key in app.wq_config.pages)
            reserved.push(app.wq_config.pages[key].url);
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
        if (params)
            url += '?' + $.param(params);
        if (conf.partial) {
            // conf.partial indicates that the local list does not represent
            // the entire dataset; if an item is not found, attempt to load
            // HTML directly from the server (using built-in jQM loader)
            _loadFromServer(url, ui);
        } else {
            // If conf.partial is not set, locally stored list is assumed to
            // contain the entire dataset, so the item probably does not exist.
            pages.notFound(url);
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
        if (url === undefined) {
            url = conf.url;
            if (url)
                url += '/';
            url += itemid + '/edit';
        }
        var item = list.find(
            itemid, undefined, undefined, conf.max_local_pages
        );
        if (!item) {
            // Not found locally (see notes in _renderDetail)
            if (params)
                url += '?' + $.param(params);
            if (conf.partial)
                _loadFromServer(url, ui);
            else
                pages.notFound(url);
            return;
        }
        context = $.extend({}, conf, params, item, context);
        _addLookups(page, context, true, done);
    } else {
        // Create new item
        context = $.extend({}, conf.defaults, conf, params, context);
        if (url === undefined) {
            url = conf.url;
            if (url)
                url += '/';
            url += 'new';
            if (params && $.param(params))
                url += '?' + $.param(params);
        }
        _addLookups(page, context, "new", done);
    }

    function done(context) {
        var divid = page + '_' + itemid + '-page';
        pages.go(
            url, page + '_edit', context, ui, false, divid
        );
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
    var $form = $(this), $submitVal, item, backgroundSync;
    if (evt.isDefaultPrevented())
        return;
    if ($form.data('submit-button-name')) {
        $submitVal = $("<input>")
           .attr("name", $form.data('submit-button-name'))
           .attr("value", $form.data('submit-button-value'));
        $form.append($submitVal);
    }
    if ($form.data('json') !== undefined && !$form.data('json'))
        return; // Defer to default (HTML-based) handler

    if ($form.data('background-sync') !== undefined)
        backgroundSync = $form.data('background-sync');
    else
        backgroundSync = app.config.backgroundSync;

    var outboxId = $form.data('outbox-id');
    var url = $form.attr('action').replace(app.base_url + "/", "");
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
    if ($submitVal) $submitVal.remove();

    vals.url = url;
    if (url == conf.url + "/" || !conf.list)
        vals.method = "POST"; // REST API uses POST for new records
    else
        vals.method = "PUT";  // .. but PUT to update existing records

    vals.listQuery = {'url': conf.url};
    vals.csrftoken = ds.get('csrftoken');

    $('.error').html('');
    outboxId = ds.save(vals, outboxId);
    item = ds.find('outbox', outboxId);
    if (backgroundSync) {
        app.postsubmit(item, conf);
        app.sync();
    } else {
        spin.start();
        ds.sendItem(outboxId, function(item, result) {
            spin.stop();
            _onSendItem(item, result, $form);
        });
    }
}

function _onSendItem(item, result, $form) {
    var conf = _getConfByUrl(item.listQuery.url);

    if (!item) {
        // Save failed, probably due to item being saved already
        return;
    }

    if (item.saved) {
        // Save succeeded
        app.postsave(item, result, conf);
        return;
    }

    if (!item.error) {
        // Save failed without server error: probably offline
        showError("Error saving data.");
        app.saveerror(item, app.OFFLINE, conf);
        return;
    }

    if (typeof(item.error) === 'string') {
        // Save failed and error information is not in JSON format
        // (likely a 500 server failure)
        showError(item.error);
        app.saveerror(item, app.FAILURE, conf);
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
            if (f == 'non_field_errors')
                showError(err);
            else
                showError(err, f);
        }
        if (!item.error.non_field_errors)
            showError('One or more errors were found.');
    }
    app.saveerror(item, app.ERROR, conf);

    function showError(err, field) {
        if (field)
            field = field + '-';
        else
            field = '';
        var sel = '.' + conf.page + '-' + field + 'errors';
        $form.find(sel).html(err);
    }
}

// Remember which submit button was clicked (and its value)
function _submitClick() {
    var $button = $(this),
        $form = $(this.form),
        name = $button.attr('name'),
        value = $button.attr('value');
    if (name !== undefined && value !== undefined) {
        $form.data('submit-button-name', name);
        $form.data('submit-button-value', value);
    }
}


// Successful results from REST API contain the newly saved object
function _applyResult(item, result) {
    if (result && result.id) {
        var conf = _getConfByUrl(item.listQuery.url);
        item.saved = true;
        item.newid = result.id;
        ds.getList(item.listQuery, function(list) {
            var res = $.extend({}, result);
            for (var aname in app.attachmentTypes)
                _updateAttachments(conf, res, aname);
            list.update([res], 'id', conf.reversed, conf.max_local_pages);
        });
    } else if (app.can_login && result && result.user && result.config) {
        _saveLogin(result);
        item.saved = true;
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
        list.update(attachments, 'id', aconf.reversed, aconf.max_local_pages);
    });
    delete res[aconf.url];
}

function _saveLogin(result) {
    var config = result.config,
        user = result.user,
        csrftoken = result.csrftoken;
    if (!app.can_login)
        return;
    app.wq_config = config;
    ds.set({'url': 'config'}, config);
    tmpl.setDefault('wq_config', config);
    app.user = user;
    tmpl.setDefault('user', user);
    tmpl.setDefault('is_authenticated', true);
    tmpl.setDefault('csrftoken', csrftoken);
    ds.set('user', user);
    ds.set('csrftoken', csrftoken);
    $('body').trigger('login');
}

function _checkLogin() {
    if (!app.can_login)
        return;
    ds.fetch({'url': 'login'}, true, function(result) {
        if (result && result.user && result.config) {
            _saveLogin(result);
        } else if (result && app.user) {
            app.logout();
        } else if (result && result.csrftoken) {
            tmpl.setDefault('csrftoken', result.csrftoken);
            ds.set('csrftoken', result.csrftoken);
        }
    }, true);
}

// Add various callback functions to context object to automate foreign key
// lookups within templates
function _addLookups(page, context, editable, callback) {
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
            lookups[info.type] = _parent_lookup(
                info.type, info.typeColumn || 'type_id'
            );
        if (editable) {
            if (aconf.choices) {
                for (field in aconf.choices) {
                    lookups[field + '_choices'] = _choice_dropdown_lookup(
                        field, aconf.choices[field]
                    );
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
    function _addParentLookup(col) {
        var pconf;
        lookups[col] = _parent_lookup(ppage, col + '_id');
        if (editable) {
            pconf = _getConf(ppage);
            lookups[col + '_list'] = _parent_dropdown_lookup(
                page, ppage, col + '_id'
            );
            if (pconf.url && col == ppage)
                lookups[pconf.url] = lookups[col + '_list'];
        }
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
            }, this);
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
            }, this);
            return list;
        };
        callback(context);
    };
}

function _item_choice_lookup(page, aname) {
    return function(context, key, callback) {
        var info = app.attachmentTypes[aname];
        var tconf = _getConf(info.type);
        ds.getList({'url': tconf.url}, function(types) {
            var lists = [], listLookup = {};
            types.filter(info.getTypeFilter(page, context)).forEach(
                function(type) {
                    lists.push(info.getChoiceList(type, context));
                }
            );
            if (!lists.length)
                callback(context);
            else
                addList(0);
            function addList(index) {
                var lconf = _getConf(lists[index]);
                ds.getList({'url': lconf.url}, function(list) {
                    listLookup[lists[index]] = function(type) {
                        var items = list.filter(
                            info.getChoiceListFilter(type, context)
                        );
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
                                var listid = info.getChoiceList(type, context);
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
function _parent_dropdown_lookup(cpage, ppage, column) {
    if (!column) column = ppage + '_id';
    return _make_lookup(ppage, function(list, context) {
        return function() {
            var parents = [], choices = list;
            if (app.parentFilters[column]) {
                choices = list.filter(
                    app.parentFilters[column](ppage, cpage, context)
                );
            }
            choices.forEach(function(v) {
                var item = $.extend({}, v);
                if (item.id == this[column])
                    item.selected = true; // Currently selected item
                parents.push(item);
            }, this);
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
            var result = list.filter(filter);
            result.forEach(function(item, i) {
                item = $.extend({}, item);
                item['@index'] = i;
                result[i] = item;
            });
            return result;
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
        types.forEach(function(t, i) {
            var obj = {};
            if (info.getDefaults)
                obj = info.getDefaults(t, context);
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
    for (var p in app.wq_config.pages)
        if (app.wq_config.pages[p].url == parts[0]) {
            conf = $.extend({}, app.wq_config.pages[p]);
            conf.page = p; // Same as 'name'?
        }
    if (!conf)
        throw 'Configuration for "/' + url + '" not found!';
    return conf;
}

function _loadFromServer(url, ui) {
    var jqmurl = '/' + url, options = ui && ui.options || {};
    options.wqSkip = true;
    if (app.config.debug)
        console.log("Loading " + url + " from server");
    jqm.changePage(jqmurl, options);
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
