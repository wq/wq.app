import { Model, model as createModel } from './model.js';

const orm = {
    // Plugin attributes
    name: 'orm',
    type: 'orm',
    init() {
        for (const conf of Object.values(this.app.config.pages)) {
            if (!conf.list) {
                continue;
            }
            const model = createModel(conf);
            this.models[conf.name] = model;
            if (!this._orm) {
                this._orm = model.orm;
            }
        }
        this.app.models = this.models;
        this.app.prefetchAll = message => this.prefetchAll(message);
        this.app.resetAll = () => this.reset();
    },
    actions: {
        reset() {
            return { type: 'ORM_RESET' };
        }
    },
    reducer(state, action) {
        if (!this._orm) {
            return state;
        }
        return this._orm.reducer(state, action);
    },
    persist: true,

    // Custom attributes
    models: {},
    async prefetchAll(message) {
        if (message) {
            this.app.spin.start(message);
        }
        const result = await Promise.all(
            Object.values(this.models).map(model => model.prefetch())
        );
        if (message) {
            this.app.spin.stop(message);
        }
        return result;
    }
};

export default orm;

export { Model, createModel, createModel as model };
