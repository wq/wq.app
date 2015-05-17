/*!
 * wq.app 0.8.0-dev - wq/outbox.js
 * Queue synced forms for posting to the server
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global FileUploadOptions */
/* global FileTransfer */
/* global Promise */

define(['jquery', './store', './model', './online', './json', './console'],
function($, ds, model, ol, json, console) {

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

            // Outbox functions
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

    // Queue data for server use; use outbox to cache unsynced items
    self.save = function(data, id, noSend) {
        return self.model.load().then(function(obdata) {
            var item, maxId = 0;
            obdata.list.forEach(function(obj) {
                if (id && obj.id == id) {
                    item = obj;
                }
                if (obj.id > maxId) {
                    maxId = obj.id;
                }
            });

            if (item && !item.synced) {
                // reuse existing item
                item.data = data;
                item.retryCount = 0;
                item.error = null;
            } else {
                // create new item
                item = {
                    data: data,
                    synced: false,
                    id: maxId + 1
                };
                if (data.modelConf) {
                    item.modelConf = data.modelConf;
                    delete data.modelConf;
                }
            }

            return self.model.update([item]).then(function() {
                if (noSend) {
                    return item;
                } else {
                    return self.sendItem(item);
                }
            });
        });
    };

    // Send a single item from the outbox to the server
    self.sendItem = function(item) {
        if (!item || item.synced) {
            return Promise.resolve(null);
        } else if (!ol.online) {
            return Promise.resolve(item);
        }

        var url = self.service;
        var method = self.syncMethod;
        var data = json.extend({}, item.data);
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

        var defaults = json.extend({}, self.defaults);
        if (defaults.format && !self.formatKeyword) {
            url = url.replace(/\/$/, '');
            url += '.' + defaults.format;
            delete defaults.format;
        }
        if (json.param(defaults)) {
            url += '?' + json.param(defaults);
        }

        if (data.data) {
            data = data.data;
            contenttype = processdata = false;
        }

        if (self.debugNetwork) {
            console.log("Sending item to " + url);
            if (self.debugValues) {
                console.log(data);
            }
        }

        if (data.fileupload) {
            var opts = new FileUploadOptions();
            opts.fileKey = data.fileupload;
            opts.fileName = data[data.fileupload];
            delete data[data.fileupload];
            delete data.fileupload;
            opts.params = data;
            var ft = new FileTransfer();
            return Promise(function(resolve) {
                ft.upload(opts.fileName, url,
                    function(res) {
                        var response = JSON.parse(
                            decodeURIComponent(res.response)
                        );
                        resolve(success(response));
                    },
                    function(res) {
                        resolve(error(
                            {responseText: 'Error uploading file: ' + res.code}
                        ));
                    }, opts
                );
            });
        } else {
            return Promise.resolve($.ajax(url, {
                data: data,
                type: method,
                dataType: "json",
                contentType: contenttype,
                processData: processdata,
                async: true,
                headers: headers
            })).then(success, error);
        }

        function success(result) {
            if (self.debugNetwork) {
                console.log("Item successfully sent to " + url);
            }
            self.applyResult(item, result);
            return self.updateModels(item, result).then(function() {
                return self.model.update([item]).then(function() {
                    return item;
                });
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
                item.error = jqxhr.statusCode;
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
            return Promise.resolve(true);
        }
        if (!ol.online) {
            return Promise.resolve(false);
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
            var success = true;
            results.forEach(function(result, i) {
                var item = items[i];
                self.applyResult(item, result);
                if (!item.synced) {
                    success = false;
                    item.retryCount = item.retryCount || 0;
                    item.retryCount++;
                }
            });

            return self.model.update(items).then(function() {
                return success;
            });

        }, function() {
            return null;
        });
    };

    self.sendItems = function(items) {
        // No batch service; emulate batch mode by sending each item to
        // the server and summarizing the result

        if (!items.length) {
            return Promise.resolve(true);
        }
        if (!ol.online) {
            return Promise.resolve(false);
        }

        var results = items.map(function(item) {
            return self.sendItem(item);
        });

        return Promise.all(results).then(function(items) {
            var success = true;
            items.forEach(function(item) {
                if (!item) {
                    // sendItem failed
                    success = null;
                } else if (!item.synced) {
                    // sendItem did not result in sync
                    if (success) {
                        success = false;
                    }
                    item.retryCount = item.retryCount || 0;
                    item.retryCount++;
                }
            });
            return self.model.update(items).then(function() {
                return success;
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
        }
    };

    // Update any corresponding models with synced data
    self.updateModels = function(item, result) {
        if (item.modelConf && item.synced) {
            var conf = json.extend({'store': self.store}, item.modelConf);
            return model(conf).update([result]).then(function() {
                return result;
            });
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
                if (!item.modelConf) {
                    return false;
                }
                for (var key in modelConf) {
                    if (item.modelConf[key] != modelConf[key]) {
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
                if (!self.maxRetries || !item.retryCount ||
                        item.retryCount < self.maxRetries) {
                    items.push(item);
                }
            });
            return items;
        });
    };
}

});
