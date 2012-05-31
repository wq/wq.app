/* store
 * Locally-persistent, optionally server-populated JSON datastore(s)
 * (c) 2012 S. Andrew Sheppard
 */

define(['./lib/jquery', './online', './spinner', './console'], 
function($, ol, spin, console) {

// Hybrid module object provides/is a singleton instance...
var store = new _Store('main');

// ... and a way to retrieve/autoinit other stores
store.getStore = function(name) {
    if (_stores[name])
        return _stores[name];
    else
        return new _Store(name);
};

// Internal variables and functions
var _ls = window.localStorage;
var _stores;

function _Store(name) {
    if (!_stores)
        _stores = {};

    if (_stores[name])
        throw name + ' store already exists!';

    var self = _stores[name] = this;

    // Base URL of web service
    self.service     = undefined;
    self.saveMethod  = 'POST';
    
    // Default parameters (e.g f=json)
    self.defaults    = {}; 

    var _lsp     = name + '_'; // Used to prefix localstorage keys
    var _cache = {};           // Cache for JSON results
    var _index_cache = {};     // Cache for lists indexed by e.g. primary key
    var _group_cache = {};     // Cache for lists grouped by e.g. foreign key

    var _functions = {};       // Configurable functions to e.g. filter data by
    
    self.init = function(svc, defaults, opts) {
         if (svc !== undefined) self.service = svc;
         if (defaults)          self.defaults = defaults;
         if (!opts) return;

         if (opts.saveMethod)  self.saveMethod = opts.saveMethod;
         if (opts.parseData)   self.parseData = opts.parseData;
         if (opts.applyResult) self.applyResult = opts.applyResult;

         if (opts.batchService) {
             self.batchService = opts.batchService;
             if (opts.parseBatchResult)
                 self.parseBatchResult = opts.parseBatchResult;
             else
                 self.parseBatchResult = self.parseData;
         }
         if (opts.functions)
             _functions = opts.functions;
    };

    // Get value from datastore
    self.get = function(query, useservice) {
        // First argument is the lookup query
        var key = self.toKey(query);

        // Optional second argument determines when to fetch via ajax.
        //
        // undefined -> auto   (fetch only if query is not in local cache)
        //      true -> always (force refresh from server)
        //     false -> never  (directly return null if missing in cache)

        var usesvc = 'auto'; // Default
        if (useservice !== undefined)
            usesvc = (useservice ? 'always' : 'never');

        console.log('looking up ' + key);

        // First check JSON cache
        if (_cache[key] && usesvc != 'always') {
            console.log('in memory')
            return _cache[key];
        }

        // If that fails, check localStorage (if available)
        if (_ls && usesvc != 'always') {
            var item = _ls.getItem(_lsp + key);
            if (item) {
                _cache[key] = JSON.parse(item);
                console.log('in localStorage');
                // console.log(_cache[key]);
                return _cache[key];
            }
        }

        // Search ends here if query is a simple string
        if (typeof query == "string") {
            console.log('not found');
            return null;
        }
            
        // More complex queries are assumed to be server requests
        if (self.service !== undefined && usesvc != 'never') {
            console.log('on server');
            self.fetch(query);
            // console.log(_cache[key]);
            return _cache[key];
        }

        console.log('not found');
        return null;
    };

    // Get list from datastore, indexed by a unique attribute (e.g. primary key)
    self.getIndex = function(query, attr, usesvc) {
        var key = self.toKey(query);

        if (!_index_cache[key] || usesvc) {
           var list = self.get(query, usesvc);
           if (!list || !$.isArray(list))
              return null;
           _index_cache[key] = {};
           $.each(list, function(i, obj) {
               var id = obj[attr];
               if (id === undefined && _functions[attr])
                   id = self.compute(attr, obj);
               if (id !== undefined)
                   _index_cache[key][id] = obj;
           });
        }
        return _index_cache[key];
    };

    // Get list from datastore, grouped by an attribute (e.g. foreign key)
    self.getGroups = function(query, attr, usesvc) {
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
                        // Assume multivalued attribute (e.g. an M2M relationship)
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

    // Set value (locally)
    self.set = function(query, value) {
        key = self.toKey(query);
        if (value !== null) {
            console.log('saving new value for ' + key + ' to memory and localStorage');
            // console.log(value);
            _cache[key] = value;
            if (_ls) 
                _ls.setItem(_lsp + key, JSON.stringify(value));
        } else {
            console.log('deleting ' + key + ' from memory and localStorage');
            delete _cache[key];
            if (_ls)
                _ls.removeItem(_lsp + key);
        }
        // Force caches to be rebuilt on next use
        delete _index_cache[key];
        delete _group_cache[key];
    };

    // Helper to allow simple objects to be used as keys
    self.toKey = function(query) {
        if (!query)
            throw "Invalid query!";
        if (typeof query == "string")
            return query
         else
            return $.param(query);
    };
    
    // Filter an array of objects by one or more attributes
    self.filter = function(query, filter, any, usesvc) {
        if (!filter) {
            // No filter: return unmodified list directly
            return self.get(query, usesvc);

        } else if (any) {
            // any=true: Match on any of the provided filter attributes

            var result = [];
            for (attr in filter) {
                var group = self.getGroup(query, attr, filter[attr], usesvc);
                // Note: objects matching more than one attribute will be duplicated
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
            if (afilter.length == 0)
                return self.get(query, usesvc);

            // Use getGroup to filter list on first given attribute
            var f = afilter.shift();
            var group = self.getGroup(query, f.name, f.value, usesvc);

            // If only one filter attribute was given return the group as is
            if (afilter.length == 0)
                return group;

            // Otherwise continue to filter using the remaining attributes
            var result = [];
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
    }

    // Find an object by id 
    self.find = function(query, value, attr, usesvc) {
        if (!attr) attr = 'id';
        var ilist = self.getIndex(query, attr, usesvc);
        var key = self.toKey(query);
        console.log('finding item in ' + key + ' where ' + attr + '=' + value);
        if (ilist && ilist[value])
            return ilist[value];
        else
            return null;
    }

    // Apply a predefined function to a retreived item
    self.compute = function(fn, item) {
        if (_functions[fn])
            return _functions[fn](item);
        else
            return null;
    }

    // Fetch data from server
    self.fetch = function(query, async, callback, nocache) {
        if (!ol.online)
             throw "This function requires an Internet connection.";

        if (!async) spin.start();

        var data = $.extend({}, self.defaults, query);
        var url = self.service;
        if (data.url) {
            url = url + '/' + data.url;
            delete data.url;
        }

        $.ajax(url, {
            'data': data,
            'dataType': "json",
            'cache': false,
            'async': async ? true : false,
            'success': function(result) {
                if (!async) spin.stop();
                var data = self.parseData(result);
                if (data) {
                    if (async)
                        console.log("received async result");
                    if (!nocache)
                        self.set(query, data);
                    if (callback)
                        callback(data);
                } else
                    throw "Error parsing data!";
            },
            'error': function() {
                if (!async) spin.stop();
                throw "Unknown AJAX error!";
            }
        });
    };
    
    // Helper function for async requests
    self.prefetch = function(query, callback) {
        console.log("prefetching " + self.toKey(query));
        self.fetch(query, true, callback);
    };
    
    // Helper for partial list updates (useful for large lists)
    // Note: params should contain correct arguments to fetch only "recent"
    // items from server; idcol should be a unique identifier for the list
    self.fetchListUpdate = function(query, params, idcol, opts) {
        if (!query || !params || !idcol)
            throw "Missing required arguments!";
        // Retrieve current list
        var list = self.get(query, false);
        if (!list) {
            // No list locally, just do a full fetch
            self.fetch(query, opts ? opts.async : true,
                              opts ? opts.callback : null);
            return;
        }

        // Update local list with recent items from server
        var q = $.extend({}, query, params);
        self.fetch(q, opts ? opts.async : true, function(data) {
            self.updateList(query, data, idcol, opts);
            if (opts && opts.callback)
                opts.callback(data);
        }, true);
    };

    // Merge new/updated items into list
    self.updateList = function(query, data, idcol, opts) {
        var list = self.get(query);
        if (!$.isArray(list))
           throw "List is not an array";
        if (!$.isArray(data))
            throw "Data is not an array!";
        if (data.length == 0)
            return;
        if (opts && opts.prepend)
            data = data.reverse();

        $.each(data, function(i, obj) {
            var curobj = self.find(query, obj[idcol], idcol);
            if (curobj) {
                // Object exists in list already; update with new attrs
                $.extend(curobj, obj);
            } else {
                // Object does not exist in list; add to beginning/end
                if (opts && opts.prepend)
                    list.unshift(obj);
                else
                    list.push(obj);
            }
        });
        self.set(query, list);
    };

    // Process service fetch() results
    // (override if response data is in a child node)
    self.parseData = function(result) {
        // Default: assume JSON root is actual data
        return result;
    };

    // Queue data for server use; use outbox to cache unsaved items
    self.save = function(data, id, callback) {
        var outbox = self.get('outbox');
        if (!outbox)
            outbox = [];

        var item;
        if (id)
            item = self.find('outbox', id);
        
        if (item && !item.saved)
            // reuse existing item
            item.data = data;
        else {
            // create new item
            item = {
                data:  data,
                saved: false,
                id:    outbox.length + 1
            };
            outbox.push(item);
        }
        self.set('outbox', outbox);

        if (callback)
            self.sendItem(item.id, callback);
        else
            return item.id;
    };

    // Send a single item from the outbox to the server
    self.sendItem = function(id, callback, nospin) {
        var item = self.find('outbox', id);
        if (!item || item.saved) {
            if (callback) callback(null);
            return;
        } else if (!ol.online) {
            if (callback) callback(item);
            return;
        }

        var url = self.service;
        var method = self.saveMethod;
        var data = $.extend({}, item.data);
        if (data.url) {
            url = url + '/' + data.url;
            delete data.url;
        }
        if (data.method) {
            method = data.method;
            delete data.method;
        }
        if ($.param(self.defaults))
            url += '?' + $.param(self.defaults);

        if (!nospin) spin.start();
        $.ajax(url, {
            data: data,
            type: method,
            dataType: "json",
            async: true,
            success: function(result) {
                self.applyResult(item, result);
                // Re-save outbox to update caches
                self.set('outbox', self.get('outbox'));

                if (!nospin)  spin.stop();
                if (callback) callback(item);
            },
            error: function(jqxhr, status) {
                if (!nospin) spin.stop();
                if (jqxhr.responseText) {
                    try {
                        item.error = JSON.parse(jqxhr.responseText);
                    } catch (e) {
                        item.error = jqxhr.responseText
                    }
                } else {
                    item.error = status;
                }
                self.set('outbox', self.get('outbox'));
                if (callback) callback(item);
            }
        });
    };

    // Send all unsaved items to a batch service on the server
    self.sendBatch = function(callback) {
        var items = self.filter('outbox', {'saved': false});
        if (items.length == 0) {
            callback(true);
            return;
        }
        if (!ol.online) {
            callback(false);
            return;
        }

        var data   = [];
        $.each(items, function(i, item) {
            data.push(item.data);
        });

        var success = true;
        spin.start();
        $.ajax(self.batchService, {
            data: JSON.stringify(data),
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function(r) {
                var results = self.parseBatchResult(r);
                if (!results || results.length != items.length) {
                    spin.stop();
                    if (callback) callback(null);
                    return;
                }

                // Apply save results to individual items
                $.each(results, function(i) {
                    self.applyResult(items[i], results[i]);
                    if (!items[i].saved)
                        success = false;
                });
                // Re-save outbox to update caches
                self.set('outbox', self.get('outbox'));

                spin.stop();
                if (callback) callback(success);
            },
            error: function() {
                spin.stop();
                if (callback) callback(null);
            }
        });
    };
    
    // Send all unsaved items, using batch service if available
    self.sendAll = function(callback) {
        var outbox = self.get('outbox');
        if (!outbox) {
            if (callback) callback(true);
            return;
        }
          
        if (!ol.online) {
            if (callback) callback(false);
            return;
        }
        
        // Utilize batch service if it exists
        if (self.batchService) {
            self.sendBatch(callback);
            return;
        }

        // No batch service; emulate batch mode by sending each item to
        // the server and summarizing the result
        var items = self.filter('outbox', {'saved': false});
        var remain = items.length;
        if (remain == 0) {
            callback(true);
            return;
        }

        var success = true;
        spin.start();
        $.each(items, function(i, item) {
            self.sendItem(item.id, function(item) {
                if (!item)
                    success = null; // sendItem failed
                else if (success && !item.saved)
                    success = false; // sendItem did not result in save
                remain--;
                if (remain == 0) {
                    // After last sendItem is complete, wrap up
                    // (this should always execute, since sendItem calls back
                    //  even after an error)
                    spin.stop();
                    callback(success);
                }
            }, true);
        });
    };
    
    // Process service send() results
    // (override to apply additional result attributes to item,
    //  but be sure to set item.saved)
    self.applyResult = function(result, item) {
        // Default: assume non-empty result means the save was successful
        if (result)
            item.saved = true;
    };
    
    // Count of pending outbox items (never saved, or save was unsuccessful)
    self.unsaved = function() {
        return self.filter('outbox', {'saved': false}).length;
    }
    
    // Clear local caches
    self.reset = function() {
        _cache = {};
        _index_cache = {};
        _group_cache = {};
        if (_ls)
            _ls.clear(); // FIXME: what about other stores?!
    };

};

return store;

});
