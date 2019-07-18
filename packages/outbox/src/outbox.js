import ds from '@wq/store';
import model from '@wq/model';
import { convert } from '../vendor/json-forms';
import { createOffline, offlineConfig, RESET_STATE, busy } from './offline';

const { discard: defaultDiscard, retry: defaultRetry } = offlineConfig;

const REMOVE_ITEMS = '@@REMOVE_OUTBOX_ITEMS',
    RETRY_ITEMS = '@@RETRY_OUTBOX_ITEMS',
    POST = 'POST',
    DELETE = 'DELETE',
    SUBMIT = 'SUBMIT',
    SUCCESS = 'SUCCESS',
    UPDATE = 'UPDATE',
    ERROR = 'ERROR',
    FORM_SUBMIT = 'FORM_SUBMIT',
    FORM_SUCCESS = 'FORM_SUCCESS',
    FORM_ERROR = 'FORM_ERROR',
    ON_SUCCESS = 'ON_SUCCESS',
    IMMEDIATE = 'IMMEDIATE',
    LOCAL_ONLY = 'LOCAL_ONLY';

var _outboxes = {};

class Outbox {
    constructor(store) {
        _outboxes[store.name] = this;
        this.store = store;
        store.outbox = this;
        const { middleware, enhanceReducer, enhanceStore } = createOffline({
            ...offlineConfig,
            effect: (effect, action) => this._effect(effect, action),
            discard: (error, action, retries) =>
                this._discard(error, action, retries),
            retry: (action, retries) => this._retry(action, retries),
            queue: {
                enqueue: (array, item, context) =>
                    this._enqueue(array, item, context),
                dequeue: (array, item, context) =>
                    this._dequeue(array, item, context),
                peek: (array, item, context) => this._peek(array, item, context)
            },
            persist: false // Handled in store
        });
        store.addMiddleware(middleware);
        store.addEnhanceReducer(
            'offline',
            enhanceReducer,
            state => this._serialize(state),
            state => this._deserialize(state)
        );
        store.addEnhancer(enhanceStore);

        store.subscribe(() => this._onUpdate());
        this.syncMethod = POST;
        this.applyState = ON_SUCCESS;
        this.cleanOutbox = true;
        this.maxRetries = 10;
        this.csrftoken = null;
        this.csrftokenField = 'csrfmiddlewaretoken';
    }

    init(opts) {
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

        optlist.forEach(opt => {
            if (this.store.hasOwnProperty(opt)) {
                this[opt] = this.store[opt];
            }
            if (opts && opts.hasOwnProperty(opt)) {
                this[opt] = opts[opt];
            }
        });

        if (this.cleanOutbox) {
            // Clear out successfully synced items from previous runs, if any
            // FIXME: should we hold up init until this is done?
            this.loadItems()
                .then(items => {
                    this.removeItems(
                        items.list
                            .filter(
                                item =>
                                    item.synced ||
                                    (item.options.storage === 'temporary' &&
                                        !item.options.desiredStorage)
                            )
                            .map(item => item.id)
                    );
                })
                .then(() => this._cleanUpItemData);
        }

        if (this.batchService && !this.parseBatchResult) {
            this.parseBatchResult = this.store.parseData;
        }
    }

    setCSRFToken(csrftoken) {
        this.csrftoken = csrftoken;
    }

