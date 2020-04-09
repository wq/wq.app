'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.createOffline = exports.offline = void 0;

var _typeof2 = _interopRequireDefault(require('@babel/runtime/helpers/typeof'));

var _redux = require('redux');

var _middleware = require('./middleware');

var _updater = require('./updater');

var _config = require('./config');

var _actions = require('./actions');

var _offlineActionTracker = _interopRequireDefault(
    require('./offlineActionTracker')
);

/* global $Shape */
// @TODO: Take createStore as config?
var warnIfNotReduxAction = function warnIfNotReduxAction(config, key) {
    var maybeAction = config[key];
    var isNotReduxAction =
        maybeAction === null ||
        (0, _typeof2.default)(maybeAction) !== 'object' ||
        typeof maybeAction.type !== 'string' ||
        maybeAction.type === '';

    if (isNotReduxAction && console.warn) {
        var msg =
            ''.concat(key, ' must be a proper redux action, ') +
            'i.e. it must be an object and have a non-empty string type. ' +
            'Instead you provided: '.concat(
                JSON.stringify(maybeAction, null, 2)
            );
        console.warn(msg);
    }
};

var offline = function offline() {
    var userConfig =
        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return function(createStore) {
        return function(reducer, preloadedState) {
            var enhancer =
                arguments.length > 2 && arguments[2] !== undefined
                    ? arguments[2]
                    : function(x) {
                          return x;
                      };
            var config = (0, _config.applyDefaults)(userConfig);
            warnIfNotReduxAction(config, 'defaultCommit');
            warnIfNotReduxAction(config, 'defaultRollback'); // toggle experimental returned promises

            config.offlineActionTracker = config.returnPromises
                ? _offlineActionTracker.default.withPromises
                : _offlineActionTracker.default.withoutPromises;
            delete config.returnPromises; // wraps userland reducer with a top-level
            // reducer that handles offline state updating

            var offlineReducer = (0, _updater.enhanceReducer)(reducer, config); // $FlowFixMe

            var offlineMiddleware = (0, _redux.applyMiddleware)(
                (0, _middleware.createOfflineMiddleware)(config)
            ); // create autoRehydrate enhancer if required

            var offlineEnhancer =
                config.persist &&
                config.rehydrate &&
                config.persistAutoRehydrate
                    ? (0, _redux.compose)(
                          offlineMiddleware,
                          config.persistAutoRehydrate()
                      )
                    : offlineMiddleware; // create store

            var store = offlineEnhancer(createStore)(
                offlineReducer,
                preloadedState,
                enhancer
            );
            var baseReplaceReducer = store.replaceReducer.bind(store); // $FlowFixMe

            store.replaceReducer = function replaceReducer(nextReducer) {
                return baseReplaceReducer(
                    (0, _updater.enhanceReducer)(nextReducer, config)
                );
            }; // launch store persistor

            if (config.persist) {
                config.persist(
                    store,
                    config.persistOptions,
                    config.persistCallback
                );
            } // launch network detector

            if (config.detectNetwork) {
                config.detectNetwork(function(online) {
                    store.dispatch((0, _actions.networkStatusChanged)(online));
                });
            }

            return store;
        };
    };
};

exports.offline = offline;

var createOffline = function createOffline() {
    var userConfig =
        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var config = (0, _config.applyDefaults)(userConfig); // toggle experimental returned promises

    config.offlineActionTracker = config.returnPromises
        ? _offlineActionTracker.default.withPromises
        : _offlineActionTracker.default.withoutPromises;
    delete config.returnPromises;
    warnIfNotReduxAction(config, 'defaultCommit');
    warnIfNotReduxAction(config, 'defaultRollback');

    var enhanceStore = function enhanceStore(next) {
        return function(reducer, preloadedState, enhancer) {
            // create autoRehydrate enhancer if required
            var createStore =
                config.persist &&
                config.rehydrate &&
                config.persistAutoRehydrate
                    ? config.persistAutoRehydrate()(next)
                    : next; // create store

            var store = createStore(reducer, preloadedState, enhancer);
            var baseReplaceReducer = store.replaceReducer.bind(store);

            store.replaceReducer = function replaceReducer(nextReducer) {
                return baseReplaceReducer(
                    (0, _updater.enhanceReducer)(nextReducer, config)
                );
            }; // launch store persistor

            if (config.persist) {
                config.persist(
                    store,
                    config.persistOptions,
                    config.persistCallback
                );
            } // launch network detector

            if (config.detectNetwork) {
                config.detectNetwork(function(online) {
                    store.dispatch((0, _actions.networkStatusChanged)(online));
                });
            }

            return store;
        };
    };

    return {
        middleware: (0, _middleware.createOfflineMiddleware)(config),
        enhanceReducer: function enhanceReducer(reducer) {
            return (0, _updater.enhanceReducer)(reducer, config);
        },
        enhanceStore: enhanceStore
    };
};

exports.createOffline = createOffline;
