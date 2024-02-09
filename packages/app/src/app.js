import ds from "@wq/store";
import orm, { getRootFields } from "@wq/model";
import outbox from "@wq/outbox";
import router from "@wq/router";
import spinner from "./spinner.js";
import auth from "./auth.js";
import defaults from "./defaults.js";
import Mustache from "mustache";
import deepcopy from "deepcopy";
import { setIn } from "formik";

var app = {
    OFFLINE: "offline",
    FAILURE: "failure",
    ERROR: "error",
    get user() {
        return this.getAuthState().user;
    },
    get csrftoken() {
        return this.getAuthState().csrftoken;
    },
};

const SERVER = "@@SERVER";
const CORE_PLUGINS = ["orm", "renderer"];

app.plugins = {};

var _register = {};

app.init = function (config) {
    if (!config) {
        config = {};
    }
    if (!config.pages) {
        config.pages = {};
    }
    CORE_PLUGINS.forEach((type) => {
        if (!app[type]) {
            throw new Error(`Register a ${type} with app.use()`);
        }
    });
    app.use(spinner);
    app.use(defaults);
    app.use(syncUpdateUrl);
    if (config.pages.login && !app.plugins.auth) {
        // FIXME: Require explicit auth registration in 2.0
        app.use(auth);
    }
    router.addRouteInfo(_extendRouteInfo);
    router.addContext(() => spinner.start() && {});
    router.addContext(_getSyncInfo);

    // Router (wq/router.js) configuration
    if (!config.router) {
        config.router = {
            base_url: "",
        };
    }
    config.router.getTemplateName = (name) => {
        name = name.split(":")[0];
        if (app.config.pages[name] && app.config.pages[name].template) {
            name = app.config.pages[name].template;
        }
        return name;
    };
    if (config.site_title && !config.router.site_title) {
        config.router.site_title = config.site_title;
    }

    // Store (wq/store.js) configuration
    if (!config.store) {
        config.store = {
            service: config.router.base_url,
            defaults: { format: "json" },
        };
    }
    if (!config.store.fetchFail) {
        config.fetchFail = _fetchFail;
    }

    Object.entries(app.plugins).forEach(([name, plugin]) => {
        if (plugin.ajax) {
            config.store.ajax = plugin.ajax.bind(plugin);
        }
        if (plugin.reducer) {
            let persist = false,
                restore = null;
            if (typeof plugin.persist === "function") {
                persist = plugin.persist.bind(plugin);
                restore = plugin.restore
                    ? plugin.restore.bind(plugin)
                    : (state) => state;
            } else if (plugin.persist) {
                persist = true;
            }
            ds.addReducer(
                name,
                (state, action) => plugin.reducer(state, action),
                persist,
                restore
            );
        }
        if (plugin.actions) {
            Object.assign(plugin, ds.bindActionCreators(plugin.actions));
        }
        if (plugin.thunks) {
            router.addThunks(plugin.thunks, plugin);
        }
        if (plugin.subscriber) {
            ds.subscribe(() => plugin.subscriber(ds.getState()));
        }
        if (plugin.pages) {
            Object.assign(config.pages, plugin.pages);
        }
    });

    app.spin = {
        start: (msg, duration, opts) => spinner.start(msg, duration, opts),
        forSeconds: (duration) => spinner.start(null, duration),
        stop: (msg) => spinner.stop(msg),
    };

    // Outbox (wq/outbox.js) configuration
    if (!config.outbox) {
        config.outbox = {};
    }

    // Propagate debug setting to other modules
    if (config.debug) {
        config.router.debug = config.debug;
        config.store.debug = config.debug;
        CORE_PLUGINS.forEach((type) => {
            if (config[type]) {
                config[type].debug = config.debug;
            }
        });
    }

    // Load missing (non-local) content as JSON, or as server-rendered HTML?
    // Default (as of 1.0) is to load JSON and render on client.
    config.loadMissingAsJson =
        config.loadMissingAsJson || !config.loadMissingAsHtml;
    config.loadMissingAsHtml = !config.loadMissingAsJson;

    // After a form submission, sync in the background, or wait before
    // continuing?  Default is to sync in the background.
    if (config.backgroundSync === undefined) {
        config.backgroundSync = true;
    }

    app.config = config;

    // Initialize wq/router.js
    router.init(config.router);
    app.base_url = router.base_url;

    app.store = ds;
    app.outbox = outbox;
    outbox.app = app;
    app.router = router;

    // Option to submit forms in the background rather than wait for each post
    if (config.backgroundSync) {
        if (config.backgroundSync === -1) {
            outbox.pause();
        } else if (config.backgroundSync > 1) {
            console.warn("Sync interval is now controlled by redux-offline");
        }
    }

    // Deprecated hooks
    const deprecated = {
        noBackgroundSync: "backgroundSync: false",
        postsave: "a postsaveurl() plugin hook or a postsave page config",
        saveerror: "an onsync() plugin hook",
        showOutboxErrors: "an onsync() and/or run() hook",
        _addOutboxItemsToContext: "@wq/outbox's IMMEDIATE mode",
        presync: "the template context",
        postsync: "the template context or an onsync() plugin hook",
    };
    Object.entries(deprecated).forEach(([hook, alternative]) => {
        // TODO: Make this an error in 2.0
        if (config[hook]) {
            console.warn(
                new Error(
                    `config.${hook} has no effect.  Use ${alternative} instead.  See wq.app 1.2 release notes for more info.`
                )
            );
        }
    });
    if (app.hasPlugin("onsave")) {
        console.warn(
            new Error(
                "An onsave() plugin hook has no effect.  Use an onsync() hook instead.  See wq.app 1.2 release notes for more info."
            )
        );
    }

    Object.keys(app.config.pages).forEach(function (page) {
        app.config.pages[page].name = page;
    });

    app.callPlugins("init");

    // Register routes with wq/router.js
    var root = false;
    Object.keys(app.config.pages).forEach(function (page) {
        var conf = _getConf(page);
        if (!conf.url) {
            root = true;
        }
        if (conf.list) {
            conf.modes.forEach(function (mode) {
                var register = _register[mode] || _register.detail;
                register(page, mode);
            });
            (conf.server_modes || []).forEach(function (mode) {
                _register.detail(page, mode, _serverContext);
            });
        } else if (conf) {
            _registerOther(page);
        }
    });

    // Register outbox
    router.register("outbox/", "outbox_list", () => outbox.loadItems());
    router.register("outbox/<slug>", "outbox_detail", _renderOutboxItem);
    router.register("outbox/<slug>/edit", "outbox_edit", _renderOutboxItem);

    // Fallback index page
    if (!root && !app.config.pages.index) {
        router.registerLast("", "index");
    }

    // Fallback for all other URLs
    router.registerLast(":path*", SERVER, _serverContext);

    Object.entries(app.plugins).forEach(([name, plugin]) => {
        if (plugin.context) {
            router.addContext((ctx) => {
                return plugin.context(ctx, ctx.router_info);
            });
        }
    });

    router.addContext(() => spinner.stop() && {});

    // Initialize wq/store.js and wq/outbox.js
    ds.init(config.store);
    app.service = ds.service;

    var ready = ds.ready.then(() => outbox.init(config.outbox));

    if (app.config.autoStart !== false) {
        ready = ready.then(app.start);
    }

    return ready;
};

