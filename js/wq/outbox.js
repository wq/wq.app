/*!
 * wq.app 0.8.0-dev - wq/outbox.js
 * Queue saved forms for posting to the server
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

/* global FileUploadOptions */
/* global FileTransfer */

define(['./store', './model'], function(ds, model) {

var outbox = new _Outbox(ds);

outbox.getOutbox = function(store) {
    return new _Outbox(store);
};

return outbox;

function _Outbox(store) {
    var self = this;
    self.model = model({'query': 'outbox', 'store': store});
    self.saveMethod = 'POST';
    self.cleanOutbox = true;
    self.maxRetries = 3;

    self.init = function(options) {
        if (self.cleanOutbox) {
            // Clear out successfully saved items from previous runs, if any
            self.set('outbox', self.unsavedItems());
        }

        if (opts.batchService) {
            self.batchService = opts.batchService;
            if (opts.parseBatchResult)
                self.parseBatchResult = opts.parseBatchResult;
            else
                self.parseBatchResult = self.parseData;
        }
    };

    // Queue data for server use; use outbox to cache unsaved items
    self.save = function(data, id, callback) {
        var outbox = self.get('outbox');
        if (!outbox)
            outbox = [];

        var item;
        if (id)
            item = self.find('outbox', id);

        if (item && !item.saved) {
            // reuse existing item
            item.data = data;
            delete item.retryCount;
            delete item.error;
        } else {
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

        if (self.debugNetwork) {
            console.log("Sending item to " + url);
            if (self.debugValues)
                console.log(data);
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
            if (self.debugNetwork) {
                console.log("Item successfully sent to " + url);
            }
            self.applyResult(item, result);
            // Re-save outbox to update caches
            self.set('outbox', self.get('outbox'));

            if (callback) callback(item, result);
        }

        function error(jqxhr, status) {
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
                item.error = status;
            }
            self.set('outbox', self.get('outbox'));
            if (callback) callback(item);
        }
    };

    // Send all unsaved items to a batch service on the server
    self.sendBatch = function(callback, retryAll) {
        var items = retryAll ? self.unsavedItems() : self.pendingItems();
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
                    var item = items[i];
                    self.applyResult(item, results[i]);
                    if (!item.saved) {
                        success = false;
                        item.retryCount = item.retryCount || 0;
                        item.retryCount++;
                    }
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
    self.sendAll = function(callback, retryAll) {
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
            self.sendBatch(callback, retryAll);
            return;
        }

        // No batch service; emulate batch mode by sending each item to
        // the server and summarizing the result
        var items = retryAll ? self.unsavedItems() : self.pendingItems();

        var remain = items.length;
        if (!remain) {
            callback(true);
            return;
        }

        var success = true;
        $.each(items, function(i, item) {
            self.sendItem(item.id, function(item) {
                if (!item) {
                    // sendItem failed
                    success = null;
                } else if (!item.saved) {
                    // sendItem did not result in save
                    if (success)
                        success = false;
                    item.retryCount = item.retryCount || 0;
                    item.retryCount++;
                }
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

    // Unsaved items that have been sent less than maxRetries times
    self.pendingItems = function(listQuery) {
        var items = [];
        self.unsavedItems(listQuery).forEach(function(item) {
            if (!self.maxRetries || !item.retryCount ||
                    item.retryCount < self.maxRetries)
                items.push(item);
        });
        return items;
    };
}

});
