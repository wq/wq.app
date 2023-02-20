import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
    bindActionCreators,
} from "redux";
import logger from "redux-logger";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2.js";

const REMOVE = "@@KVP_REMOVE";
const SET = "@@KVP_SET";
const CLEAR = "@@KVP_CLEAR";

// Internal variables and functions
var _verbosity = {
    Network: 1,
    Lookup: 2,
    Values: 3,
};

class Store {
    constructor(name) {
        if (_stores[name]) {
            throw name + " store already exists!";
        }
        this.name = name;
        _stores[name] = this;

        this.debug = false;

        // Base URL of web service
        this.service = undefined;

        // Default parameters (e.g f=json)
        this.defaults = {};

        this.ready = {
            then: function () {
                throw new Error("Call init first!");
            },
        };

        // Registered redux functions
        this._reducers = {};
        this._enhanceReducers = [];
        this._persistKeys = [];
        this._transforms = [];
        this._middleware = [];
        this._enhancers = [];
        this._subscribers = [];
        this._deferActions = [];
        this._thunkHandler = null;

        this._promises = {}; // Save promises to prevent redundant fetches

        this.addReducer(
            "kvp",
            (state, action) => this.kvpReducer(state, action),
            true
        );
    }

    setEngine({ createStorage, serialize, deserialize }) {
        this.engine = { createStorage, serialize, deserialize };
    }

    init(opts = {}) {
        var self = this;
        var optlist = [
            "debug",
            "storageFail",

            "service",
            "defaults",
            "fetchFail",
            "ajax",
            "formatKeyword",
        ];
        optlist.forEach(function (opt) {
            if (opts.hasOwnProperty(opt)) {
                self[opt] = opts[opt];
            }
        });
        if (self.debug) {
            for (var level in _verbosity) {
                if (self.debug >= _verbosity[level]) {
                    self["debug" + level] = true;
                }
            }
            self.addMiddleware(logger.default || logger);
        }

        var storeReady;
        self.ready = new Promise((resolve) => (storeReady = resolve));

        var reducer = combineReducers(this._reducers);
        this._enhanceReducers.forEach((enhanceReducer) => {
            reducer = enhanceReducer(reducer);
        });
        const enhancers = compose(
            ...this._enhancers,
            applyMiddleware(...this._middleware)
        );

        const { createStorage, serialize, deserialize } =
            this.engine || ds.engine;

        this.lf = createStorage(this.name);

        const persistConfig = {
            key: "root",
            storage: this.lf,
            stateReconciler: autoMergeLevel2.default || autoMergeLevel2,
            serialize,
            deserialize,
            transforms: this._transforms,
            whitelist: this._persistKeys,
            writeFailHandler: (error) => this.storageFail(error),
        };
        const persistedReducer = persistReducer(persistConfig, reducer);
        this._store = createStore(persistedReducer, {}, enhancers);
        this._persistor = persistStore(this._store);
        this._persistor.subscribe(() => {
            const { bootstrapped } = this._persistor.getState();
            if (bootstrapped) {
                storeReady();
            }
        });
        this._unsubscribers = this._subscribers.map((fn) =>
            this._store.subscribe(fn)
        );
        this._deferActions.forEach(this._store.dispatch);
    }

    dispatch(action) {
        if (this._store) {
            return this._store.dispatch(action);
        } else {
            this._deferActions.push(action);
        }
    }

    subscribe(fn) {
        this._subscribers.push(fn);
        if (this._store) {
            return this._store.subscribe(fn);
        } else {
            const index = this._subscribers.length - 1;
            return () => {
                if (!this._unsubscribers) {
                    throw new Error("Store was never fully initialized!");
                }
                this._unsubscribers[index]();
            };
        }
    }

    getState() {
        return this._store.getState();
    }

    addReducer(name, reducer, persist, restore) {
        this._reducers[name] = reducer;
        if (persist) {
            this.persistKey(name, persist, restore);
        }
    }

    addEnhanceReducer(name, enhanceReducer, persist, restore) {
        this._enhanceReducers.push(enhanceReducer);
        if (persist) {
            this.persistKey(name, persist, restore);
        }
    }

    persistKey(name, persist, restore) {
        this._persistKeys.push(name);
        if (persist && restore) {
            this._transforms.push(
                createTransform(persist, restore, { whitelist: [name] })
            );
        }
    }

    addMiddleware(middleware) {
        this._middleware.push(middleware);
    }

    addEnhancer(enhancer) {
        this._enhancers.push(enhancer);
    }

    bindActionCreators(actions) {
        return bindActionCreators(actions, this.dispatch.bind(this));
    }

    addThunk(name, thunk) {
        if (!this._thunkHandler) {
            throw new Error("@wq/router is required to handle thunks");
        }
        this._thunkHandler(name, thunk);
    }

    setThunkHandler(handler) {
        this._thunkHandler = handler;
    }

    kvpReducer(state = {}, action) {
        if (action.type === REMOVE) {
            state = { ...state };
            delete state[action.payload.key];
        } else if (action.type === SET) {
            state = {
                ...state,
                [action.payload.key]: action.payload.value,
            };
        } else if (action.type === CLEAR) {
            state = {};
        }
        return state;
    }

