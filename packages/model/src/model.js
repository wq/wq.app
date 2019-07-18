import ds from '@wq/store';
import deepcopy from 'deepcopy';
import { Model as ORMModel, ORM } from 'redux-orm';

function model(config) {
    return new Model(config);
}

const _orms = {};

const CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    SUCCESS = 'SUCCESS',
    DELETE = 'DELETE',
    OVERWRITE = 'OVERWRITE';

class ORMWithReducer extends ORM {
    constructor(store) {
        super();
        this.store = store;
    }
    get prefix() {
        if (this.store.name === 'main') {
            return 'ORM';
        } else {
            return `${this.store.name.toUpperCase()}ORM`;
        }
    }
    reducer(state, action) {
        const session = this.session(state || this.getEmptyState()),
            match = action.type.match(/^([^_]+)_(.+)_([^_]+)$/);

        if (!match || match[1] !== this.prefix) {
            return session.state;
        }

        const modelName = match[2].toLowerCase(),
            actName = match[3],
            cls = session[modelName];

        if (!cls) {
            return session.state;
        }
        const currentCount = cls.count();
        let updateCount;

        switch (actName) {
            case CREATE: {
                cls.create(action.payload);
                updateCount = true;
                break;
            }
            case UPDATE:
            case SUCCESS: {
                const items = Array.isArray(action.payload)
                    ? action.payload
                    : [action.payload];

                if (
                    action.meta &&
                    action.meta.currentId &&
                    action.meta.currentId != items[0].id
                ) {
                    const exist = cls.withId(action.meta.currentId);
                    if (exist) {
                        // See redux-orm #176
                        cls.create({
                            ...exist.ref,
                            id: items[0].id
                        });
                        exist.delete();
                    }
                }
                items.forEach(item => cls.upsert(item));

                updateCount = true;

                break;
            }
            case DELETE: {
                cls.withId(action.payload).delete();
                updateCount = true;
                break;
            }
            case OVERWRITE: {
                const { list, ...info } = action.payload;
                cls.all().delete();
                list.forEach(item => cls.create(item));
                session._modelmeta.upsert({
                    id: cls.modelName,
                    ...info
                });
                break;
            }
        }

        if (updateCount) {
            const meta = session._modelmeta.withId(cls.modelName);
            if (meta) {
                // Use delta in case server count != local count.
                const countChange = cls.count() - currentCount,
                    update = { count: meta.count + countChange };
                if (meta.pages === 1 && meta.per_page === meta.count) {
                    update.per_page = update.count;
                }
                meta.update(update);
            } else {
                session._modelmeta.create({
                    id: cls.modelName,
                    pages: 1,
                    count: cls.count(),
                    per_page: cls.count()
                });
            }
        }

        return session.state;
    }
}

class ModelMeta extends ORMModel {}
ModelMeta.modelName = '_modelmeta';

function orm(store) {
    if (!_orms[store.name]) {
        const orm = (_orms[store.name] = new ORMWithReducer(store));
        store.addReducer(
            'orm',
            (state, action) => orm.reducer(state, action),
            true
        );
        orm.register(ModelMeta);
    }
    return _orms[store.name];
}

model.cacheOpts = {
    // First page (e.g. 50 records) is stored locally; subsequent pages can be
    // loaded from server.
    first_page: {
        server: true,
        client: true,
        page: 1,
        reversed: true
    },

    // All data is prefetched and stored locally, no subsequent requests are
    // necessary.
    all: {
        server: false,
        client: true,
        page: 0,
        reversed: false
    },

    // "Important" data is cached; other data can be accessed via pagination.
    filter: {
        server: true,
        client: true,
        page: 0,
        reversed: true
    },

    // No data is cached locally; all data require a network request.
    none: {
        server: true,
        client: false,
        page: 0,
        reversed: false
    }
};

// Retrieve a stored list as an object with helper functions
//  - especially useful for server-paginated lists
//  - methods must be called asynchronously
class Model {
    constructor(config) {
        if (!config) {
            throw 'No configuration provided!';
        }
        if (typeof config == 'string') {
            config = { query: config, name: config };
        }

        if (!config.name) {
            throw new Error('Model name is now required.');
        }

        if (!config.cache) {
            config.cache = 'first_page';
        }

        this.config = config;
        this.name = config.name;
        this.idCol = config.idCol || 'id';
        this.opts = model.cacheOpts[config.cache];

        if (!this.opts) {
            throw 'Unknown cache option ' + config.cache;
        }
        ['max_local_pages', 'partial', 'reversed'].forEach(function(name) {
            if (name in config) {
                throw '"' + name + '" is deprecated in favor of "cache"';
            }
        });

        // Default to main store, but allow overriding
        if (config.store) {
            if (config.store instanceof ds.constructor) {
                this.store = config.store;
            } else {
                this.store = ds.getStore(config.store);
            }
        } else {
            this.store = ds;
        }

        this.orm = orm(this.store);

        try {
            this.model = this.orm.get(this.name);
        } catch (e) {
            const idCol = this.idCol;
            class M extends ORMModel {
                static get idAttribute() {
                    return idCol;
                }
                static get fields() {
                    return {};
                }
            }
            M.modelName = this.name;
            this.orm.register(M);
            this.model = M;
        }

        if (config.query) {
            this.query = this.store.normalizeQuery(config.query);
        } else if (config.url !== undefined) {
            this.query = { url: config.url };
        }

        // Configurable functions to e.g. filter data by
        this.functions = config.functions || {};
    }

