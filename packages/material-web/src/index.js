import react from '@wq/react';
import App from './App';
import * as components from './components/index';
import * as inputs from './inputs/index';
import * as icons from './icons';
import { format, parse } from './inputs/date-utils';

export default {
    name: 'material',
    dependencies: [react],

    config: {
        theme: {
            primary: '#7500ae',
            secondary: '#0088bd'
        },
        inputFormat: {
            date: 'yyyy-MM-dd',
            time: 'HH:mm',
            datetime: 'yyyy-MM-dd HH:mm'
        }
    },

    components: { App, ...components },
    inputs: { ...inputs },
    icons: { ...icons },

    init(config) {
        if (!config) {
            return;
        }
        if (config.theme) {
            Object.assign(this.config.theme, config.theme);
        }
        if (config.inputFormat) {
            Object.assign(this.config.inputFormat, config.inputFormat);
        }
    }
};

export { App };
export * from './components/index';
export * from './inputs/index';
export * from './hooks';
export { format, parse };
