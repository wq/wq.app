/*!
 * wq.app 1.0.0-dev - wq/model.js
 * A simple model API for working with stored lists
 * (c) 2012-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['./store', './json', './console'], function(ds, json, console) {

function model(config) {
    return new Model(config);
}

model.Model = Model;

model.cacheOpts = {
    // First page (e.g. 50 records) is stored locally; subsequent pages can be
    // loaded from server.
    'first_page': {
        'server': true,
        'client': true,
        'page': 1,
        'reversed': true
    },

    // All data is prefetched and stored locally, no subsequent requests are
    // necessary.
    'all': {
        'server': false,
        'client': true,
        'page': 0,
        'reversed': true
    },

    // "Important" data is cached; other data can be accessed via pagination.
    'filter': {
        'server': true,
        'client': true,
        'page': 0,
        'reversed': true
    },

    // No data is cached locally; all data require a network request.
    'none': {
        'server': true,
        'client': false,
        'page': 0,
        'reversed': true
    }
};

return model;

// Retrieve a stored list as an object with helper functions
//  - especially useful for server-paginated lists
//  - methods must be called asynchronously
function Model(config) {
    var self = this;
    if (!config) {
        throw "No configuration provided!";
    }
    if (typeof config == "string") {
        config = {'query': config};
    }

    if (!config.cache) {
        config.cache = 'first_page';
    }
    self.opts = model.cacheOpts[config.cache];
    if (!self.opts) {
        throw "Unknown cache option " + config.cache;
    }
    ['max_local_pages', 'partial', 'reversed'].forEach(function(name) {
        if (name in config) {
            throw '"' + name + '" is deprecated in favor of "cache"';
        }
    });

    // Default to main store, but allow overriding
    if (config.store) {
        if (config.store instanceof ds.constructor) {
            self.store = config.store;
        } else {
            self.store = ds.getStore(config.store);
        }
    } else {
        self.store = ds;
    }

    if (config.query) {
        self.query = self.store.normalizeQuery(config.query);
    } else if (config.url !== undefined) {
        self.query = {'url': config.url};
    } else {
        throw "Could not determine query for model!";
    }

    // Configurable functions to e.g. filter data by
    self.functions = config.functions || {};

    var _index_cache = {}; // Cache for list indexed by e.g. primary key
    var _group_cache = {}; // Cache for list grouped by e.g. foreign key

    function getPage(page_num, fn) {
        var query;
        if (typeof self.query == "string") {
            query = self.query;
        } else {
            query = json.extend({}, self.query);
            if (page_num !== null) {
                query.page = page_num;
            }
        }
        return fn(query).then(_processData).then(function(data) {
            if (page_num !== null && !data.page) {
                data.page = page_num;
            }
            return data;
        });
    }

    function _processData(data) {
        if (!data) {
            data = [];
        }
        if (json.isArray(data)) {
            data = {'list': data};
        }
        if (!data.pages) {
            data.pages = 1;
        }
        if (!data.count) {
            data.count = data.list.length;
        }
        if (!data.per_page) {
            data.per_page = data.list.length;
        }
        return data;
    }

    function resetCaches() {
        _index_cache = {};
        _group_cache = {};
    }

    self.load = function() {
        return getPage(null, self.store.get);
    };

    self.info = function() {
        return self.load().then(function(data) {
            return {
                'pages': data.pages,
                'per_page': data.per_page,
                'count': data.count,
                'config': config
            };
        });
    };

    // Load data for the given page number
    self.page = function(page_num) {
        var fn;
        if (!config.url || page_num <= self.opts.page) {
            // Store data locally
            fn = self.store.get;
        } else {
            // Fetch on demand but don't store
            fn = self.store.fetch;
        }
        return getPage(page_num, fn);
    };

    // Iterate across stored data
    self.forEach = function(cb, thisarg) {
        self.load().then(function(data) {
            data.list.forEach(cb, thisarg);
        });
    };

    // Find an object by id
    self.find = function(value, attr, localOnly) {
        if (!attr) {
            attr = 'id';
        }
        if (self.store.debugLookup) {
            var key = self.store.toKey(self.query);
            console.log('finding item in ' + key +
                        ' where ' + attr + '=' + value);
        }
        return self.getIndex(attr).then(function(ilist) {
            if (ilist && ilist[value]) {
                return json.extend(true, {}, ilist[value]);
            } else if (attr == "id" && value !== undefined) {
                // Not found in local list; try server
                if (!localOnly && self.opts.server && config.url) {
                    return self.store.fetch('/' + config.url + '/' + value);
                }
            }
            return null;
        });
    };

    // Filter an array of objects by one or more attributes
    self.filterPage = function(filter, any, localOnly) {

        // If partial list, we can never be 100% sure all filter matches are
        // stored locally. In that case, run query on server.
        if (!localOnly && self.opts.server && config.url) {
            // FIXME: won't work as expected if any == true
            var query = json.extend({'url': config.url}, filter);
            return self.store.fetch(query).then(_processData);
        }

        if (!filter || !Object.keys(filter).length) {
            // No filter: return unmodified list directly
            return self.load();

        } else if (any) {
            // any=true: Match on any of the provided filter attributes
            var results = Object.keys(filter).map(function(attr) {
                return self.getGroup(attr, filter[attr]);
            });
            return Promise.all(results).then(function(groups) {
                var result = [];
                // Note: might duplicate objects matching more than one filter
                groups.forEach(function(group) {
                    result = result.concat(group);
                });
                return json.extend(true, {}, _processData(result));
            });
        } else {
            // Default: require match on all filter attributes

            // Convert to array for convenience
            var afilter = [];
            for (var attr in filter) {
                afilter.push({'name': attr, 'value': filter[attr]});
            }

            // Use getGroup to filter list on first given attribute
            var f = afilter.shift();
            return self.getGroup(f.name, f.value).then(function(group) {
                // If only one filter attribute was given, return group as-is
                if (!afilter.length) {
                    return json.extend(true, {}, _processData(group));
                }

                var result = [];
                // Otherwise continue to filter using the remaining attributes
                group.forEach(function(obj) {
                    var match = true;
                    afilter.forEach(function(f) {
                        // FIXME: What about multi-valued filters?
                        if (f.value != obj[f.name]) {
                            match = false;
                        }
                    });
                    if (match) {
                        result.push(obj);
                    }
                });
                return json.extend(true, {}, _processData(result));
            });
        }
    };

    // Filter an array of objects by one or more attributes
    self.filter = function(filter, any, localOnly) {
        return self.filterPage(filter, any, localOnly).then(function(data) {
            return data.list;
        });
    };

    // Merge new/updated items into list
    self.update = function(update, idcol) {
        if (!json.isArray(update)) {
            throw "Data is not an array!";
        }
        if (!idcol) {
            idcol = 'id';
        }
        if (self.opts.reversed) {
            update = update.reverse();
        }
        update = update.filter(function(obj) {
            return obj && obj[idcol];
        });
        var updateById = {};
        update.forEach(function(obj) {
            updateById[obj[idcol]] = obj;
        });
        return self.load().then(function(data) {
            data.list.forEach(function(obj) {
                var id = obj[idcol];
                if (updateById[id]) {
                    json.extend(obj, updateById[id]);
                    delete updateById[id];
                }
            });
            update.forEach(function(obj) {
                if (!updateById[obj[idcol]]) {
                     return;
                }
                if (self.opts.reversed) {
                    data.list.unshift(obj);
                } else {
                    data.list.push(obj);
                }
            });
            return self.overwrite(data);
        });
    };

    self.remove = function(id, idcol) {
        if (!idcol) {
            idcol = 'id';
        }
        return self.load().then(function(data) {
            data.list = data.list.filter(function(obj) {
                return obj[idcol] != id;
            });
            return self.overwrite(data);
        });
    };

    // Overwrite entire list
    self.overwrite = function(data) {
        resetCaches();
        if (data.pages == 1 && data.list) {
            data.count = data.per_page = data.list.length;
        } else {
            data = _processData(data);
        }
        return self.store.set(self.query, data);
    };

    // Prefetch list
    self.prefetch = function() {
        resetCaches();
        return getPage(null, self.store.prefetch);
    };

    // Helper for partial list updates (useful for large lists)
    // Note: params should contain correct arguments to fetch only "recent"
    // items from server; idcol should be a unique identifier for the list
    self.fetchUpdate = function(params, idcol) {
        // Update local list with recent items from server
        var q = json.extend({}, self.query, params);
        return self.store.fetch(q).then(function(data) {
            return self.update(data, idcol);
        });
    };

    // Unsaved form items related to this list
    self.unsyncedItems = function() {
        // Note: wq/outbox needs to have already been loaded for this to work
        var outbox;
        try {
            outbox = require('wq/outbox');
        } catch(e) {
            return Promise.resolve([]);
        }
        return outbox.getOutbox(
            self.store
        ).unsyncedItems(self.query);
    };

    // Apply a predefined function to a retreived item
    self.compute = function(fn, item) {
        if (self.functions[fn]) {
            return self.functions[fn](item);
        } else {
            return null;
        }
    };

    // Get list from datastore, index by a unique attribute (e.g. primary key)
    self.getIndex = function(attr) {
        return self.load().then(function(data) {
            if (_index_cache[attr]) {
                return _index_cache[attr];
            }
            _index_cache[attr] = {};
            data.list.forEach(function(obj) {
                var id = obj[attr];
                if (id === undefined && self.functions[attr]) {
                    id = self.compute(attr, obj);
                }
                if (id !== undefined) {
                    _index_cache[attr][id] = obj;
                }
            });
            return _index_cache[attr];
        });
    };

    // Get list from datastore, grouped by an attribute (e.g. foreign key)
    self.getGroups = function(attr) {
        return self.load().then(function(data) {
            if (_group_cache[attr]) {
                return _group_cache[attr];
            }
            _group_cache[attr] = {};
            data.list.forEach(function(obj) {
                var value = obj[attr];
                if (value === undefined && self.functions[attr]) {
                    value = self.compute(attr, obj);
                }

                // Allow multivalued attribute (e.g. M2M relationship)
                if (!json.isArray(value)) {
                    value = [value];
                }
                value.forEach(function(v) {
                    if (!_group_cache[attr][v]) {
                        _group_cache[attr][v] = [];
                    }
                    _group_cache[attr][v].push(obj);
                });
            });
            return _group_cache[attr];
        });
    };

    // Get individual subset from grouped list
    self.getGroup = function(attr, value) {
        if (json.isArray(value)) {
            // Assume multivalued query, return all matching groups
            var results = value.map(function(v) {
                return self.getGroup(attr, v);
            });
            return Promise.all(results).then(function(groups) {
                var result = [];
                groups.forEach(function(group) {
                    result = result.concat(group);
                });
                return result;
            });
        }
        return self.getGroups(attr).then(function(groups) {
            if (groups && groups[value] && groups[value].length > 0) {
                return groups[value];
            } else {
                return [];
            }
        });
    };
}

});