var pcount = 0;
app.use = function (plugin) {
    if (Array.isArray(plugin)) {
        plugin.forEach((p) => app.use(p));
        return;
    }
    if (plugin.dependencies) {
        app.use(plugin.dependencies);
    }
    if (app.plugins[plugin.name]) {
        if (app.plugins[plugin.name] === plugin) {
            return;
        } else {
            throw new Error(`App already has a plugin named ${plugin.name}!`);
        }
    }
    pcount++;
    if (!plugin.name) {
        plugin.name = "plugin" + pcount;
    }
    app.plugins[plugin.name] = plugin;
    plugin.app = app;
    if (plugin.type) {
        if (app[plugin.type]) {
            throw new Error(
                `App already has a ${plugin.type} (${app[plugin.type].name})`
            );
        }
        app[plugin.type] = plugin;
    }
};

app.start = function () {
    router.start();
    app.callPlugins("start");
};

async function _getSyncInfo() {
    const unsynced = await outbox.unsynced();
    return {
        svc: app.service,
        native: app["native"],
        syncing: app.syncing,
        unsynced: unsynced,
    };
}

app.retryAll = function () {
    app.outbox.unsynced().then(function (unsynced) {
        if (!unsynced) {
            return;
        }
        app.outbox.retryAll();
    });
};