    // Queue data for server use; use outbox to cache unsynced items
    async save(data, options, noSend) {
        if (noSend) {
            throw new Error(
                'outbox.save() noSend arg no longer supported; use outbox.pause() instead'
            );
        }
        if (options) {
            options = { ...options };
        } else {
            options = {};
        }
        if (options.storage === 'inline') {
            delete options.storage;
        }
        if (options.storage === 'temporary') {
            options.once = true;
        }
        if (!this.validate(data, options)) {
            return null;
        }

        // FIXME: What if next id changes during await?
        const id =
            options.id ||
            (this.store.getState().offline.lastTransaction || 0) + 1;
        const item = await this._updateItemData({ id, data, options });
        data = item.data;
        options = item.options;

        var type, payload, commitType, rollbackType;
        const model = this._getModel(options.modelConf);
        if (model) {
            const applyState = options.applyState || this.applyState;

            if (options.method === DELETE && options.url) {
                const deletedId = options.url.replace(
                    options.modelConf.url + '/',
                    ''
                );
                if (applyState === ON_SUCCESS) {
                    commitType = model.expandActionType(DELETE);
                    type = commitType + SUBMIT;
                    rollbackType = commitType + ERROR;
                } else if (applyState === IMMEDIATE) {
                    type = model.expandActionType(DELETE);
                    commitType = type + SUCCESS;
                    rollbackType = type + ERROR;
                } else if (applyState === LOCAL_ONLY) {
                    type = model.expandActionType(DELETE);
                    commitType = null;
                    rollbackType = null;
                } else {
                    throw new Error('Unknown applyState ' + applyState);
                }
                payload = deletedId;
            } else {
                if (applyState === ON_SUCCESS) {
                    type = model.expandActionType(SUBMIT);
                    commitType = model.expandActionType(UPDATE);
                    rollbackType = model.expandActionType(ERROR);
                    payload = null;
                } else if (applyState === IMMEDIATE) {
                    type = model.expandActionType(UPDATE);
                    commitType = model.expandActionType(SUCCESS);
                    rollbackType = model.expandActionType(ERROR);
                    payload = this._localUpdate(data, id);
                } else if (applyState === LOCAL_ONLY) {
                    type = model.expandActionType(UPDATE);
                    commitType = null;
                    rollbackType = null;
                    payload = this._localUpdate(data);
                } else {
                    throw new Error('Unknown applyState ' + applyState);
                }
            }
        } else if (options.modelConf) {
            const name = options.modelConf.name.toUpperCase();
            type = `${name}_${SUBMIT}`;
            commitType = `${name}_${SUCCESS}`;
            rollbackType = `${name}_${ERROR}`;
        } else {
            type = FORM_SUBMIT;
            commitType = FORM_SUCCESS;
            rollbackType = FORM_ERROR;
        }

        if (commitType) {
            this.store.dispatch({
                type,
                payload,
                meta: {
                    offline: {
                        effect: { data, options },
                        commit: { type: commitType },
                        rollback: { type: rollbackType }
                    }
                }
            });
            const items = await this.loadItems();
            // FIXME: Double check that this is the same record just submitted
            return items.list[0];
        } else {
            this.store.dispatch({ type, payload });
            return null;
        }
    }

    _enqueue(array, action, context) {
        const { offline } = action.meta,
            { data, options } = offline.effect;
        if (options.id) {
            const exist = array.find(act => act.meta.outboxId === options.id);
            if (exist) {
                (options.preserve || []).forEach(field => {
                    if (data[field] === undefined) {
                        data[field] = exist.meta.offline.effect.data[field];
                    }
                });
                array = array.filter(act => act.meta.outboxId !== options.id);
            }
        } else {
            options.id = action.meta.transaction;
        }
        action.meta.outboxId = options.id;

        if (!offline.commit) {
            offline.commit = { type: `${action.type}_${SUCCESS}` };
        }
        if (!offline.commit.meta) {
            offline.commit.meta = {};
        }

        if (!offline.rollback) {
            offline.rollback = { type: `${action.type}_${ERROR}` };
        }
        if (!offline.rollback.meta) {
            offline.rollback.meta = {};
        }

        // Copy action but exclude commit/rollback (to avoid recursive nesting)
        const offlineAction = {
            ...action,
            meta: {
                ...action.meta,
                offline: {
                    effect: offline.effect
                }
            }
        };

        offline.commit.meta.offlineAction = offlineAction;
        offline.rollback.meta.offlineAction = offlineAction;

        const currentId = action.payload && action.payload.id;
        if (currentId) {
            offline.commit.meta.currentId = currentId;
            offline.rollback.meta.currentId = currentId;
        }

        Object.keys(data || {}).forEach(key => {
            var match = data[key].match && data[key].match(/^outbox-(\d+)$/);
            if (match) {
                if (!action.meta.parents) {
                    action.meta.parents = [];
                }
                action.meta.parents.push(+match[1]);
            }
        });
        return [...array, action];
    }

    // Validate a record before adding it to the outbox
    validate(data, options) {
        /* eslint no-unused-vars: off */
        return true;
    }

