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
    self.service     = '/';
    
    // Default parameters (e.g f=json)
    self.defaults    = {}; 

    var _lsp     = name + '_'; // Used to prefix localstorage keys
    var _cache = {};           // Cache for JSON results
    var _index_cache = {};     // Cache for lists indexed by e.g. primary key
    var _group_cache = {};     // Cache for lists grouped by e.g. foreign key
    
    self.init = function(svc, defaults, parseData, applyResult) {
         if (svc)         self.service = svc;
         if (defaults)    self.defaults = defaults;
         if (parseData)   self.parseData = parseData;
         if (applyResult) self.applyResult = applyResult;
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
        if (self.service && usesvc != 'never') {
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
               _index_cache[key][obj[attr]] = obj;
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
                    if ($.isArray(obj[attr]))
                        // Assume multivalued attribute (e.g. an M2M relationship)
                        $.each(obj[attr], function(i, val) {
                           _addToCache(key, attr, val, obj);
                        });
                    else
                        _addToCache(key, attr, obj[attr], obj);

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

    // Process service fetch() results
    // (override if response data is in a child node)
    self.parseData = function(result) {
        // Default: assume JSON root is actual data
        return result;
    };

    // Queue data for server use; use outbox to cache unsaved items
    self.save = function(data, id, nospin) {
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
        self.send(nospin);
        // Reload item from outbox since it may have been altered by send()
        return self.find('outbox', item.id);
    };

    // Attempt to post queued data to server
    self.send = function(nospin) {
        var outbox = self.get('outbox');
        if (!outbox || outbox.length == 0 || !ol.online)
            return;
        
        if (!nospin) spin.start();
        var success = true;
        $.each(outbox, function(i, item) {
            if (!item || item.saved)
                return;
            var url = self.service;
            var data = $.extend({}, self.defaults, item.data);
            if (data.url) {
                url = url + '/' + data.url;
                delete data.url;
            }
            $.ajax(url, {
                data: data,
                type: "POST",
                dataType: "json",
                async: false,
                success: function(result) {
                    self.applyResult(item, result);
                    if (!item.saved)
                        success = false;
                },
                error: function() {
                    if (!nospin) spin.stop();
                    throw "Unknown AJAX error!";
                }
            });
        });
        self.set('outbox', outbox);
        if (!nospin) spin.stop();
        return success;
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
        var outbox = self.get('outbox');
        var count = 0;
        if (outbox)
            $.each(outbox, function (i, item) {
                if (!item.saved)
                    count++;
            });
        return count;
    }
    
    // Clear local cache
    self.reset = function() {
        _cache = {};
        if (_ls)
            _ls.clear(); // FIXME: what about other stores?!
    };

};

return store;

});
