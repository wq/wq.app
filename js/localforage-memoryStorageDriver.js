(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.memoryStorageDriver = factory());
}(this, function () { 'use strict';

    function getSerializerPromise(localForageInstance) {
        if (getSerializerPromise.result) {
            return getSerializerPromise.result;
        }
        if (!localForageInstance || typeof localForageInstance.getSerializer !== 'function') {
            return Promise.reject(new Error('localforage.getSerializer() was not available! ' + 'localforage v1.4+ is required!'));
        }
        getSerializerPromise.result = localForageInstance.getSerializer();
        return getSerializerPromise.result;
    }

    function executeCallback(promise, callback) {
        if (callback) {
            promise.then(function (result) {
                callback(null, result);
            }, function (error) {
                callback(error);
            });
        }
    }

    var storageRepository = {};

    // Config the localStorage backend, using options set in the config.
    function _initStorage(options) {
        var self = this;

        var dbInfo = {};
        if (options) {
            for (var i in options) {
                dbInfo[i] = options[i];
            }
        }

        var database = storageRepository[dbInfo.name] = storageRepository[dbInfo.name] || {};
        var table = database[dbInfo.storeName] = database[dbInfo.storeName] || {};
        dbInfo.db = table;

        self._dbInfo = dbInfo;

        return getSerializerPromise(self).then(function (serializer) {
            dbInfo.serializer = serializer;
        });
    }

    function clear(callback) {
        var self = this;
        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    delete db[key];
                }
            }
        });

        executeCallback(promise, callback);
        return promise;
    }

    function getItem(key, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            console.warn(key + ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            var result = db[key];

            if (result) {
                result = self._dbInfo.serializer.deserialize(result);
            }

            return result;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function iterate(iterator, callback) {
        var self = this;

        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;

            var iterationNumber = 1;
            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    var value = db[key];

                    if (value) {
                        value = self._dbInfo.serializer.deserialize(value);
                    }

                    value = iterator(value, key, iterationNumber++);

                    if (value !== void 0) {
                        return value;
                    }
                }
            }
        });

        executeCallback(promise, callback);
        return promise;
    }

    function key(n, callback) {
        var self = this;
        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            var result = null;
            var index = 0;

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    if (n === index) {
                        result = key;
                        break;
                    }
                    index++;
                }
            }

            return result;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function keys(callback) {
        var self = this;
        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            var keys = [];

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }

            return keys;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function length(callback) {
        var self = this;
        var promise = self.keys().then(function (keys) {
            return keys.length;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function removeItem(key, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            console.warn(key + ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            if (db.hasOwnProperty(key)) {
                delete db[key];
            }
        });

        executeCallback(promise, callback);
        return promise;
    }

    function setItem(key, value, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            console.warn(key + ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = self.ready().then(function () {
            // Convert undefined values to null.
            // https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            function serializeAsync(value) {
                return new Promise(function (resolve, reject) {
                    self._dbInfo.serializer.serialize(value, function (value, error) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(value);
                        }
                    });
                });
            }

            return serializeAsync(value).then(function (value) {
                var db = self._dbInfo.db;
                db[key] = value;
                return originalValue;
            });
        });

        executeCallback(promise, callback);
        return promise;
    }

    var memoryStorageDriver = {
        _driver: 'memoryStorageDriver',
        _initStorage: _initStorage,
        // _supports: function() { return true; }
        iterate: iterate,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key,
        keys: keys
    };

    return memoryStorageDriver;

}));