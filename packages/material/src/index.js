import App from './App';
import {
    Container,
    Header,
    Footer,
    Main,
    Spinner,
    Link,
    ButtonLink,
    ListItemLink,
    FormRoot,
    FormActions,
    FormError,
    Button,
    SubmitButton,
    Breadcrumbs,
    Pagination
} from './components/index';
import { Input, Select, Radio, Toggle } from './inputs/index';
import { List, Detail, Loading, Index, Logout, Outbox } from './views/index';

export default {
    name: 'material',

    config: {
        theme: {}
    },

    components: {
        App,
        Container,
        Header,
        Footer,
        Main,
        Spinner,
        Link,
        ButtonLink,
        ListItemLink,
        FormRoot,
        FormActions,
        FormError,
        Button,
        SubmitButton,
        Breadcrumbs,
        Pagination
    },
    inputs: {
        Input,
        Select,
        Radio,
        Toggle
    },
    views: {
        // Common pages
        index: Index,
        logout: Logout,
        outbox: Outbox,

        // Generic @wq/app routes
        '*_list': List,
        '*_detail': Detail,
        '*_*': Detail,

        // Fallback views
        loading: Loading
    },

    init(config) {
        if (config) {
            Object.assign(this.config, config);
        }
    }
};