app.emptyOutbox = function (confirmFirst) {
    /* global confirm */
    if (confirmFirst) {
        if (navigator.notification && navigator.notification.confirm) {
            navigator.notification.confirm("Empty Outbox?", function (button) {
                if (button == 1) {
                    app.emptyOutbox();
                }
            });
            return;
        } else {
            if (!confirm("Empty Outbox?")) {
                return;
            }
        }
    }
    return outbox.empty();
};

app.confirmSubmit = function (form, message) {
    /* global confirm */
    if (navigator.notification && navigator.notification.confirm) {
        if (form.dataset.wqConfirmSubmit) {
            return true;
        }
        navigator.notification.confirm(message, function (button) {
            if (button == 1) {
                form.dataset.wqConfirmSubmit = true;
                form.submit();
            }
        });
    } else {
        if (confirm(message)) {
            return true;
        }
    }
    return false;
};

// Handle navigation after form submission
app.postSaveNav = function (item, alreadySynced) {
    var url;

    const pluginUrl = app
        .callPlugins("postsaveurl", [item, alreadySynced])
        .filter((item) => !!item);

    if (pluginUrl.length) {
        url = pluginUrl[0];
    } else {
        url = app.postsaveurl(item, alreadySynced);
    }

    // Navigate to computed URL
    if (app.config.debug) {
        console.log("Successfully saved; continuing to " + url);
    }
    router.push(url);
};

