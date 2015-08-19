/*!
 * wq.app 0.8.1-dev - wq/store.js
 * Locally-persistent, optionally server-populated JSON datastore(s)
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global Promise */

define(['localforage', './json', './console', 'es5-shim'],
function(lf, json, console) {

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

    var _prefix = name + '_'; // Used to prefix keys
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

        self.ready = lf.ready().then(function() {
            return lf.setItem('wq-store-test', true).then(function() {
                // localForage is available; continue as normal

                // Disable blob extraction if it's not needed
                return lf.supportsBlobs().then(function(supportsBlobs) {
                    if (!self.alwaysExtractBlobs && supportsBlobs) {
                        _setItemFn = _setItem = lf.setItem.bind(lf);
                        _getItemFn = _getItem = lf.getItem.bind(lf);
                        _removeItemFn = _removeItem = lf.removeItem.bind(lf);
                        _keysFn = _keys = lf.keys.bind(lf);
                    }
                });
            }, _inMemoryFallback);
        }, _inMemoryFallback);
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
        var promise = _getItem(_prefix + key).then(function(result) {
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
            return _removeItem(_prefix + key);
        } else {
            if (self.debugLookup) {
                console.log('saving new value for ' + key);
                if (self.debugValues) {
                    console.log(value);
                }
            }
            return _setItem(_prefix + key, value).then(function(d) {
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

    // Simple computation for quota usage
    self.storageUsage = function() {
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
    };

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
            return lf.clear();
        } else {
            // Only clear items matching this store's key prefix
            self.keys().then(function(keys) {
                return Promise.all(keys.map(function(key) {
                    return _removeItem(_prefix + key);
                }));
            });
        }
    };

    // List storage keys matching this store's key prefix
    self.keys = function() {
        return _keys().then(function(keys) {
            return keys.filter(function(key) {
                return key.indexOf(_prefix) === 0;
            }).map(function(key){
                return key.replace(_prefix, "");
            });
        });
    };

    // Some localForage drivers (i.e. localStorage and WebSQL) require
    // serialization of Blob values.  localForage does this automatically, but
    // not for Blobs nested within other Objects.  As a workaround, extract
    // any blobs into separate keys and replace them with references ("refs").
    // When indexedDB is universally supported, the following can be removed.

    // Override the following to save blobs somewhere else.
    self.getBlob = function(ref) {
        return lf.getItem(_prefix + ref);
    };
    self.setBlob = function(ref, blob) {
        return lf.setItem(_prefix + ref, blob);
    };
    self.removeBlob = function(ref) {
        return lf.removeItem(_prefix + ref);
    };
    self.makeRef = function(blob) {
         /* jshint unused: false */
         return Promise.resolve('blob' + Math.round(
             Math.random() * 100000000
         ));
    };

    // localForage function proxies
    // (twice-wrapped since self.ready may overwrite implementation.)
    function _getItem(key) {
        return self.ready.then(function() {
            return _getItemFn(key);
        });
    }
    function _getItemFn(key) {
        return lf.getItem(key).then(function(value) {
            return _insertBlobs(value);
        });
    }

    function _setItem(key, newValue) {
        return self.ready.then(function() {
            return _setItemFn(key, newValue);
        });
    }
    function _setItemFn(key, newValue) {
        // Extract blobs and also load previous value into memory to see if
        // there are any refs that need updating.
        return Promise.all([
            _extractBlobs(newValue),
            lf.getItem(key)
        ]).then(function(values) {
            var newRefs = _findRefs(values[0]);
            var oldRefs = _findRefs(values[1]);
            return _cleanupBlobs(oldRefs, newRefs).then(function() {
                return lf.setItem(key, values[0]);
            });
        });
    }

    function _removeItem(key) {
        return self.ready.then(function() {
            return _removeItemFn(key);
        });
    }
    function _removeItemFn(key) {
        return lf.getItem(key).then(function(oldValue) {
            var oldRefs = _findRefs(oldValue);
            return _cleanupBlobs(oldRefs, []).then(function() {
                return lf.removeItem(key);
            });
        });
    }

    function _keys() {
        return self.ready.then(function() {
            return _keysFn();
        });
    }

    function _keysFn() {
        return lf.keys();
    }

    // Recursively extract blobs into separate values & replace with refs
    function _extractBlobs(value) {
        if (!(value instanceof Object) || !window.Blob) {
            return Promise.resolve(value);
        } else if (json.isArray(value)) {
            return Promise.all(value.map(_extractBlobs));
        } else if (value instanceof Blob) {
            if (value._ref) {
                if (self.debugValues) {
                     console.log('blob already saved: ' + value._ref);
                }
                return Promise.resolve('_ref_' + value._ref);
            }
            return self.makeRef(value).then(function(ref) {
                if (self.debugValues) {
                     console.log('saving blob ' + ref);
                }
                return self.setBlob(ref, value).then(function() {
                    return '_ref_' + ref;
                });
            });
        }
        var keys = Object.keys(value);
        var results = keys.map(function(key) {
            return _extractBlobs(value[key]);
        });
        return Promise.all(results).then(function(values) {
            var result = {};
            values.forEach(function(value, i) {
                var key = keys[i];
                result[key] = value;
                // Check for and propagate _nested property
                if (!json.isArray(value)) {
                    value = [value];
                }
                value.forEach(function(val) {
                    if (!val) {
                        return;
                    }
                    if ((val.match && val.match(/^_ref_/)) || val._nested) {
                        result._nested = true;
                    }
                });
            });
            return result;
        });
    }

    // Recursively replace refs with associated blobs
    function _insertBlobs(value) {
        var match = value && value.match && value.match(/^_ref_(.+)/);
        var ref = match && match[1];
        if (ref) {
            if (self.debugValues) {
                 console.log('loading blob ' + ref);
            }
            return lf.getItem(_prefix + ref).then(function(blob) {
                if (blob) {
                    blob._ref = ref;
                }
                return blob;
            });
        } else if (json.isArray(value)) {
            return Promise.all(value.map(_insertBlobs));
        } else if (!(value instanceof Object) || !value._nested) {
            return Promise.resolve(value);
        }
        var keys = Object.keys(value);
        var results = keys.map(function(key) {
            return _insertBlobs(value[key]);
        });
        return Promise.all(results).then(function(values) {
            var result = {};
            values.forEach(function(value, i) {
                if (keys[i] == "_nested") {
                   return;
                }
                result[keys[i]] = value;
            });
            return result;
        });
    }

    // List all refs in object (and any nested objects)
    function _findRefs(value) {
        var match = value && value.match && value.match(/^_ref_(.+)/);
        var refs = [];
        if (match) {
            return [match[1]];
        }
        if (json.isArray(value)) {
            value.map(_findRefs).forEach(function(r) {
                refs = refs.concat(r);
            });
            return refs;
        }
        if (!(value instanceof Object) || !value._nested) {
            return [];
        }
        Object.keys(value).forEach(function(key) {
            refs = refs.concat(_findRefs(value[key]));
        });
        return refs;
    }

    // Clean up refs after an update
    function _cleanupBlobs(oldRefs, newRefs) {
        var newRefMap = {};
        newRefs.forEach(function(ref) {
            newRefMap[ref] = true;
        });
        var deletedRefs = oldRefs.filter(function(ref) {
            return !(newRefMap[ref]);
        });
        return Promise.all(deletedRefs.map(function(ref) {
            if (self.debugValues) {
                 console.log('deleting blob ' + ref);
            }
            return self.removeBlob(ref);
        }));
    }

    function _inMemoryFallback() {
        // localForage isn't working for whatever reason
        // Replace with in-memory store to avoid breaking other code
        if (self.debug) {
            console.warn(
                "localForage is not working; using in-memory store"
            );
        }
        var inMemoryStore = {};
        _setItemFn = _setItem = function(key, value) {
            inMemoryStore[key] = value;
            return Promise.resolve(value);
        };
        _getItemFn = _getItem = function(key) {
            if (inMemoryStore.hasOwnProperty(key)) {
                return Promise.resolve(inMemoryStore[key]);
            }
            return Promise.resolve(null);
        };
        _removeItemFn = _removeItem = function(key) {
            delete inMemoryStore[key];
            return Promise.resolve();
        };
        _keysFn = _keys = function() {
            return Promise.resolve(Object.keys(inMemoryStore));
        };
    }
}

});
