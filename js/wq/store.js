/*!
 * wq.app 0.6.0-dev - store.js
 * Locally-persistent, optionally server-populated JSON datastore(s)
 * (c) 2012-2014, S. Andrew Sheppard
 * http://wq.io/license
 */

/* global FileUploadOptions */
/* global FileTransfer */

define(['jquery', './online', './console', 'es5-shim'],
function($, ol, console) {

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
var _ls = 'localStorage' in window && window.localStorage;
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
    self.debug       = false;

    // Default parameters (e.g f=json)
    self.defaults    = {};

    var _lsp     = name + '_'; // Used to prefix localstorage keys
    var _cache = {};           // Cache for JSON results
    var _index_cache = {};     // Cache for lists indexed by e.g. primary key
    var _group_cache = {};     // Cache for lists grouped by e.g. foreign key

    var _functions = {};       // Configurable functions to e.g. filter data by
    var _callback_queue = {};  // Queue callbacks to prevent redundant fetches

    self.init = function(svc, defaults, opts) {
        if (svc !== undefined) self.service = svc;
        if (defaults)          self.defaults = defaults;
        if (!opts) return;

        var optlist = [
            'saveMethod',
            'parseData',
            'applyResult',
            'localStorageFail',
            'jsonp',
            'debug',
            'formatKeyword'
        ];
        optlist.forEach(function(opt) {
            if (opts.hasOwnProperty(opt))
                self[opt] = opts[opt];
        });

        if (opts.batchService) {
            self.batchService = opts.batchService;
            if (opts.parseBatchResult)
                self.parseBatchResult = opts.parseBatchResult;
            else
                self.parseBatchResult = self.parseData;
        }
        if (opts.functions)
            _functions = opts.functions;

        if (!_ls)
            self.localStorageFail();
    };

    // Get value from datastore
    self.get = function(query, useservice) {
        // First argument is the lookup query
        query = self.firstPageQuery(query);
        var key = self.toKey(query);

        // Optional second argument determines when to fetch via ajax.
        //
        // undefined -> auto   (fetch only if query is not in local cache)
        //      true -> always (force refresh from server)
        //     false -> never  (directly return null if missing in cache)

        var usesvc = 'auto'; // Default
        if (useservice !== undefined)
            usesvc = (useservice ? 'always' : 'never');

        if (self.debug)
            console.log('looking up ' + key);

        // First check JSON cache
        if (_cache[key] && usesvc != 'always') {
            if (self.debug)
                console.log('in memory');
            return _cache[key];
        }

        // If that fails, check localStorage (if available)
        if (_ls && usesvc != 'always') {
            var item = _ls.getItem(_lsp + key);
            if (item) {
                _cache[key] = JSON.parse(item);
                if (self.debug) {
                    console.log('in localStorage');
                    console.log(_cache[key]);
                }
                return _cache[key];
            }
        }

        // Search ends here if query is a simple string
        if (typeof query == "string") {
            if (self.debug)
                console.log('not found');
            return null;
        }

        // More complex queries are assumed to be server requests
        if (self.service !== undefined && usesvc != 'never') {
            if (self.debug)
                console.log('on server');
            self.fetch(query);
            if (self.debug)
                console.log(_cache[key]);
            return _cache[key];
        }

        if (self.debug)
            console.log('not found');
        return null;
    };

    // Retrieve a stored list as an object with helper functions
    //  - especially useful for server-paginated lists
    //  - must be called asynchronously
    self.getList = function(basequery, callback) {
        var pageinfo = self.getPageInfo(basequery);

        if (!pageinfo && !self.exists(basequery)) {
            // Initialize first page before continuing
            self.prefetch(basequery, function() {
                self.getList(basequery, callback);
            });
            return;
        }

        var list = {};
        if (pageinfo) {
            // List has pagination info; create helper functions that
            // automatically generate as many page queries as needed.
            list.info = pageinfo;

            // Get full query for a given page number
            list.getQuery = function(page_num) {
                var query = {};
                for (var key in basequery)
                    query[key] = basequery[key];
                query.page = page_num;
                return query;
            };

            // Load data for the given page number
            list.page = function(page_num) {
                if (page_num < 1 || page_num > pageinfo.pages)
                    return [];
                var query = list.getQuery(page_num);
                var result = [].concat(self.get(query));
                result.info = list.info;
                return result;
            };

            // Find object in any page
            list.find = function(value, attr, usesvc, max_pages) {
                if (!max_pages || max_pages > pageinfo.pages)
                    max_pages = pageinfo.pages;
                for (var p = 1; p <= max_pages; p++) {
                    var query = list.getQuery(p);
                    var obj = self.find(query, value, attr, usesvc);
                    if (obj)
                        return obj;
                }
                return null;
            };

            // Filter across all pages
            list.filter = function(filter, any, usesvc, max_pages) {
                var result = [];
                if (!max_pages || max_pages > pageinfo.pages)
                    max_pages = pageinfo.pages;
                for (var p = 1; p <= max_pages; p++) {
                    var query = list.getQuery(p);
                    result = result.concat(
                        self.filter(query, filter, any, usesvc)
                    );
                }
                result.info = {
                    'pages':    1,
                    'per_page': result.length,
                    'count':    result.length
                };
                return result;
            };

            // Update list, across all pages
            list.update = function(items, key, prepend) {
                var query, opts;

                // Only update existing items found in each page
                for (var p = 1; p < pageinfo.pages; p++) {
                    query = list.getQuery(p);
                    items = self.updateList(
                        query, items, key, {'updateOnly': true}
                    );
                }

                // Add any remaining items to last or first page
                if (items.length > 0) {
                    // FIXME: this could result in the page having more than
                    // pageinfo.per_page items
                    if (prepend) {
                        query = list.getQuery(1);
                        opts = {'prepend': true};
                    } else {
                        query = list.getQuery(pageinfo.pages);
                        opts = {};
                    }
                    items = self.updateList(query, items, key, opts);
                }
            };

            // Prefetch all pages
            list.prefetch = function(fn) {
                var pending = pageinfo.pages;
                function callback() {
                    pending--;
                    if (!pending && fn)
                        fn();
                }
                for (var p = 1; p <= pageinfo.pages; p++) {
                    var query = list.getQuery(p);
                    self.prefetch(query, callback);
                }
            };

            // Iterate across all pages
            list.forEach = function(cb, thisarg) {
                for (var p = 1; p <= pageinfo.pages; p++) {
                    var query = list.getQuery(p);
                    var data = self.get(query);
                    data.forEach(cb, thisarg);
                }
            };

        } else {
            // List does not have pagination info,
            // create a compatible wrapper around query result
            var actual_list = self.get(basequery);
            list.info = {
                'pages':    1,
                'per_page': actual_list.length,
                'count':    actual_list.length
            };
            list.page = function(page_num) {
                if (page_num != 1)
                    return [];
                var result = [].concat(self.get(basequery));
                result.info = list.info;
                return result;
            };
            list.find = function(value, attr, usesvc, max_pages) {
                /* jshint unused: false */
                return self.find(basequery, value, attr, usesvc);
            };
            list.filter = function(filter, any, usesvc, max_pages) {
                /* jshint unused: false */
                var result = self.filter(basequery, filter, any, usesvc);
                result.info = {
                    'pages':    1,
                    'per_page': result.length,
                    'count':    result.length
                };
                return result;
            };
            list.update = function(items, key, opts) {
                self.updateList(basequery, items, key, opts);
            };
            list.prefetch = function(callback) {
                self.prefetch(basequery, callback);
            };
            list.forEach = function(cb, thisarg) {
                actual_list.forEach(cb, thisarg);
            };
        }

        // Unsaved form items related to this list
        list.unsavedItems = function() {
            return self.unsavedItems(basequery);
        };

        callback(list);
    };

    // Get list from datastore, index by a unique attribute (e.g. primary key)
    self.getIndex = function(query, attr, usesvc) {
        query = self.firstPageQuery(query);
        var key = self.toKey(query);

        if (!_index_cache[key] || !_index_cache[key][attr] || usesvc) {
            var list = self.get(query, usesvc);
            if (!list || !$.isArray(list))
                return null;
            if (!_index_cache[key])
                _index_cache[key] = {};
            _index_cache[key][attr] = {};
            $.each(list, function(i, obj) {
                var id = obj[attr];
                if (id === undefined && _functions[attr])
                    id = self.compute(attr, obj);
                if (id !== undefined)
                    _index_cache[key][attr][id] = obj;
            });
        }
        return _index_cache[key][attr];
    };

    // Get list from datastore, grouped by an attribute (e.g. foreign key)
    self.getGroups = function(query, attr, usesvc) {
        query = self.firstPageQuery(query);
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

    // Set value (locally)
    self.set = function(query, value, memonly) {
        var key = self.toKey(query);
        if (value !== null) {
            if (self.debug) {
                console.log('saving new value for ' + key);
                console.log(value);
            }
            _cache[key] = value;
            if (_ls && !memonly) {
                var val = JSON.stringify(value);
                var lskey = _lsp + key;
                try {
                    _ls.setItem(lskey, val);
                } catch (e) {
                    // Probably QUOTA_EXCEEDED_ERR, try removing and setting
                    // again (in case old item is being counted against quota)
                    _ls.removeItem(lskey);
                    try {
                        _ls.setItem(lskey, val);
                    } catch (err) {
                        // No luck, report error and stop using localStorage
                        self.localStorageFail(val, err);
                        _ls = false;
                    }
                }
            }
        } else {
            if (self.debug)
                console.log('deleting ' + key);
            delete _cache[key];
            if (_ls && !memonly)
                _ls.removeItem(_lsp + key);
        }
        // Force caches to be rebuilt on next use
        delete _index_cache[key];
        delete _group_cache[key];
    };

    // Callback for localStorage failure - override to inform the user
    self.localStorageFail = function(item, error) {
        /* jshint unused: false */
        if (self.localStorageUsage() > 0)
            console.warn("localStorage appears to be full.");
        else
            console.warn("localStorage appears to be disabled.");
    };

    // Simple computation for quota usage
    self.localStorageUsage = function() {
        if (!_ls)
            return null;
        var usage = 0;
        for (var key in _ls) {
            usage += _ls.getItem(key).length;
        }
        // UTF-16 means two bytes per character in storage - at least on webkit
        return usage * 2;
    };

    // Ensure single-page lists are retrieved correctly
    self.firstPageQuery = function(query) {
        if (typeof query !== 'string' && !query.page) {
            var pageinfo = self.getPageInfo(query);
            if (pageinfo && pageinfo.pages == 1)
                query.page = 1;
        }
        return query;
    };

    // Helper to allow simple objects to be used as keys
    self.toKey = function(query) {
        if (!query)
            throw "Invalid query!";
        if (typeof query == "string")
            return query;
         else
            return $.param(query);
    };

    // Helper to check existence of a key without loading the object
    self.exists = function(query) {
        var key = self.toKey(query);
        if (_cache[key])
            return true;
        if (_ls &&  _ls.getItem(_lsp + key))
            return true;
        return false;
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

    // Find an object by id
    self.find = function(query, value, attr, usesvc) {
        if (!attr) attr = 'id';
        var ilist = self.getIndex(query, attr, usesvc);
        var key = self.toKey(query);
        if (self.debug)
            console.log('finding item in ' + key +
                        ' where ' + attr + '=' + value);
        if (ilist && ilist[value])
            return ilist[value];
        else
            return null;
    };

    // Apply a predefined function to a retreived item
    self.compute = function(fn, item) {
        if (_functions[fn])
            return _functions[fn](item);
        else
            return null;
    };

    // Fetch data from server
    self.fetch = function(query, async, callback, nocache) {
        if (!ol.online && async)
            return; // FIXME: should defer until later
        if (self.jsonp && !async)
            throw "Cannot fetch jsonp synchronously";

        var key = self.toKey(query);
        var data = $.extend({}, self.defaults, query);
        var url = self.service;
        if (data.hasOwnProperty('url')) {
            url = url + '/' + data.url;
            delete data.url;
        }
        if (data.format && !self.formatKeyword) {
            url += '.' + data.format;
            delete data.format;
        }

        var queued;
        if (async) {
            if (_callback_queue[key])
                queued = true;
            else
                _callback_queue[key] = [];
            if (callback)
                _callback_queue[key].push(callback);
        }

        // If existing queue, no need for another Ajax call
        if (queued)
            return;

        $.ajax(url, {
            'data': data,
            'dataType': self.jsonp ? "jsonp" : "json",
            'cache': false,
            'async': async ? true : false,
            'success': function(result) {
                var data = self.parseData(result);
                if (data) {
                    if (async)
                        if (self.debug)
                            console.log("received async result");
                    if (!nocache) {
                        if (self.setPageInfo(query, data)) {
                            data = data.list;
                            if (!query.hasOwnProperty('page'))
                                query.page = 1;
                        }
                        self.set(query, data);
                    }
                    if (_callback_queue[key]) {
                        // async callback(s)
                        _callback_queue[key].forEach(function(fn) {
                            fn(data);
                        });
                        delete _callback_queue[key];
                    } else if (callback) {
                        // sync callback
                        callback(data);
                    }
                } else {
                    delete _callback_queue[key];
                    throw "Error parsing data!";
                }
            },
            'error': function() {
                delete _callback_queue[key];
                throw "Unknown AJAX error!";
            }
        });
    };

    // Helper function for async requests
    self.prefetch = function(query, callback) {
        if (self.debug)
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
        var list;

        // Avoid annoying sync get - if list doesn't exist locally already,
        // we don't need to update it.
        if (self.exists(query))
            list = self.get(query);
        else
            list = [];

        var extra = [];
        if (!opts) opts = {};

        if (!$.isArray(list))
            throw "List is not an array";
        if (!$.isArray(data))
            throw "Data is not an array!";
        if (!data.length)
            return opts.updateOnly ? [] : undefined;
        if (opts.prepend)
            data = data.reverse();

        $.each(data, function(i, obj) {
            var curobj;
            if (list.length)
                curobj = self.find(query, obj[idcol], idcol);
            if (curobj) {
                // Object exists in list already; update with new attrs
                $.extend(curobj, obj);
            } else {
                // Object does not exist in list
                if (opts.updateOnly)
                    extra.push(obj); // Return to sender
                else if (opts.prepend)
                    list.unshift(obj); // Add to beginning of list
                else
                    list.push(obj); // Add to end of list
            }
        });
        if (list.length)
            self.set(query, list);
        if (opts.updateOnly)
            return extra;
    };

    // Process service fetch() results
    // (override if response data is in a child node)
    self.parseData = function(result) {
        // Default: assume JSON root is actual data
        return result;
    };

    //
    self.getPageInfo = function(query) {
        var basequery = {};
        for (var key in query) {
            if (key == 'page')
                continue;
            basequery[key] = query[key];
        }
        var pageinfo = self.get("pageinfo");
        var qkey = self.toKey(basequery);
        if (pageinfo && pageinfo[qkey])
            return pageinfo[qkey];
        return null;
    };

    self.setPageInfo = function(query, data) {
        if (!data || !data.pages || !data.per_page)
            return false;

        var basequery = {};
        for (var key in query) {
            if (key == 'page')
                continue;
            basequery[key] = query[key];
        }
        var pageinfo = self.get("pageinfo") || {};
        var qkey = self.toKey(basequery);
        pageinfo[qkey] = {
            'pages':    data.pages,
            'per_page': data.per_page,
            'count':    data.count
        };
        self.set('pageinfo', pageinfo);
        return true;
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
            if (data.listQuery) {
                item.listQuery = data.listQuery;
                delete data.listQuery;
            }
            outbox.push(item);
        }
        self.set('outbox', outbox);

        if (callback)
            self.sendItem(item.id, callback);
        else
            return item.id;
    };

    // Send a single item from the outbox to the server
    self.sendItem = function(id, callback) {
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
        var contenttype;
        var processdata;
        var headers = {};
        if (data.hasOwnProperty('url')) {
            url = url + '/' + data.url;
            delete data.url;
        }
        if (data.method) {
            method = data.method;
            delete data.method;
        }
        if (data.csrftoken) {
            headers['X-CSRFToken'] = data.csrftoken;
            delete data.csrftoken;
        }

        var defaults = $.extend({}, self.defaults);
        if (defaults.format && !self.formatKeyword) {
            url = url.replace(/\/$/, '');
            url += '.' + defaults.format;
            delete defaults.format;
        }
        if ($.param(defaults)) {
            url += '?' + $.param(defaults);
        }

        if (data.data) {
            data = data.data;
            contenttype = processdata = false;
        }
        
        if (data.fileupload) {
            var opts = new FileUploadOptions();
            opts.fileKey  = data.fileupload;
            opts.fileName = data[data.fileupload];
            delete data[data.fileupload];
            delete data.fileupload;
            opts.params = data;
            var ft = new FileTransfer();
            ft.upload(opts.fileName, url,
                function(res) {
                    var response = JSON.parse(
                        decodeURIComponent(res.response)
                    );
                    success(response);
                },
                function(res) {
                    error({responseText: 'Error uploading file: ' + res.code});
                }, opts
            );
        } else {
            $.ajax(url, {
                data: data,
                type: method,
                dataType: "json",
                contentType: contenttype,
                processData: processdata,
                async: true,
                success: success,
                error: error,
                headers: headers
            });
        }

        function success(result) {
            self.applyResult(item, result);
            // Re-save outbox to update caches
            self.set('outbox', self.get('outbox'));

            if (callback) callback(item, result);
        }

        function error(jqxhr, status) {
            if (jqxhr.responseText) {
                try {
                    item.error = JSON.parse(jqxhr.responseText);
                } catch (e) {
                    item.error = jqxhr.responseText;
                }
            } else {
                item.error = status;
            }
            self.set('outbox', self.get('outbox'));
            if (callback) callback(item);
        }
    };

    // Send all unsaved items to a batch service on the server
    self.sendBatch = function(callback) {
        var items = self.filter('outbox', {'saved': false});
        if (!items.length) {
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
        $.ajax(self.batchService, {
            data: JSON.stringify(data),
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function(r) {
                var results = self.parseBatchResult(r);
                if (!results || results.length != items.length) {
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

                if (callback) callback(success);
            },
            error: function() {
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
        if (!remain) {
            callback(true);
            return;
        }

        var success = true;
        $.each(items, function(i, item) {
            self.sendItem(item.id, function(item) {
                if (!item)
                    success = null; // sendItem failed
                else if (success && !item.saved)
                    success = false; // sendItem did not result in save
                remain--;
                if (!remain) {
                    // After last sendItem is complete, wrap up
                    // (this should always execute, since sendItem calls back
                    //  even after an error)
                    callback(success);
                }
            }, true);
        });
    };

    // Process service send() results
    // (override to apply additional result attributes to item,
    //  but be sure to set item.saved)
    self.applyResult = function(item, result) {
        // Default: assume non-empty result means the save was successful
        if (result)
            item.saved = true;
    };

    // Count of pending outbox items (never saved, or save was unsuccessful)
    self.unsaved = function(listQuery) {
        return self.unsavedItems(listQuery).length;
    };

    // Actual unsaved items
    self.unsavedItems = function(listQuery) {
        var items = self.filter('outbox', {'saved': false});

        // Return all unsaved items by default
        if (!listQuery)
            return items;

        // Otherwise, only match items corresponding to the specified list
        return items.filter(function(item) {
            if (!item.listQuery)
                return false;
            for (var key in listQuery)
                if (item.listQuery[key] != listQuery[key])
                    return false;
            return true;
        });
    };

    // Clear local caches
    self.reset = function() {
        _cache = {};
        _index_cache = {};
        _group_cache = {};
        if (_ls)
            _ls.clear(); // FIXME: what about other stores?!
    };

}

return store;

});