app.postsaveurl = function (item, alreadySynced) {
    var postsave, pconf, match, mode, url, itemid, modelConf;

    // conf.postsave can be set redirect to another page
    modelConf = item.options.modelConf;
    if (item.deletedId) {
        postsave = modelConf.postdelete;
    } else {
        postsave = modelConf.postsave;
    }
    if (!postsave) {
        // Otherwise, default is to return the page for the item just saved
        if (!alreadySynced || item.deletedId) {
            // If backgroundSync, return to list view while syncing
            postsave = modelConf.name + "_list";
        } else {
            // If !backgroundSync, return to the newly synced item
            postsave = modelConf.name + "_detail";
        }
    }

    // conf.postsave should explicitly indicate which template mode to use
    /* eslint no-useless-escape: off */
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
            urlContext = { deleted: true, ...router.getContext() };
        } else {
            urlContext = { ...item.data, ...item.result };
        }
        url = app.base_url + "/" + Mustache.render(postsave, urlContext);
    } else if (!pconf.list) {
        url = app.base_url + "/" + pconf.url;
    } else {
        if (pconf.modes.concat(pconf.server_modes || []).indexOf(mode) == -1) {
            throw "Unknown template mode!";
        }

        // For list pages, the url can differ depending on the mode
        url = app.base_url + "/" + pconf.url + "/";

        if (mode != "list") {
            // Detail or edit view; determine item id and add to url
            if (postsave == modelConf.name && !item.synced) {
                // Config indicates return to detail/edit view of the model
                // that was just saved, but the item hasn't been synced yet.
                // Navigate to outbox URL instead.
                url = app.base_url + "/outbox/" + item.id;
                if (mode != "edit" && item.error) {
                    // Return to edit form if there was an error
                    mode = "edit";
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
                    itemid = item.result && item.result[postsave + "_id"];
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
    return url;
};

const syncUpdateUrl = {
    name: "syncUpdateUrl",
    onsync(obitem) {
        const context = router.getContext() || {},
            { router_info: routeInfo = {} } = context,
            {
                page,
                mode,
                outbox_id: routeOutboxId,
                base_url,
                page_config,
                full_path,
                item_id,
                parent_id,
            } = routeInfo,
            { id: outboxId, result } = obitem || {},
            { id: resultId } = result || {},
            outboxSlug = `outbox-${outboxId}`;

        if (!resultId) {
            return;
        }
        if (
            routeOutboxId === outboxId &&
            page === "outbox" &&
            page_config &&
            page_config.url
        ) {
            const modePath = mode === "detail" ? "" : `/${mode}`;
            router.push(
                `${base_url}/${page_config.url}/${resultId}${modePath}`
            );
        }
        if (item_id === outboxSlug || parent_id === outboxSlug) {
            router.push(full_path.replace(outboxSlug, resultId));
        }
    },
};

// Return a list of all foreign key fields
app.getParents = function (page) {
    return getRootFields(_getConf(page))
        .filter(function (field) {
            return field["wq:ForeignKey"];
        })
        .map(function (field) {
            return field["wq:ForeignKey"];
        });
};

// Shortcuts for $.mobile.changePage
app.nav = function (url) {
    url = app.base_url + "/" + url;
    router.push(url);
};

app.refresh = function () {
    router.refresh();
};

app.hasPlugin = function (method) {
    var plugin,
        fn,
        hasPlugin = false;
    for (plugin in app.plugins) {
        fn = app.plugins[plugin][method];
        if (fn) {
            hasPlugin = true;
        }
    }
    return hasPlugin;
};

app.callPlugins = function (method, args) {
    var plugin,
        fn,
        fnArgs,
        queue = [];
    for (plugin in app.plugins) {
        fn = app.plugins[plugin][method];
        if (args) {
            fnArgs = args;
        } else {
            fnArgs = [app.config[plugin]];
        }
        if (fn) {
            queue.push(fn.apply(app.plugins[plugin], fnArgs));
        }
    }
    return queue;
};

// Internal variables and functions
app.splitRoute = function (routeName) {
    const match = routeName.match(/^(.+)_([^_]+)$/);
    let page, mode, variant;
    if (match) {
        page = match[1];
        mode = match[2];
        if (mode.indexOf(":") > -1) {
            [mode, variant] = mode.split(":");
        } else {
            variant = null;
        }
    } else {
        page = routeName;
        mode = null;
        variant = null;
    }
    return [page, mode, variant];
};

function _joinRoute(page, mode, variant) {
    if (variant) {
        return page + "_" + mode + ":" + variant;
    } else if (mode) {
        return page + "_" + mode;
    } else {
        return page;
    }
}

function _extendRouteInfo(routeInfo) {
    const routeName = routeInfo.name,
        itemid = (page !== "outbox" && routeInfo.slugs.slug) || null;
    var [page, mode, variant] = app.splitRoute(routeName),
        conf = _getConf(page, true),
        pageid = null;

    if (conf) {
        if (mode && mode !== "list") {
            pageid =
                page +
                "_" +
                mode +
                (variant ? "_" + variant : "") +
                (itemid ? "_" + itemid : "") +
                "-page";
        }
    } else if (page === "outbox") {
        conf = {
            name: "outbox",
            url: "outbox",
            page: "outbox",
            form: [],
            modes: ["list", "detail", "edit"],
        };
    } else {
        page = routeName;
        mode = null;
        conf = {
            name: page,
            page: page,
            form: [],
            modes: [],
        };
    }
    return {
        ...routeInfo,
        page: page,
        page_config: conf,
        mode: mode,
        variant: variant,
        item_id: itemid,
        dom_id: pageid,
    };
}

// Generate list view context and render with [url]_list template;
// handles requests for [url] and [url]/
_register.list = function (page) {
    const conf = _getConf(page),
        register = conf.url === "" ? router.registerLast : router.register,
        url = conf.url === "" ? "" : conf.url + "/";
    register(url, _joinRoute(page, "list"), (ctx) => _displayList(ctx));

    // Special handling for /[parent_list_url]/[parent_id]/[url]
    app.getParents(page).forEach(function (ppage) {
        var pconf = _getConf(ppage);
        var url = pconf.url;
        var registerParent;
        if (url === "") {
            registerParent = router.registerLast;
        } else {
            registerParent = router.register;
            url += "/";
        }
        url += ":parent_id/" + conf.url;
        registerParent(url, _joinRoute(page, "list", ppage), parentContext);
    });

    async function parentContext(ctx) {
        const { router_info: routeInfo } = ctx,
            { page, variant: ppage } = routeInfo,
            parent_id = routeInfo.slugs.parent_id,
            pconf = _getConf(ppage),
            pitem = await app.models[ppage].find(parent_id);
        var parentUrl;
        if (pitem) {
            parentUrl = pconf.url + "/" + pitem.id;
        } else if (parent_id.indexOf("outbox-") == -1) {
            parentUrl = "outbox/" + parent_id.split("-")[1];
        } else {
            parentUrl = null;
        }
        var parentInfo = {
            parent_id,
            parent_url: parentUrl,
            parent_label: pitem && pitem.label,
            parent_page: ppage,
            parent_conf: pconf,
        };
        parentInfo["parent_is_" + ppage] = true;

        return _displayList(ctx, {
            ...parentInfo,
            router_info: {
                ...routeInfo,
                ...parentInfo,
            },
        });
    }
};

app._addOutboxItemsToContext = function (context, unsyncedItems) {
    // Add any outbox items to context
    context.unsynced = unsyncedItems.length;
    context.unsyncedItems = unsyncedItems;
};

async function _displayList(ctx, parentInfo) {
    const { router_info: routeInfo } = ctx,
        { page, params, full_path: url } = routeInfo,
        conf = _getConf(page),
        model = app.models[page];
    var pnum = model.opts.page,
        limit = null,
        next = null,
        prev = null,
        filter;
    if (params || parentInfo) {
        if (params && params.page) {
            pnum = params.page;
        }
        if (params && params.limit) {
            limit = params.limit;
        }
        filter = {};
        for (var key in params || {}) {
            if (key != "page") {
                filter[key] = params[key];
            }
        }
        if (parentInfo) {
            getRootFields(conf).forEach(function (field) {
                if (field["wq:ForeignKey"] == parentInfo.parent_page) {
                    const naturalKey = field.name.match(
                        /^([^\]]+)\[([^\]]+)\]$/
                    );
                    if (naturalKey) {
                        filter[naturalKey.slice(1).join("__")] =
                            parentInfo.parent_id;
                    } else if (field.type === "select") {
                        filter[field.name + "_id"] = [parentInfo.parent_id];
                    } else {
                        filter[field.name + "_id"] = parentInfo.parent_id;
                    }
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
            return _loadFromServer(url);
        }
        if (filter && model.opts.server) {
            return _loadFromServer(url);
        }
        if (pnum > model.opts.page) {
            return _loadFromServer(url);
        }
    } else if (filter && pnum > model.opts.page) {
        filter.page = pnum;
        if (limit) {
            filter.limit = limit;
        }
    }

    if (!pnum && (!model.opts.client || filter)) {
        pnum = 1;
    }

    const showUnsynced =
        pnum == model.opts.page || (pnum == 1 && !model.opts.client);

    function getData() {
        if (filter) {
            return model.filterPage(filter);
        } else if (pnum > model.opts.page) {
            return model.page(pnum, limit);
        } else {
            return model.load();
        }
    }
    async function getUnsynced() {
        if (showUnsynced) {
            return model.unsyncedItems();
        } else {
            return [];
        }
    }

    // If the number of unsynced records changes while loading the data,
    // load the data a second time to make sure the list is up to date.
    // (this is rare except for cache=none lists with background sync)
    const unsynced1 = await getUnsynced();
    const data1 = await getData();
    const unsynced2 = await getUnsynced();
    var data;
    if (unsynced1 && unsynced2 && unsynced1.length != unsynced2.length) {
        data = await getData();
    } else {
        data = data1;
    }
    const unsyncedItems = unsynced2;
    var prevIsLocal, currentIsLocal;

    if (pnum > model.opts.page && (model.opts.client || pnum > 1)) {
        if (+pnum - 1 > model.opts.page && (model.opts.client || pnum > 2)) {
            let prevp = filter ? { ...filter } : {};
            prevp.page = +pnum - 1;
            prev = conf.url + "/?" + new URLSearchParams(prevp).toString();
        } else if (+pnum - 1 == model.opts.page && !filter) {
            prev = conf.url + "/";
            prevIsLocal = true;
        }
    }

    if (pnum < data.pages && (model.opts.server || pnum)) {
        let nextp = filter ? { ...filter } : {};
        nextp.page = +pnum + 1;
        next = conf.url + "/?" + new URLSearchParams(nextp).toString();
        if (nextp.page == 1) {
            currentIsLocal = true;
        }
    }

    var context = {
        ...data,
        ...parentInfo,
        previous: prev ? "/" + prev : null,
        next: next ? "/" + next : null,
        multiple: prev || next ? true : false,
        page: pnum,
        show_unsynced: showUnsynced,
        previous_is_local: prevIsLocal,
        current_is_local: currentIsLocal,
    };

    app._addOutboxItemsToContext(context, unsyncedItems);

    return context;
}

// Generate item detail view context and render with [url]_detail template;
// handles requests for [url]/[id]
_register.detail = function (page, mode, contextFn = _displayItem) {
    var conf = _getConf(page);
    var url = _getDetailUrl(conf.url, mode);
    const register = conf.url === "" ? router.registerLast : router.register;
    register(url, _joinRoute(page, mode), contextFn);
};

function _getDetailUrl(url, mode) {
    if (url) {
        url += "/";
    }
    url += "<slug>";
    if (mode != "detail") {
        url += "/" + mode;
    }
    return url;
}

// Generate item edit context and render with [url]_edit template;
// handles requests for [url]/[id]/edit and [url]/new
_register.edit = function (page) {
    var conf = _getConf(page);
    const register = conf.url === "" ? router.registerLast : router.register;
    register(
        _getDetailUrl(conf.url, "edit"),
        _joinRoute(page, "edit"),
        _displayItem
    );
    router.registerFirst(
        conf.url + "/new",
        _joinRoute(page, "edit", "new"),
        _displayItem
    );
};

async function _displayItem(ctx) {
    const { router_info: routeInfo } = ctx,
        { item_id: itemid, page, mode, variant, full_path: url } = routeInfo,
        conf = _getConf(page),
        model = app.models[page];

    var item;
    if (mode == "edit" && variant == "new") {
        item = {};
        Object.entries({ ...routeInfo.params, ...conf.defaults }).forEach(
            ([key, value]) => {
                item = setIn(item, key, value);
            }
        );
    } else {
        const localOnly = !app.config.loadMissingAsJson;
        item = await model.find(itemid, localOnly);
        if (!item) {
            if (model.opts.server && app.config.loadMissingAsHtml) {
                return _loadFromServer(url);
            } else {
                return router.notFound();
            }
        }
    }

    if (item) {
        item.local = true;

        _addFKLabels(item, model.config.form);

        return item;
    } else {
        if (model.opts.server && app.config.loadMissingAsHtml) {
            // opts.server indicates that the local list does not represent
            // the entire dataset; if an item is not found, attempt to load
            // HTML directly from the server.
            return _loadFromServer(url);
        } else {
            // If opts.server is false, locally stored list is assumed to
            // contain the entire dataset, so the item probably does not exist.
            return router.notFound();
        }
    }
}

function _addFKLabels(item, form) {
    for (const field of form) {
        const modelName = field["wq:ForeignKey"],
            idName = `${field.name}_id`,
            labelName = `${field.name}_label`;
        if (
            !modelName ||
            !app.models[modelName] ||
            !item[idName] ||
            item[labelName]
        ) {
            continue;
        }
        const relItem = app.models[modelName].model.withId(item[idName]);
        if (relItem && relItem.label) {
            item[labelName] = relItem.label;
        }
    }
    for (const field of form) {
        let data = item[field.name];
        if (field.children && data) {
            if (!Array.isArray(data)) {
                data = [data];
            }
            for (const row of data) {
                _addFKLabels(row, field.children);
            }
        }
    }
}

// Render non-list pages with with [url] template;
// handles requests for [url] and [url]/
function _registerOther(page) {
    var conf = _getConf(page);
    router.register(
        conf.url,
        page,
        conf.context || _displayOther,
        undefined,
        conf.thunk || null
    );
    async function _displayOther() {
        if (conf.server_only) {
            return _loadFromServer(app.base_url + "/" + conf.url);
        } else {
            return {};
        }
    }
}

async function _renderOutboxItem(ctx) {
    // Display outbox item using model-specific detail/edit view
    const { router_info: routeInfo } = ctx,
        mode = routeInfo.mode,
        item = await outbox.loadItem(+routeInfo.slugs.slug);

    if (!item || !item.options || !item.options.modelConf) {
        return router.notFound();
    }

    var id,
        page = item.options.modelConf.name,
        template = page + "_" + mode,
        idMatch = item.options.url.match(
            new RegExp(item.options.modelConf.url + "/([^/]+)$")
        );
    if (item.data.id) {
        id = item.data.id;
    } else if (idMatch) {
        id = idMatch[1];
    } else {
        id = "new";
    }
    var context = {
        outbox_id: item.id,
        label: item.label,
        error: item.error,
        router_info: {
            ...routeInfo,
            page_config: item.options.modelConf,
            template: template,
            outbox_id: item.id,
        },
        ...deepcopy(item.data),
    };
    if (id != "new") {
        context.id = id;
    }
    return context;
}

app.isRegistered = function (url) {
    if (_getConfByUrl(url, true)) {
        return true;
    } else {
        return false;
    }
};

app.submitForm = async function ({
    url,
    storage,
    backgroundSync,
    has_files,
    outboxId,
    preserve,
    data: vals,
}) {
    const conf = _getConfByUrl(url, true);

    var options = {
        url: url,
    };

    if (storage) {
        options.storage = storage;
    } else if (!backgroundSync) {
        options.storage = "temporary";
    } else if (has_files && navigator.product !== "ReactNative") {
        options.storage = "store";
    }

    if (_hasNestedObject(vals)) {
        if (has_files) {
            vals = _flattenJson(vals);
        } else {
            options.json = true;
        }
    }

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

    if (conf) {
        options.modelConf = conf;
        if (conf.label_template) {
            if (typeof conf.label_template === "function") {
                options.label = conf.label_template(vals);
            } else {
                options.label = Mustache.render(conf.label_template, vals);
            }
        }
    }

    options.csrftoken = app.csrftoken;
    var item = await outbox.save(vals, options);
    if (backgroundSync) {
        // Send user to next screen while app syncs in background
        app.postSaveNav(item, false);
        return [item, null];
    }

    // Submit form immediately and wait for server to respond
    app.spin.start();
    item = await outbox.waitForItem(item.id);
    app.spin.stop();
    if (!item) {
        return [item, app.FAILURE];
    }
    if (item.synced) {
        // Item was synced
        app.postSaveNav(item, true);
        return [item, null];
    }
    // Something went wrong
    if (!item.error) {
        // Save failed without server error: probably offline
        // FIXME: waitForItem() probably doesn't resolve until back online.
        app.postSaveNav(item, false);
        return [item, null];
    } else if (typeof item.error === "string") {
        // Save failed and error information is not in JSON format
        // (likely a 500 server failure)
        return [item, app.FAILURE];
    } else {
        // Save failed and error information is in JSON format
        // (likely a 400 bad data error)
        return [item, app.ERROR];
    }
};

function _hasNestedObject(value) {
    return Object.values(value).some(
        (val) =>
            typeof val === "object" &&
            (!Array.isArray(val) || typeof val[0] === "object")
    );
}

function _flattenJson(value, prefix = "") {
    const result = {};
    if (prefix) {
        if (value === null || value === undefined) {
            return { [prefix]: "" };
        } else if (typeof value !== "object") {
            return { [prefix]: value };
        }
    }
    Object.entries(value).forEach(([key, val]) => {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        if (Array.isArray(val)) {
            val.forEach((row, i) =>
                Object.assign(result, _flattenJson(row, `${fullKey}[${i}]`))
            );
        } else if (typeof val === "object") {
            if (_isFile(val)) {
                result[fullKey] = val;
            } else if (_isGeometry(val)) {
                result[fullKey] = JSON.stringify(val);
            } else {
                Object.assign(result, _flattenJson(val, fullKey));
            }
        } else {
            result[fullKey] = val;
        }
    });
    return result;
}

function _isFile(val) {
    return val && val.type && val.name && (val.body || val.uri);
}

function _isGeometry(val) {
    return val && val.type && val.coordinates;
}

app.getAuthState = function () {
    return (this.plugins.auth && this.plugins.auth.getState()) || {};
};

// Load configuration based on page id
function _getConf(page, silentFail) {
    var conf = app.config.pages[page];
    if (!conf) {
        if (silentFail) {
            return;
        } else {
            throw new Error('Configuration for "' + page + '" not found!');
        }
    }
    return {
        page: page,
        form: [],
        modes: conf.list ? ["list", "detail", "edit"] : [],
        ...conf,
    };
}

// Helper to load configuration based on URL
function _getConfByUrl(url, silentFail) {
    var parts = url.split("/");
    var conf;
    for (var p in app.config.pages) {
        if (app.config.pages[p].url == parts[0]) {
            conf = app.config.pages[p];
        }
    }
    if (!conf) {
        if (silentFail) {
            return;
        } else {
            throw 'Configuration for "/' + url + '" not found!';
        }
    }
    return conf;
}

async function _loadFromServer(url) {
    // options = (ui && ui.options) || {};
    if (app.config.debug) {
        console.log("Loading " + url + " from server");
        if (app.base_url && url.indexOf(app.base_url) !== 0) {
            console.warn(url + " does not include " + app.base_url);
        }
    }
    const response = await fetch(url),
        html = await response.text();
    return router.rawHTML(html);
}

function _serverContext(ctx) {
    const { router_info: routeInfo } = ctx,
        { full_path: url } = routeInfo;
    return _loadFromServer(url);
}

function _fetchFail(query, error) {
    /* eslint no-unused-vars: off */
    app.spin.alert("Error Loading Data");
}

export default app;
