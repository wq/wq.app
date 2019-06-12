import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
    bindActionCreators
} from 'redux';
import logger from 'redux-logger';
import localForage from 'localforage';
import memoryStorageDriver from 'localforage-memoryStorageDriver';
import 'whatwg-fetch';

// Internal variables and functions
var _verbosity = {
    Network: 1,
    Lookup: 2,
    Values: 3
};

localForage.defineDriver(memoryStorageDriver);

class Store {
    name;
    debug = false;
    // Base URL of web service
    service;
    // Default parameters (e.g f=json)
    defaults = {};

    // localForage instance
    lf = {};
    ready = {
        then: function() {
            throw new Error('Call init first!');
        }
    };

    // Registered redux functions
    #reducers = {};
    #middleware = [];
    #enhancers = [];
    #subscribers = [];
    #deferActions = [];

    #_promises = {}; // Save promises to prevent redundant fetches

    constructor(name) {
        if (_stores[name]) {
            throw name + ' store already exists!';
        }
        this.name = name;
        _stores[name] = this;
        this._tempLF();
        this.addReducer('kvp', (state = {}) => state);
    }

    init(opts = {}) {
        var self = this;
        var optlist = [
            'service',
            'defaults',
            'parseData',
            'storageFail',
            'fetchFail',
            // 'jsonp',  # FIXME: Restore or deprecate
            'ajax',
            'debug',
            'formatKeyword',
            'alwaysExtractBlobs',
            'getBlob',
            'setBlob',
            'removeBlob',
            'makeRef'
        ];
        optlist.forEach(function(opt) {
            if (opts.hasOwnProperty(opt)) {
                self[opt] = opts[opt];
            }
        });
        if (self.debug) {
            for (var level in _verbosity) {
                if (self.debug >= _verbosity[level]) {
                    self['debug' + level] = true;
                }
            }
            self.addMiddleware(logger);
        }

        self.ready = new Promise(resolve => this._ready(resolve));

        const reducer = combineReducers(this.#reducers);
        const enhancers = compose(
            ...this.#enhancers,
            applyMiddleware(...this.#middleware)
        );

        this._store = createStore(reducer, {}, enhancers);
        this.#subscribers.forEach(fn => this._store.subscribe(fn));
        this.#deferActions.forEach(this._store.dispatch);
    }

    dispatch(action) {
        if (this._store) {
            return this._store.dispatch(action);
        } else {
            this.#deferActions.push(action);
        }
    }

    subscribe(fn) {
        this.#subscribers.push(fn);
        if (this._store) {
            this._store.subscribe(fn);
        }
    }

    getState() {
        return this._store.getState();
    }

    addReducer(name, reducer) {
        this.#reducers[name] = reducer;
    }

    addMiddleware(middleware) {
        this.#middleware.push(middleware);
    }

    addEnhancer(enhancer) {
        this.#enhancers.push(enhancer);
    }

    bindActionCreators(actions) {
        return bindActionCreators(actions, this.dispatch.bind(this));
    }

    // Get value from datastore
    get(query) {
        var self = this;
        if (Array.isArray(query)) {
            var promises = query.map(row => self.get(row));
            return Promise.all(promises);
        }
        query = self.normalizeQuery(query);
        var key = self.toKey(query);

        if (self.debugLookup) {
            console.log('looking up ' + key);
        }

        // Check storage first
        var promise = self.lf.getItem(key).then(
            function(result) {
                if (!result) {
                    return fetchData();
                }
                if (self.debugLookup) {
                    console.log('in storage');
                }
                return result;
            },
            function() {
                return fetchData();
            }
        );

        function fetchData() {
            // Search ends here if query is a simple string
            if (typeof query == 'string') {
                if (self.debugLookup) {
                    console.log('not found');
                }
                return null;
            }

            // More complex queries are assumed to be server requests
            return self.fetch(query, true);
        }

        return promise;
    }

    // Set value
    set(query, value) {
        var self = this;
        var key = self.toKey(query);
        if (value === null) {
            if (self.debugLookup) {
                console.log('deleting ' + key);
            }
            return self.lf.removeItem(key);
        } else {
            if (self.debugLookup) {
                console.log('saving new value for ' + key);
                if (self.debugValues) {
                    console.log(value);
                }
            }
            return self.lf.setItem(key, value).then(
                function(d) {
                    return d;
                },
                function(err) {
                    return self.storageFail(value, err);
                }
            );
        }
    }

    // Callback for localStorage failure - override to inform the user
    storageFail(item, error) {
        var self = this;
        return self.storageUsage().then(function(usage) {
            var msg;
            if (usage > 0) {
                msg = 'Storage appears to be full.';
            } else {
                msg = 'Storage appears to be disabled.';
            }
            console.warn(msg + '  Caught Error:');
            console.warn((error && error.stack) || error);
            throw new Error(msg);
        });
    }

    storageUsage() {
        return _globalStorageUsage();
    }

    // Convert "/url" to {'url': "url"} (simplify common use case)
    normalizeQuery(query) {
        if (typeof query === 'string' && query.charAt(0) == '/') {
            query = { url: query.replace(/^\//, '') };
        }
        return query;
    }

    // Helper to allow simple objects to be used as keys
    toKey(query) {
        var self = this;
        query = self.normalizeQuery(query);
        if (!query) {
            throw 'Invalid query!';
        }
        if (typeof query == 'string') {
            return query;
        } else {
            return new URLSearchParams(query).toString();
        }
    }

    // Helper to check existence of a key without loading the object
    exists(query) {
        var self = this;
        var key = self.toKey(query);
        return self.keys().then(function(keys) {
            var found = false;
            keys.forEach(function(k) {
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
        if (data.hasOwnProperty('url')) {
            url = url + '/' + data.url;
            delete data.url;
        }
        if (data.format && !self.formatKeyword) {
            url += '.' + data.format;
            delete data.format;
        }

        if (this.#_promises[key]) {
            return this.#_promises[key];
        }

        if (self.debugNetwork) {
            console.log('fetching ' + key);
        }

        var promise = self.ajax(url, data, 'GET');
        this.#_promises[key] = promise.then(
            result => {
                var data = self.parseData(result);
                delete this.#_promises[key];
                if (!data) {
                    self.fetchFail(query, 'Error parsing data!');
                    return;
                }
                if (self.debugNetwork) {
                    console.log('received result for ' + key);
                    if (self.debugValues) {
                        console.log(data);
                    }
                }
                if (cache) {
                    return self.set(query, data);
                } else {
                    return data;
                }
            },
            error => {
                delete this.#_promises[key];
                console.error(error);
                self.fetchFail(query, 'Error parsing data!');
            }
        );
        return this.#_promises[key];
    }

    // Hook to allow full AJAX customization
    ajax(url, data, method, headers) {
        var self = this;
        var urlObj = new URL(url, window.location.origin);
        if (!method) {
            method = 'GET';
        } else {
            method = method.toUpperCase();
        }
        if (method == 'GET') {
            Object.entries(data || {}).forEach(([key, value]) =>
                urlObj.searchParams.append(key, value)
            );
            data = null;
        }
        return fetch(urlObj, {
            method: method,
            body: data,
            headers: headers
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.text().then(result => {
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
        console.warn('Error loading ' + key + ': ' + error);
    }

    // Helper function for prefetching data
    prefetch(query) {
        var self = this;
        return self.fetch(query, true);
    }

    // Process service fetch() results
    // (override if response data is in a child node)
    parseData(result) {
        // Default: assume JSON root is actual data
        return result;
    }

    // Clear local caches
    reset(all) {
        var self = this;
        if (all) {
            // Clear out everything - will affect other stores!
            return _clearAll();
        } else {
            // Only clear items for this store
            return self.lf.clear();
        }
    }

    // List storage keys matching this store's key prefix
    keys() {
        var self = this;
        return self.lf.keys();
    }

    _tempLF() {
        var self = this;
        ['getItem', 'setItem', 'removeItem', 'keys', 'clear'].forEach(function(
            key
        ) {
            self.lf[key] = function() {
                var args = arguments;
                return self.ready.then(function() {
                    return self.lf[key].apply(this, args);
                });
            };
        });
    }

    _ready(resolve) {
        var self = this,
            resolved = false;
        self.lf = localForage.createInstance({
            name: self.name
        });
        self.lf.ready().then(function() {
            self.lf
                .setItem('wq-store-test', true)
                .then(function() {
                    resolved = true;
                    return self.lf.removeItem('wq-store-test');
                })
                .then(resolve, fallback);
            // localForage.ready() failed for some reason
        }, fallback);

        setTimeout(function() {
            if (!resolved) {
                // localForage failed, and also failed to reject() for some
                // reason - this should be rare but has happened in the wild.
                console.error('Storage failed to initialize in 5 seconds');
                fallback();
            }
        }, 5000);

        function fallback() {
            if (!resolved) {
                if (self.debug) {
                    console.warn(
                        'Offline storage is not working; using in-memory store'
                    );
                }
                self.lf.setDriver(memoryStorageDriver._driver).then(resolve);
            }
            resolved = true;
        }
    }
}

// Simple computation for quota usage across stores
function _globalStorageUsage() {
    return Promise.all(
        Object.keys(_stores).map(function(storeName) {
            var lf = _stores[storeName].lf,
                keyPromise;
            try {
                keyPromise = lf.keys();
            } catch (e) {
                return 0;
            }
            keyPromise.then(function(keys) {
                var results = keys.map(function(key) {
                    return lf.getItem(key).then(function(item) {
                        // FIXME: This won't handle binary values
                        return JSON.stringify(item).length;
                    });
                });
                return Promise.all(results).then(function(lengths) {
                    var usage = 0;
                    lengths.forEach(function(l) {
                        usage += l;
                    });
                    // UTF-16 means two bytes per character in storage
                    // FIXME: Is this true for non-localStorage backends?
                    return usage * 2;
                });
            });
        })
    ).then(function(allResults) {
        var total = 0;
        allResults.forEach(function(result) {
            total += result;
        });
        return total;
    });
}

function _clearAll() {
    return Promise.all(
        Object.keys(_stores).map(function(storeName) {
            return _stores[storeName].reset();
        })
    );
}

var _stores = {};

// Hybrid module object provides/is a singleton instance...
var ds = new Store('main');

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