    expandActionType(type) {
        return `${this.orm.prefix}_${this.name.toUpperCase()}_${type}`;
    }

    dispatch(type, payload, meta) {
        const action = {
            type: this.expandActionType(type),
            payload: payload
        };
        if (meta) {
            action.meta = meta;
        }
        return this.store.dispatch(action);
    }

    getSession() {
        return this.orm.session(this.store.getState().orm);
    }

    getSessionModel() {
        const model = this.getSession()[this.name];
        if (!model) {
            throw new Error('Could not find model in session');
        }
        return model;
    }

    getQuerySet() {
        const model = this.getSessionModel();
        return model
            .all()
            .orderBy(this.idCol, this.opts.reversed ? 'desc' : 'asc');
    }

    get objects() {
        return this.getQuerySet();
    }

    async getPage(page_num) {
        var query = { ...this.query };
        if (page_num !== null) {
            query.page = page_num;
        }

        const result = await this.store.fetch(query);
        var data = this._processData(result);
        if (!data.page) {
            data.page = page_num;
        }
        return data;
    }

    _processData(data) {
        if (!data) {
            data = [];
        }
        if (Array.isArray(data)) {
            data = { list: data };
        }
        if (!data.pages) {
            data.pages = 1;
        }
        if (!data.count) {
            data.count = data.list.length;
        }
        if (!data.per_page) {
            data.per_page = data.list.length;
        }
        return data;
    }

    async load() {
        const info = await this.info();
        return {
            ...info,
            list: this.getQuerySet().toRefArray()
        };
    }

    async info(retry = true) {
        const info = this.getSession()._modelmeta.withId(this.name);
        if (info) {
            const { pages, count, per_page } = info.ref;
            return { pages, count, per_page };
        } else {
            if (this.query && retry) {
                await this.prefetch();
                return this.info(false);
            } else {
                return {
                    pages: 1,
                    count: 0,
                    per_page: 0
                };
            }
        }
    }

    async ensureLoaded() {
        await this.info();
    }

    // Load data for the given page number
    async page(page_num) {
        if (!this.config.url) {
            if (page_num > this.opts.page) {
                throw new Error('No URL, cannot retrieve page ' + page_num);
            }
        }
        if (page_num <= this.opts.page) {
            // Store data locally
            return this.load();
        } else {
            // Fetch on demand but don't store
            return this.getPage(page_num);
        }
    }

    // Iterate across stored data
    async forEach(cb, thisarg) {
        const data = await this.load();
        data.list.forEach(cb, thisarg);
    }

    // Find an object by id
    async find(value, localOnly) {
        if (localOnly && typeof localOnly !== 'boolean') {
            throw new Error(
                'Usage: find(value[, localOnly).  To customize id attr use config.idCol'
            );
        }
        await this.ensureLoaded();
        const model = this.getSessionModel(),
            instance = model.withId(value);

        if (instance) {
            return deepcopy(instance.ref);
        } else if (
            value !== undefined &&
            !localOnly &&
            this.opts.server &&
            this.config.url
        ) {
            return await this.store.fetch('/' + this.config.url + '/' + value);
        } else {
            return null;
        }
    }