    // Send a single item from the outbox to the server
    sendItem() {
        throw new Error(
            'sendItem() no longer supported; use waitForItem() instead'
        );
    }
    _peek(array, action, context) {
        const pending = array.filter(act => {
            if (act.meta.completed) {
                return false;
            }
            if (act.meta.parents && act.meta.parents.length) {
                return false;
            }
            return true;
        });
        if (this.batchService) {
            // FIXME: Generate batch request as a single action, which will
            // generate multiple commit/rollback actions after sync.
            throw new Error('FIXME: Not implemented');
        } else {
            return pending[0];
        }
    }
    async _effect({ data, options }, action) {
        const item = await this._loadItemData({
            id: options.id,
            data,
            options
        });
        data = item.data;
        var url = this.service;
        if (options.url) {
            url = url + '/' + options.url;
        }
        var method = options.method || this.syncMethod;
        var headers = {};

        // Use current CSRF token in case it's changed since item was saved
        var csrftoken = this.csrftoken || options.csrftoken;
        if (csrftoken) {
            headers['X-CSRFToken'] = csrftoken;
            data = {
                ...data,
                [this.csrftokenField]: csrftoken
            };
        }

        var defaults = { ...this.defaults };
        if (defaults.format && !this.formatKeyword) {
            url = url.replace(/\/$/, '');
            url += '.' + defaults.format;
            delete defaults.format;
        }
        var urlObj = new URL(url, window.location.origin);
        Object.entries(defaults).forEach(([key, value]) =>
            urlObj.searchParams.append(key, value)
        );

        if (this.debugNetwork) {
            console.log('Sending item to ' + urlObj.href);
            if (this.debugValues) {
                console.log(data);
            }
        }

        // Use a FormData object to submit
        var formData = new FormData();
        Object.entries(data).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                val.forEach(appendValue.bind(this, key));
            } else {
                appendValue(key, val);
            }
        });

        function appendValue(key, val) {
            if (val && val.name && val.type && val.body) {
                // File (Blob) record; add with filename
                var blob = val.body;
                if (!blob.type) {
                    // Serialized blobs lose their type
                    var slice = blob.slice || blob.webkitSlice;
                    blob = slice.call(blob, 0, blob.size, val.type);
                }
                formData.append(key, blob, val.name);
            } else {
                // Add regular form fields
                formData.append(key, val);
            }
        }

        return this.store.ajax(urlObj, formData, method, headers).then(res => {
            if (!res && method === DELETE) {
                return action.payload;
            } else {
                return res;
            }
        });
    }

    _localUpdate(data, outboxId) {
        data = this._parseJsonForm({ data }).data;
        if (outboxId && !data.hasOwnProperty('id')) {
            data.id = 'outbox-' + outboxId;
        }
        return data;
    }

    _updateParents(item, outboxId, resultId) {
        if (item.meta.parents.indexOf(outboxId) === -1) {
            return item;
        }
        const data = { ...item.meta.offline.effect.data };
        Object.keys(data).forEach(key => {
            if (data[key] === 'outbox-' + outboxId) {
                data[key] = resultId;
            }
        });
        return {
            ...item,
            meta: {
                ...item.meta,
                offline: {
                    ...item.meta.offline,
                    effect: {
                        ...item.meta.offline.effect,
                        data
                    }
                },
                parents: item.meta.parents.filter(pid => pid != outboxId)
            }
        };
    }

    _discard(error, action, retries) {
        const { options } = action.meta.offline.effect;
        if (this.debugNetwork) {
            console.warn('Error sending item to ' + options.url);
            console.error(error);
        }

        return defaultDiscard(error, action, retries || 0);
    }

    _retry(action, retries) {
        const { options } = action.meta.offline.effect;
        if (options.once) {
            return null;
        } else if (retries > this.maxRetries) {
            return null;
        }
        return defaultRetry(action, retries);
    }

    removeItem(id) {
        return this.removeItems([id]);
    }

    removeItems(ids) {
        return this.store.dispatch({
            type: REMOVE_ITEMS,
            payload: ids,
            meta: {
                completed: true
            }
        });
    }

    async empty() {
        this.store.dispatch({ type: RESET_STATE });
        await this._cleanUpItemData();
    }

    retryItem(id) {
        return this.retryItems([id]);
    }

    retryItems(ids) {
        return this.store.dispatch({
            type: RETRY_ITEMS,
            payload: ids,
            meta: {
                completed: true
            }
        });
    }

    async retryAll() {
        const unsynced = await this.unsyncedItems();
        this.retryItems(unsynced.map(item => item.id));
        await this.waitForAll();
    }

    sendAll() {
        throw new Error(
            'sendall() no longer supported; use retryAll() and/or waitForAll() instead'
        );
    }

    _dequeue(array, action, context) {
        if (action.type === REMOVE_ITEMS) {
            return array.filter(
                item => action.payload.indexOf(item.meta.outboxId) === -1
            );
        } else if (action.type === RETRY_ITEMS) {
            return array.map(item => {
                if (action.payload.indexOf(item.meta.outboxId) === -1) {
                    return item;
                } else {
                    return {
                        ...item,
                        meta: {
                            ...item.meta,
                            completed: false,
                            success: undefined
                        }
                    };
                }
            });
        } else if (action.meta.offlineAction) {
            // Mark status but don't remove item completely
            const outboxId = action.meta.offlineAction.meta.outboxId;
            if (!outboxId) {
                return array;
            }
            return array.map(item => {
                if (item.meta.outboxId === outboxId) {
                    return this._applyResult(item, action);
                } else if (item.meta.parents && action.meta.success) {
                    return this._updateParents(
                        item,
                        outboxId,
                        action.payload.id
                    );
                } else {
                    return item;
                }
            });
        } else {
            return array;
        }
    }

    pause() {
        this.store.dispatch(busy(true));
    }

    resume() {
        this.store.dispatch(busy(false));
    }

    #_waiting = {};

    waitForAll() {
        return this.waitForItem('ALL');
    }

    waitForItem(id) {
        var resolve;
        const promise = new Promise(res => (resolve = res));
        if (!this.#_waiting[id]) {
            this.#_waiting[id] = [];
        }
        this.#_waiting[id].push(resolve);
        return promise;
    }

    async _onUpdate() {
        if (!Object.keys(this.#_waiting).length) {
            return;
        }
        const pending = await this.pendingItems();
        if (!pending.length) {
            this._resolveWaiting('ALL');
        }
        const pendingById = {};
        pending.forEach(item => (pendingById[item.id] = true));
        Object.keys(this.#_waiting).forEach(id => {
            if (!pendingById[id] && id != 'ALL') {
                this._resolveWaiting(id);
            }
        });
    }

    async _resolveWaiting(id) {
        const waiting = this.#_waiting[id];
        if (!waiting) {
            return;
        }
        const item = id === 'ALL' ? null : await this.loadItem(+id);
        waiting.forEach(fn => fn(item));
        delete this.#_waiting[id];
    }

    // Process service send() results
    _applyResult(item, action) {
        if (this.applyResult) {
            console.warn('applyResult() override no longer called');
        }
        const newItem = {
            ...item,
            meta: {
                ...item.meta,
                success: action.meta.success,
                completed: true
            }
        };
        if (newItem.meta.success) {
            if (this.debugNetwork) {
                console.log(
                    'Item successfully sent to ' +
                        item.meta.offline.effect.options.url
                );
            }
            newItem.meta.result = action.payload;
        } else {
            newItem.meta.error = action.payload;
        }
        return newItem;
    }

    _getModel(conf) {
        if (!conf || !conf.name || !conf.list) {
            return null;
        }
        return model({
            store: this.store,
            ...conf
        });
    }

    async loadItems() {
        const actions = this.store.getState().offline.outbox;
        const items = actions
            .map(action => {
                const { data, options } = action.meta.offline.effect;
                var item = {
                    id: options.id,
                    data: data,
                    options: { ...options },
                    synced: !!action.meta.success
                };
                delete item.options.id;
                if (action.meta.parents) {
                    item.parents = action.meta.parents;
                }
                if (action.meta.success) {
                    item.result = action.meta.result;
                } else if (action.meta.completed) {
                    const error = action.meta.error;
                    if (error) {
                        item.error =
                            error.json ||
                            error.text ||
                            error.status ||
                            '' + error;
                    } else {
                        item.error = 'Error';
                    }
                }
                return item;
            })
            .sort((a, b) => {
                return b.id - a.id;
            });
        return {
            list: items,
            count: items.length,
            pages: 1,
            per_page: items.length
        };
    }

    // Count of unsynced outbox items (never synced, or sync was unsuccessful)
    async unsynced(modelConf) {
        const items = await this.unsyncedItems(modelConf);
        return items.length;
    }

    // Actual unsynced items
    async unsyncedItems(modelConf, withData) {
        var items = (await this.loadItems()).list.filter(item => !item.synced);

        // Exclude temporary items from list
        items = items.filter(item => {
            if (item.options.storage == 'temporary') {
                if (item.options.desiredStorage) {
                    return true;
                }
                return false;
            } else {
                return true;
            }
        });

        if (modelConf)
            // Only match items corresponding to the specified list
            items = items.filter(item => {
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

        if (withData) {
            return await Promise.all(
                items.map(item => this._loadItemData(item))
            );
        } else {
            return items;
        }
    }

    // Unsynced items that have not been attempted (or retried)
    async pendingItems(modelConf, withData) {
        const unsynced = await this.unsyncedItems(modelConf, withData);
        return unsynced.filter(item => {
            return !item.hasOwnProperty('error');
        });
    }

    async loadItem(itemId) {
        var item = (await this.loadItems()).list.find(
            item => item.id === itemId
        );
        item = await this._loadItemData(item);
        return this._parseJsonForm(item);
    }

    #_memoryItems = {};
    async _loadItemData(item) {
        if (!item || !item.options || !item.options.storage) {
            return item;
        } else if (item.options.storage == 'temporary') {
            return setData(item, this.#_memoryItems[item.id]);
        } else {
            return this.store.lf
                .getItem('outbox_' + item.id)
                .then(data => setData(item, data), () => setData(item, null));
        }
        function setData(obj, data) {
            if (data) {
                obj.data = data;
            } else {
                obj.label = '[Form Data Missing]';
                obj.missing = true;
            }
            return obj;
        }
    }

    _parseJsonForm(item) {
        if (!item || !item.data) {
            return item;
        }
        var values = [],
            key;
        for (key in item.data) {
            values.push({
                name: key,
                value: item.data[key]
            });
        }
        item.data = convert(values);
        for (key in item.data) {
            if (Array.isArray(item.data[key])) {
                item.data[key].forEach((row, i) => {
                    row['@index'] = i;
                });
            }
        }
        return item;
    }

    async _updateItemData(item) {
        if (!item.data) {
            return item;
        }
        if (!item.options || !item.options.storage) {
            return item;
        }
        if (item.options.storage == 'temporary') {
            this.#_memoryItems[item.id] = item.data;
            return this._withoutData(item);
        } else {
            return this.store.lf.setItem('outbox_' + item.id, item.data).then(
                () => this._withoutData(item),
                () => {
                    console.warn('could not save form contents to storage');
                    item.options.desiredStorage = item.options.storage;
                    item.options.storage = 'temporary';
                    return this._updateItemData(item);
                }
            );
        }
    }

    _withoutData(item) {
        if (!item.data) {
            return item;
        }
        if (!item.options || !item.options.storage) {
            return item;
        }
        var obj = {};
        Object.keys(item)
            .filter(key => {
                return key != 'data';
            })
            .forEach(key => {
                obj[key] = item[key];
            });
        return obj;
    }

    async _cleanUpItemData() {
        var validId = {};
        const validItems = (await this.loadItems()).list;
        validItems.forEach(item => {
            validId[item.id] = true;
        });
        Object.keys(this.#_memoryItems).forEach(itemId => {
            if (!validId[itemId]) {
                delete this.#_memoryItems[itemId];
            }
        });
        const keys = await this.store.lf.keys();
        await Promise.all(
            keys
                .filter(key => key.indexOf('outbox_') === 0)
                .map(key => key.replace('outbox_', ''))
                .filter(itemId => !validId[itemId])
                .map(itemId => this.store.lf.removeItem('outbox_' + itemId))
        );
    }

    _serialize(state) {
        return {
            ...state,
            outbox: state.outbox.map(action => this._serializeAction(action))
        };
    }
    _serializeAction(action) {
        if (!action.meta || !action.meta.error) {
            return action;
        }
        var error = {};
        ['json', 'text', 'status'].forEach(key => {
            if (key in action.meta.error) {
                error[key] = action.meta.error[key];
            }
        });
        if (!Object.keys(error).length) {
            error.text = '' + action.meta.error;
        }
        return {
            ...action,
            meta: {
                ...action.meta,
                error
            }
        };
    }
    _deserialize(state) {
        return state;
    }
}

var outbox = new Outbox(ds);

function getOutbox(store) {
    if (_outboxes[store.name]) {
        return _outboxes[store.name];
    } else {
        return new Outbox(store);
    }
}

outbox.getOutbox = getOutbox;

export default outbox;
export { Outbox, getOutbox };
