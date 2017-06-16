/*!
 * wq.app 1.0.0rc2 - wq/outbox.js
 * Queue submitted forms for eventual syncing to the server
 * (c) 2012-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', 'localforage', './store', './model', './json', './console'],
function($, lf, ds, model, json, console) {

var _outboxes = {};
var outbox = new _Outbox(ds);

outbox.getOutbox = function(store) {
    if (_outboxes[store.name]) {
        return _outboxes[store.name];
    } else {
        return new _Outbox(store);
    }
};

return outbox;

function _Outbox(store) {
    var self = _outboxes[store.name] = this;

    self.store = store;
    self.model = model({'query': 'outbox', 'store': store});
    self.syncMethod = 'POST';
    self.cleanOutbox = true;
    self.maxRetries = 3;
    self.csrftoken = null;
    self.csrftokenField = 'csrfmiddlewaretoken';

    self.init = function(opts) {

        var optlist = [
            // Default to store values but allow overriding
            'service',
            'formatKeyword',
            'defaults',
            'debugNetwork',
            'debugValues',

            // Outbox-specific options
            'syncMethod',
            'cleanOutbox',
            'maxRetries',
            'batchService',
            'csrftokenField',

            // Outbox functions
            'validate',
            'applyResult',
            'updateModels',
            'parseBatchResult'
        ];
        optlist.forEach(function(opt) {
            if (self.store.hasOwnProperty(opt)) {
                self[opt] = self.store[opt];
            }
            if (opts && opts.hasOwnProperty(opt)) {
                self[opt] = opts[opt];
            }
        });

        if (self.cleanOutbox) {
            // Clear out successfully synced items from previous runs, if any
            // FIXME: should we hold up init until this is done?
            self.unsyncedItems().then(self.model.overwrite);
        }

        if (self.batchService && !self.parseBatchResult) {
            self.parseBatchResult = self.store.parseData;
        }
    };

    self.setCSRFToken = function(csrftoken) {
        self.csrftoken = csrftoken;
    };

    // Queue data for server use; use outbox to cache unsynced items
    self.save = function(data, options, noSend) {
        if (!self.validate(data, options)) {
            return Promise.resolve(null);
        }
        return self.model.load().then(function(obdata) {
            var item, maxId = 0;
            if (!options) {
                options = {};
            }
            obdata.list.forEach(function(obj) {
                if (options.id && obj.id == options.id) {
                    item = obj;
                }
                if (obj.id > maxId) {
                    maxId = obj.id;
                }
            });

            if (item && !item.synced) {
                // reuse existing item
                (options.preserve || []).forEach(function(field) {
                    if (data[field] === undefined) {
                        data[field] = item.data[field];
                    }
                });
                item.data = data;
                item.retryCount = 0;
                item.error = null;
                item.options = options;
            } else {
                // create new item
                item = {
                    data: data,
                    synced: false,
                    id: maxId + 1,
                    options: options
                };
            }
            if (options.label) {
                item.label = options.label;
                delete options.label;
            }
            Object.keys(data).forEach(function(key) {
                var match = (
                    data[key].match && data[key].match(/^outbox-(\d+)$/)
                );
                if (match) {
                    if (!item.parents) {
                        item.parents = [];
                    }
                    item.parents.push(match[1]);
                }
            });

            return self.model.update([item]).then(function() {
                if (noSend) {
                    return item;
                } else {
                    return self.sendItem(item);
                }
            });
        });
    };

    // Validate a record before adding it to the outbox
    self.validate = function(data, options) {
        /* jshint unused: false */
        return true;
    };

    // Send a single item from the outbox to the server
    self.sendItem = function(item, once) {
        if (!item || item.synced) {
            return Promise.resolve(null);
        } else if (item.parents && item.parents.length) {
            return Promise.resolve(item);
        }

        var data = item.data;
        var options = item.options;
        var url = self.service;
        if (options.url) {
            url = url + '/' + options.url;
        }
        var method = options.method || self.syncMethod;
        var headers = {};

        // Use current CSRF token in case it's changed since item was saved
        var csrftoken = self.csrftoken || options.csrftoken;
        if (csrftoken) {
            headers['X-CSRFToken'] = csrftoken;
            data = json.extend({}, data);
            data[self.csrftokenField] = csrftoken;
        }

        var defaults = json.extend({}, self.defaults);
        if (defaults.format && !self.formatKeyword) {
            url = url.replace(/\/$/, '');
            url += '.' + defaults.format;
            delete defaults.format;
        }
        if (json.param(defaults)) {
            url += '?' + json.param(defaults);
        }

        if (self.debugNetwork) {
            console.log("Sending item to " + url);
            if (self.debugValues) {
                console.log(data);
            }
        }

        // If files/blobs are present, use a FormData object to submit
        var formData = (window.FormData && new FormData());
        var useFormData = false;
        var key, val, blob, slice;
        for (key in data) {
            val = data[key];
            if (!val) {
                continue;
            }
            if (json.isArray(val) || (val.name && val.type && val.body)) {
                useFormData = true;
            }
        }
        if (useFormData) {
            if (!formData) {
                throw "FormData needed but not present!";
            }
            for (key in data) {
                val = data[key];
                if (json.isArray(val)) {
                    val.forEach(appendValue.bind(this, key));
                } else {
                    appendValue(key, val);
                }
            }
        }

        function appendValue(key, val) {
            if (val && val.name && val.type && val.body) {
                // File (Blob) record; add with filename
                blob = val.body;
                if (!blob.type) {
                    // Serialized blobs lose their type
                    slice = blob.slice || blob.webkitSlice;
                    blob = slice.call(blob, 0, blob.size, val.type);
                }
                formData.append(key, blob, val.name);
            } else {
                // Add regular form fields
                formData.append(key, val);
            }
        }

        return Promise.resolve($.ajax(url, {
            data: useFormData ? formData : data,
            type: method,
            dataType: "json",
            processData: !useFormData,
            contentType: useFormData ? false : undefined,
            async: true,
            headers: headers
        })).then(success, error);

        function success(result) {
            if (self.debugNetwork) {
                console.log("Item successfully sent to " + url);
            }
            self.applyResult(item, result);
            return self.updateModels(item, result).then(function() {
                return self.model.filter({'parents': item.id});
            }).then(function(relItems) {
                relItems.forEach(function(relItem) {
                    relItem.parents = relItem.parents.filter(function(p) {
                        return p != item.id;
                    });
                    Object.keys(relItem.data).forEach(function(key) {
                        if (relItem.data[key] === 'outbox-' + item.id) {
                            relItem.data[key] = result.id;
                        }
                    });
                });
                relItems.push(item);
                return self.model.update(relItems);
            }).then(function() {
                return item;
            });
        }

        function error(jqxhr) {
            if (self.debugNetwork) {
                console.warn("Error sending item to " + url);
            }
            if (jqxhr.responseText) {
                try {
                    item.error = JSON.parse(jqxhr.responseText);
                } catch (e) {
                    item.error = jqxhr.responseText;
                }
            } else {
                item.error = jqxhr.status;
            }
            if (once) {
                item.locked = true;
            }
            return self.model.update([item]).then(function() {
                return item;
            });
        }
    };

    // Send all unsynced items, using batch service if available
    self.sendAll = function(retryAll) {

        var result = retryAll ? self.unsyncedItems() : self.pendingItems();

        // Utilize batch service if it exists
        if (self.batchService) {
            return result.then(self.sendBatch);
        } else {
            return result.then(self.sendItems);
        }
    };

    // Send items to a batch service on the server
    self.sendBatch = function(items) {
        if (!items.length) {
            return Promise.resolve(items);
        }

        var data = [];
        items.forEach(function(item) {
            data.push(item.data);
        });

        return Promise.resolve($.ajax(self.batchService, {
            data: JSON.stringify(data),
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            async: true
        })).then(function(r) {
            var results = self.parseBatchResult(r);
            if (!results || results.length != items.length) {
                return null;
            }

            // Apply sync results to individual items
            results.forEach(function(result, i) {
                var item = items[i];
                self.applyResult(item, result);
                if (!item.synced) {
                    item.retryCount = item.retryCount || 0;
                    item.retryCount++;
                }
            });

            return self.model.update(items).then(function() {
                return items;
            });

        }, function() {
            return null;
        });
    };

    self.sendItems = function(items) {
        // No batch service; emulate batch mode by sending each item to
        // the server and summarizing the result

        if (!items.length) {
            return Promise.resolve(items);
        }

        // Sort items into those that are ready to be sent now vs. those that
        // are pending on another item.
        var allIds = [], pendingIds = [], readyItems = [];
        items.forEach(function(item) {
            allIds.push(item.id);
            if (item.parents && item.parents.length) {
                pendingIds.push(item.id);
            } else {
                readyItems.push(item);
            }
        });

        // Send ready items and retrieve results
        var results = readyItems.map(function(item) {
            return self.sendItem(item);
        });

        return Promise.all(results).then(function(sentItems) {
            sentItems.forEach(function(item) {
                if (item && !item.synced) {
                    // sendItem did not result in sync
                    item.retryCount = item.retryCount || 0;
                    item.retryCount++;
                }
            });
            return self.model.update(sentItems).then(function() {
                // Now try sending previously pending items (unless there are
                // only pending items, in which case something has gone wrong)
                if (pendingIds.length == allIds.length) {
                    return;
                }
                return self.model.filter(
                    {'id': pendingIds}
                ).then(self.sendItems);
            }).then(function() {
                // Reload data and return final result
                return self.model.filter(
                    {'id': allIds}
                );
            });
        });
    };

    // Process service send() results
    // (override to apply additional result attributes to item,
    //  but be sure to set item.synced)
    self.applyResult = function(item, result) {
        // Default: assume non-empty result means the sync was successful
        if (result) {
            item.synced = true;
            item.result = result;
        } else if (item.options.method == 'DELETE') {
            item.synced = true;
            if (item.options.modelConf) {
                item.deletedId = item.options.url.replace(
                    item.options.modelConf.url + '/', ''
                );
            }
        }
    };

    // Update any corresponding models with synced data
    self.updateModels = function(item, result) {
        if (item.options.modelConf && item.synced) {
            var conf = json.extend(
                {'store': self.store},
                item.options.modelConf
            );
            if (item.deletedId) {
                return model(conf).remove(item.deletedId);
            } else {
                return model(conf).update([result]).then(function() {
                    return result;
                });
            }
        } else {
            return Promise.resolve();
        }
    };

    // Count of unsynced outbox items (never synced, or sync was unsuccessful)
    self.unsynced = function(modelConf) {
        return self.unsyncedItems(modelConf).then(function(items) {
            return items.length;
        });
    };

    // Actual unsynced items
    self.unsyncedItems = function(modelConf) {
        var result = self.model.filter({'synced': false});

        // Return all unsynced items by default
        if (!modelConf) {
            return result;
        }

        // Otherwise, only match items corresponding to the specified list
        return result.then(function(items) {
            return items.filter(function(item) {
                if (!item.options.modelConf) {
                    return false;
                }
                for (var key in modelConf) {
                    if (item.options.modelConf[key] != modelConf[key]) {
                        return false;
                    }
                }
                return true;
            });
        });
    };

    // Unsynced items that have been sent less than maxRetries times
    self.pendingItems = function(modelConf) {
        return self.unsyncedItems(modelConf).then(function(unsynced) {
            var items = [];
            unsynced.forEach(function(item) {
                if (self.maxRetries && item.retryCount >= self.maxRetries) {
                    return;
                }
                if (item.locked) {
                    return;
                }
                items.push(item);
            });
            return items;
        });
    };
}

});