    // Get value from datastore
    async get(query) {
        await this.ready;
        var self = this;
        if (Array.isArray(query)) {
            var promises = query.map((row) => self.get(row));
            return Promise.all(promises);
        }
        query = self.normalizeQuery(query);
        var key = self.toKey(query);

        if (self.debugLookup) {
            console.log("looking up " + key);
        }

        // Check storage first
        const kvp = this.getState().kvp;
        if (kvp[key]) {
            if (self.debugLookup) {
                console.log("in storage");
            }
            return kvp[key];
        } else {
            // Search ends here if query is a simple string
            if (typeof query == "string") {
                if (self.debugLookup) {
                    console.log("not found");
                }
                return null;
            }

            // More complex queries are assumed to be server requests
            return self.fetch(query, true);
        }
    }

    // Set value
    async set(query, value) {
        var self = this;
        var key = self.toKey(query);
        if (value === null) {
            if (self.debugLookup) {
                console.log("deleting " + key);
            }
            self.dispatch({
                type: REMOVE,
                payload: { key },
            });
            return;
        } else {
            if (self.debugLookup) {
                console.log("saving new value for " + key);
                if (self.debugValues) {
                    console.log(value);
                }
            }
            self.dispatch({
                type: SET,
                payload: { key, value },
            });
            return;
        }
    }

    // Callback for localStorage failure - override to inform the user
    storageFail(error) {
        console.warn("Error persisting store:");
        console.warn(error);
    }

    // Convert "/url" to {'url': "url"} (simplify common use case)
    normalizeQuery(query) {
        if (typeof query === "string" && query.charAt(0) == "/") {
            query = { url: query.replace(/^\//, "") };
        }
        return query;
    }

    // Helper to allow simple objects to be used as keys
    toKey(query) {
        var self = this;
        query = self.normalizeQuery(query);
        if (!query) {
            throw "Invalid query!";
        }
        if (typeof query == "string") {
            return query;
        } else {
            return new URLSearchParams(query).toString();
        }
    }

    // Helper to check existence of a key without loading the object
    exists(query) {
        var self = this;
        var key = self.toKey(query);
        return self.keys().then(function (keys) {
            var found = false;
            keys.forEach(function (k) {
                if (k === key) {
                    found = true;
                }
            });
            return found;
        });
    }

    // Fetch data from server
    fetch(query, cache) {
        var self = this;
        query = self.normalizeQuery(query);
        var key = self.toKey(query);
        var data = { ...self.defaults, ...query };
        var url = self.service;
        if (data.hasOwnProperty("url")) {
            url = url + "/" + data.url;
            delete data.url;
        }
        if (data.format && !self.formatKeyword) {
            url += "." + data.format;
            delete data.format;
        }

        if (this._promises[key]) {
            return this._promises[key];
        }

        if (self.debugNetwork) {
            console.log("fetching " + key);
        }

        var promise = self.ajax(url, data, "GET");
        this._promises[key] = promise.then(
            async (data) => {
                delete this._promises[key];
                if (!data) {
                    self.fetchFail(query, "Error parsing data!");
                    return;
                }
                if (self.debugNetwork) {
                    console.log("received result for " + key);
                    if (self.debugValues) {
                        console.log(data);
                    }
                }
                if (cache) {
                    await self.set(query, data);
                }
                return data;
            },
            (error) => {
                delete this._promises[key];
                console.error(error);
                self.fetchFail(query, "Error parsing data!");
            }
        );
        return this._promises[key];
    }

    // Hook to allow full AJAX customization
    ajax(url, data, method, headers) {
        var urlObj = new URL(url, window.location);
        if (!method) {
            method = "GET";
        } else {
            method = method.toUpperCase();
        }
        if (method == "GET") {
            Object.entries(data || {}).forEach(([key, value]) =>
                urlObj.searchParams.append(key, value)
            );
            data = null;
        }
        return fetch(urlObj, {
            method: method,
            body: data,
            headers: headers,
        }).then((response) => {
            if (response.ok) {
                if (response.status === 204) {
                    return null;
                } else {
                    return response.json();
                }
            } else {
                return response.text().then((result) => {
                    var error = new Error();
                    try {
                        error.json = JSON.parse(result);
                    } catch (e) {
                        error.text = result;
                    }
                    error.status = response.status;
                    throw error;
                });
            }
        });
    }

    // Callback for fetch() failures - override to inform the user
    fetchFail(query, error) {
        var self = this;
        var key = self.toKey(query);
        console.warn("Error loading " + key + ": " + error);
    }

    // Helper function for prefetching data
    prefetch(query) {
        var self = this;
        return self.fetch(query, true);
    }

    // Clear local caches
    async reset() {
        this.dispatch({ type: CLEAR });
        await this._persistor.purge();
    }

    // List storage keys matching this store's key prefix
    async keys() {
        return Object.keys(this.getState().kvp);
    }
}

var _stores = {};

// Hybrid module object provides/is a singleton instance...
var ds = new Store("main");

// ... and a way to retrieve/autoinit other stores
ds.getStore = getStore;
function getStore(name) {
    if (_stores[name]) {
        return _stores[name];
    } else {
        return new Store(name);
    }
}

export default ds;
export { getStore, Store };
