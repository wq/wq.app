import react from '@wq/react';
import App from './App';
import * as components from './components/index';
import * as inputs from './components/inputs/index';
import * as icons from './components/icons/index';

export default {
    name: 'material',
    dependencies: [react],

    config: {
        theme: {
            primary: '#550099',
            secondary: '#0dccb1'
        }
    },

    components: { App, ...components },
    inputs: { ...inputs },
    icons: { ...icons },

    init(config) {
        if (config) {
            Object.assign(this.config, config);
        }
    }
};

export { App };
export * from './components/index';
export * from './components/inputs/index';