    // Filter an array of objects by one or more attributes
    async filterPage(filter, any, localOnly) {
        // If partial list, we can never be 100% sure all filter matches are
        // stored locally. In that case, run query on server.
        if (!localOnly && this.opts.server && this.config.url) {
            // FIXME: won't work as expected if any == true
            const result = await this.store.fetch({
                url: this.config.url,
                ...filter
            });
            return this._processData(result);
        }

        if (!filter || !Object.keys(filter).length) {
            // No filter: return unmodified list directly
            return this.load();
        }

        await this.ensureLoaded();

        var qs = this.getQuerySet();
        if (any) {
            // any=true: Match on any of the provided filter attributes
            qs = qs.filter(item => {
                return (
                    Object.keys(filter).filter(attr => {
                        return this.matches(item, attr, filter[attr]);
                    }).length > 0
                );
            });
        } else {
            // Default: require match on all filter attributes

            // Use object filter to take advantage of redux-orm indexes -
            // except for boolean/array/computed filters.
            var defaultFilter = {},
                customFilter = {},
                hasDefaultFilter = false,
                hasCustomFilter = false;
            Object.keys(filter).forEach(attr => {
                const comp = filter[attr];
                if (this.isCustomFilter(attr, comp)) {
                    customFilter[attr] = comp;
                    hasCustomFilter = true;
                } else {
                    defaultFilter[attr] = comp;
                    hasDefaultFilter = true;
                }
            });
            if (hasDefaultFilter) {
                qs = qs.filter(defaultFilter);
            }
            if (hasCustomFilter) {
                qs = qs.filter(item => {
                    var match = true;
                    Object.keys(customFilter).forEach(attr => {
                        if (!this.matches(item, attr, customFilter[attr])) {
                            match = false;
                        }
                    });
                    return match;
                });
            }
        }
        return deepcopy(this._processData(qs.toRefArray()));
    }

    // Filter an array of objects by one or more attributes
    async filter(filter, any, localOnly) {
        const data = await this.filterPage(filter, any, localOnly);
        return data.list;
    }

    // Create new item
    async create(object) {
        this.dispatch(CREATE, object);
    }

    // Merge new/updated items into list
    async update(update, idCol) {
        if (idCol) {
            throw new Error(
                'Usage: update(items).  To customize id attr use config.idCol'
            );
        }
        return this.dispatch(UPDATE, update);
    }

    async remove(id, idCol) {
        if (idCol) {
            throw new Error(
                'Usage: remove(id).  To customize id attr use config.idCol'
            );
        }
        return this.dispatch(DELETE, id);
    }

    // Overwrite entire list
    async overwrite(data) {
        if (data.pages == 1 && data.list) {
            data.count = data.per_page = data.list.length;
        } else {
            data = this._processData(data);
        }
        return this.dispatch(OVERWRITE, data);
    }

    // Prefetch list
    async prefetch() {
        const data = await this.getPage(null);
        return this.overwrite(data);
    }

    // Helper for partial list updates (useful for large lists)
    // Note: params should contain correct arguments to fetch only "recent"
    // items from server; idcol should be a unique identifier for the list
    async fetchUpdate(params, idCol) {
        if (idCol) {
            throw new Error(
                'Usage: fetchUpdate(params).  To customize id attr use config.idCol'
            );
        }
        // Update local list with recent items from server
        var q = { ...this.query, ...params };
        const data = await this.store.fetch(q);
        return this.update(data);
    }

    // Unsaved form items related to this list
    unsyncedItems(withData) {
        // Note: wq/outbox needs to have already been loaded for this to work
        var outbox = this.store.outbox;
        if (!outbox) {
            return Promise.resolve([]);
        }
        return outbox.unsyncedItems(this.query, withData);
    }

    // Apply a predefined function to a retreived item
    compute(fn, item) {
        if (this.functions[fn]) {
            return this.functions[fn](item);
        } else {
            return null;
        }
    }

    isCustomFilter(attr, comp) {
        return (
            this.functions[attr] ||
            isPotentialBoolean(comp) ||
            Array.isArray(comp)
        );
    }

    matches(item, attr, comp) {
        var value;

        if (this.functions[attr]) {
            value = this.compute(attr, item);
        } else {
            value = item[attr];
        }

        if (Array.isArray(comp)) {
            return comp.filter(c => checkValue(value, c)).length > 0;
        } else {
            return checkValue(value, comp);
        }

        function checkValue(value, comp) {
            if (isRawBoolean(value)) {
                return value === toBoolean(comp);
            } else if (typeof value === 'number') {
                return value === +comp;
            } else if (Array.isArray(value)) {
                return value.filter(v => checkValue(v, comp)).length > 0;
            } else {
                return value === comp;
            }
        }
    }
}

function isRawBoolean(value) {
    return [null, true, false].indexOf(value) > -1;
}

function toBoolean(value) {
    if ([true, 'true', 1, '1', 't', 'y'].indexOf(value) > -1) {
        return true;
    } else if ([false, 'false', 0, '0', 'f', 'n'].indexOf(value) > -1) {
        return false;
    } else if ([null, 'null'].indexOf(value) > -1) {
        return null;
    } else {
        return value;
    }
}

function isPotentialBoolean(value) {
    return isRawBoolean(toBoolean(value));
}

model.Model = Model;

export default model;

export { Model };
