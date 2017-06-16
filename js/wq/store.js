/*!
 * wq.app 1.0.0rc2 - wq/store.js
 * Locally-persistent, optionally server-populated JSON datastore(s)
 * (c) 2012-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['localforage', 'localforage-memoryStorageDriver',
        './json', './console'],
function(localForage, memoryStorageDriver, json, console) {

var _stores = {};

// Hybrid module object provides/is a singleton instance...
var store = new _Store('main');

// ... and a way to retrieve/autoinit other stores
store.getStore = function(name) {
    if (_stores[name]) {
        return _stores[name];
    } else {
        return new _Store(name);
    }
};

// Internal variables and functions
var _verbosity = {
    'Network': 1,
    'Lookup': 2,
    'Values': 3
};

localForage.defineDriver(
    memoryStorageDriver
);

return store;

function _Store(name) {
    if (_stores[name]) {
        throw name + ' store already exists!';
    }

    var self = _stores[name] = this;
    self.name = name;

    // Base URL of web service
    self.service = undefined;
    self.debug = false;

    // Default parameters (e.g f=json)
    self.defaults = {};

    var _promises = {}; // Save promises to prevent redundant fetches

    self.init = function(opts) {
        if (typeof opts == "string" || arguments.length > 1) {
            throw "ds.init() now takes a single configuration argument";
        }
        var optlist = [
            'service',
            'defaults',
            'parseData',
            'storageFail',
            'fetchFail',
            'jsonp',
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
        }

        self.ready = new Promise(_ready);
    };

    self.ready = {'then': function() {
        throw "Call init first!";
    }};

    // Get value from datastore
    self.get = function(query) {
        if (json.isArray(query)) {
            var promises = query.map(self.get);
            return Promise.all(promises);
        }
        query = self.normalizeQuery(query);
        var key = self.toKey(query);

        if (self.debugLookup) {
            console.log('looking up ' + key);
        }

        // Check storage first
        var promise = self.lf.getItem(key).then(function(result) {
            if (!result) {
                return fetchData();
            }
            if (self.debugLookup) {
                console.log('in storage');
            }
            return result;
        }, function() {
            return fetchData();
        });

        function fetchData() {
            // Search ends here if query is a simple string
            if (typeof query == "string") {
                if (self.debugLookup) {
                    console.log('not found');
                }
                return null;
            }

            // More complex queries are assumed to be server requests
            return self.fetch(query, true);
        }

        return promise;
    };

    // Set value
    self.set = function(query, value) {
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
            return self.lf.setItem(key, value).then(function(d) {
                return d;
            }, function(err) {
                self.storageFail(value, err);
            });
        }
    };

    // Callback for localStorage failure - override to inform the user
    self.storageFail = function(item, error) {
        /* jshint unused: false */
        self.storageUsage().then(function(usage) {
            var msg;
            if (usage > 0) {
                msg = "Storage appears to be full.";
            } else {
                msg = "Storage appears to be disabled.";
            }
            console.warn(msg + "  Caught Error:");
            console.warn(error && error.stack || error);
        });
    };

    self.storageUsage = _globalStorageUsage;

    // Convert "/url" to {'url': "url"} (simplify common use case)
    self.normalizeQuery = function(query) {
        if (typeof query === 'string' && query.charAt(0) == "/") {
            query = {'url': query.replace(/^\//, "")};
        }
        return query;
    };

    // Helper to allow simple objects to be used as keys
    self.toKey = function(query) {
        query = self.normalizeQuery(query);
        if (!query) {
            throw "Invalid query!";
        }
        if (typeof query == "string") {
            return query;
        } else {
            return json.param(query);
        }
    };

    // Helper to check existence of a key without loading the object
    self.exists = function(query) {
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
    };

    // Fetch data from server
    self.fetch = function(query, cache) {
        query = self.normalizeQuery(query);
        var key = self.toKey(query);
        var data = json.extend({}, self.defaults, query);
        var url = self.service;
        if (data.hasOwnProperty('url')) {
            url = url + '/' + data.url;
            delete data.url;
        }
        if (data.format && !self.formatKeyword) {
            url += '.' + data.format;
            delete data.format;
        }

        if (_promises[key]) {
            return _promises[key];
        }

        if (self.debugNetwork) {
            console.log("fetching " + key);
        }

        var promise = json.get(url, data, self.jsonp);
        _promises[key] = promise.then(function(result) {
            var data = self.parseData(result);
            delete _promises[key];
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
                return self.set(query, data);
            } else {
                return data;
            }
        },
        function() {
            delete _promises[key];
            self.fetchFail(query, "Error parsing data!");
        });
        return _promises[key];
    };

    // Callback for fetch() failures - override to inform the user
    self.fetchFail = function(query, error) {
        var key = self.toKey(query);
        console.warn("Error loading " + key + ": " + error);
    };

    // Helper function for prefetching data
    self.prefetch = function(query) {
        return self.fetch(query, true);
    };

    // Process service fetch() results
    // (override if response data is in a child node)
    self.parseData = function(result) {
        // Default: assume JSON root is actual data
        return result;
    };

    // Clear local caches
    self.reset = function(all) {
        if (all) {
            // Clear out everything - will affect other stores!
            return _clearAll();
        } else {
            // Only clear items for this store
            return self.lf.clear();
        }
    };

    // List storage keys matching this store's key prefix
    self.keys = function() {
        return self.lf.keys();
    };

    self.lf = {};
    [
        'getItem', 'setItem', 'removeItem', 'keys', 'clear'
    ].forEach(function(key) {
        self.lf[key] = function() {
            var args = arguments;
            return self.ready.then(function() {
                return self.lf[key].apply(this, args);
            });
        };
    });

    function _ready(resolve) {
        var resolved = false;
        self.lf = localForage.createInstance({
            'name': self.name
        });
        self.lf.ready().then(function() {
            self.lf.setItem('wq-store-test', true).then(function() {
                resolved = true;
                return self.lf.removeItem('wq-store-test');
            }).then(resolve, fallback);
        // localForage.ready() failed for some reason
        }, fallback);

        setTimeout(function() {
            if (!resolved) {
                // localForage failed, and also failed to reject() for some
                // reason - this should be rare but has happened in the wild.
                console.error("Storage failed to initialize in 5 seconds");
                fallback();
            }
        }, 5000);

        function fallback() {
            if (!resolved) {
                if (self.debug) {
                    console.warn(
                        "Offline storage is not working; using in-memory store"
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
    return Promise.all(Object.keys(_stores).map(function(storeName) {
        var lf = _stores[storeName].lf;
        return lf.keys().then(function(keys) {
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
    })).then(function(allResults) {
        var total = 0;
        allResults.forEach(function(result) {
            total += result;
        });
        return total;
    });
}

function _clearAll() {
    return Promise.all(Object.keys(_stores).map(function(storeName) {
        return _stores[storeName].reset();
    }));
}

});
