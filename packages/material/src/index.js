import react from '@wq/react';
import App from './App';
import * as components from './components/index';
import * as inputs from './components/inputs/index';
import { init, start } from './hooks';

export default {
    name: 'material',
    dependencies: [react],

    config: {
        theme: {}
    },

    components: { App, ...components },
    inputs: { ...inputs },

    init,
    start
};
