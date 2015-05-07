/*!
 * wq.app 0.8.0-dev - wq/model.js
 * A simple model API for working with stored lists
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['./store'], function(ds) {

function model(config) {
    return new Model(config);
}

model.Model = Model;

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
    if (!config.max_local_pages) {
        config.max_local_pages = 1;
    }

    // Default to main store, but allow overriding
    self.store = config.store || ds;
    
    if (config.query) {
        self.query = self.store.normalizeQuery(config.query);
    } else if (config.url) {
        self.query = {'url': config.url};
    } else {
        throw "Could not determine query for model!";
    }

    // Configurable functions to e.g. filter data by
    self.functions = config.functions || {};

    var _index_cache = {}; // Cache for list indexed by e.g. primary key
    var _group_cache = {}; // Cache for list grouped by e.g. foreign key

    function getPage(page_num, fn) {
        var query = {};
        for (var key in self.query) {
            query[key] = self.query[key];
        }
        if (page_num > 1) {
            query.page = page_num;
        }
        if (!fn) {
            fn = self.store.get;
        }
        return fn(query);
    }

    function resetCaches() {
        _index_cache = {};
        _group_cache = {};
    }

    self.load = function() {
        return getPage(1).then(function(data) {
            if (!data) {
                data = [];
            }
            if ($.isArray(data)) {
                data = {'list': data};
            }
            if (!data.pages) {
                data.pages = 1;
            }
            if (!data.per_page) {
                data.per_page = data.length;
            }
            if (!data.count) {
                data.count = data.length;
            }
            return data;
        });
    };

    self.info = function() {
        return self.load().then(function(data) {
            return {
                'pages': data.pages,
                'per_page': data.per_page,
                'count': data.count
            };
        });
    };

    // Load data for the given page number
    self.page = function(page_num) {
        var fn;
        if (!config.url || page_num <= config.max_local_pages) {
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
    self.find = function(value, attr) {
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
                return ilist[value];
            } else {
                // Not found in local list; try server
                if (attr == "id" && config.partial && config.url) {
                    return self.store.fetch('/' + config.url + '/' + value);
                }
            }
            return null;
        });
    };

    // Filter an array of objects by one or more attributes
    self.filter = function(query, filter, any, usesvc) {
        var result = [], group, attr;
        if (!filter) {
            // No filter: return unmodified list directly
            return self.get(query, usesvc);

        } else if (any) {
            // any=true: Match on any of the provided filter attributes

            for (attr in filter) {
                group = self.getGroup(query, attr, filter[attr], usesvc);
                // Note: might duplicate objects matching more than one filter
                result = result.concat(group);
            }
            return result;

        } else {
            // Default: require match on all filter attributes

            // Convert to array for convenience
            var afilter = [];
            for (attr in filter)
                afilter.push({'name': attr, 'value': filter[attr]});

            // Empty filter: return unmodified list directly
            if (!afilter.length)
                return self.get(query, usesvc);

            // Use getGroup to filter list on first given attribute
            var f = afilter.shift();
            group = self.getGroup(query, f.name, f.value, usesvc);

            // If only one filter attribute was given return the group as is
            if (!afilter.length)
                return group;

            // Otherwise continue to filter using the remaining attributes
            $.each(group, function(i, obj) {
                var match = true;
                $.each(afilter, function(i, f) {
                    if (f.value != obj[f.name])
                        match = false;
                });
                if (match)
                    result.push(obj);
            });
            return result;
        }
    };

    // Merge new/updated items into list
    self.update = function(update, idcol) {
        if (!$.isArray(update))
            throw "Data is not an array!";
        if (!idcol)
            idcol = 'id';
        if (config.reversed)
            update = update.reverse();
        var updateById = {};
        update.forEach(function(obj) {
            updateById[obj[idcol]] = obj;
        });
        return self.load().then(function(data) {
            data.list.forEach(function(obj) {
                var id = obj[idcol];
                if (updateById[id]) {
                    $.extend(obj, updateById[id]);
                    delete updateById[id];
                }
            });
            update.forEach(function(obj) {
                if (!updateById[obj[idcol]]) {
                     return;
                }
                if (config.reversed) {
                    data.list.shift(obj);
                } else {
                    data.list.push(obj);
                }
            });
            return self.overwrite(data).then(function() {
                return data.list;
            });
        });
    };

    // Overwrite entire list
    self.overwrite = function(data) {
        resetCaches();
        return self.store.set(self.query, data);
    };

    // Prefetch list
    self.prefetch = function() {
        resetCaches();
        return getPage(1, self.store.prefetch);
    };

    // Helper for partial list updates (useful for large lists)
    // Note: params should contain correct arguments to fetch only "recent"
    // items from server; idcol should be a unique identifier for the list
    self.fetchUpdate = function(params, idcol) {
        // Update local list with recent items from server
        var q = $.extend({}, self.query, params);
        return self.store.fetch(q).then(function(data) {
            return self.update(data, idcol);
        });
    };

    // Unsaved form items related to this list
    self.unsavedItems = function() {
        return require('./outbox').unsavedItems(self.query);
    };

    // Apply a predefined function to a retreived item
    self.compute = function(fn, item) {
        if (self.functions[fn])
            return self.functions[fn](item);
        else
            return null;
    };

    // Get list from datastore, index by a unique attribute (e.g. primary key)
    self.getIndex = function(attr) {
        return self.load().then(function(data) {
            if (!_index_cache[attr]) {
                _index_cache[attr] = {};
                data.list.forEach(function(obj) {
                    var id = obj[attr];
                    if (id === undefined && self.functions[attr])
                        id = self.compute(attr, obj);
                    if (id !== undefined)
                        _index_cache[attr][id] = obj;
                });
            }
            return _index_cache[attr];
        });
    };

    // Get list from datastore, grouped by an attribute (e.g. foreign key)
    self.getGroups = function(attr) {
        query = self.normalizeQuery(query);
        var key = self.toKey(query);

        if (!_group_cache[key] || !_group_cache[key][attr] || usesvc) {
            var list = self.get(query, usesvc);
            if (!list || !$.isArray(list))
                return null;

            if (!_group_cache[key])
                _group_cache[key] = {};

            if (!_group_cache[key][attr]) {
                _group_cache[key][attr] = {};
                $.each(list, function (i, obj) {
                    var value = obj[attr];
                    if (value === undefined && _functions[attr])
                        value = self.compute(attr, obj);

                    if ($.isArray(value))
                        // Assume multivalued attribute (e.g. M2M relationship)
                        $.each(value, function(i, v) {
                            _addToCache(key, attr, v, obj);
                        });
                    else
                        _addToCache(key, attr, value, obj);

                });
            }

        }

        return _group_cache[key][attr];

        // Internal function
        function _addToCache(key, attr, val, obj) {
            if (!_group_cache[key][attr][val])
                _group_cache[key][attr][val] = [];
            _group_cache[key][attr][val].push(obj);
        }
    };

    // Get individual subset from grouped list
    self.getGroup = function(query, attr, value, usesvc) {
        if ($.isArray(value)) {
            // Assume multivalued query, return all matching groups
            var result = [];
            $.each(value, function(i, v) {
                var group = self.getGroup(query, attr, v, usesvc);
                result = result.concat(group);
            });
            return result;
        }
        var groups = self.getGroups(query, attr, usesvc);
        if (groups && groups[value] && groups[value].length > 0)
            return groups[value];
        else
            return [];
    };
}

});
