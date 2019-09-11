import App from './App';
import {
    Header,
    Footer,
    Main,
    Spinner,
    Link,
    ButtonLink,
    ListItemLink,
    Breadcrumbs,
    Pagination
} from './components/index';
import {
    List,
    Detail,
    Edit,
    Loading,
    Index,
    Login,
    Logout,
    Outbox
} from './views/index';

export default {
    name: 'material',

    config: {
        theme: {}
    },

    components: {
        App,
        Header,
        Footer,
        Main,
        Spinner,
        Link,
        ButtonLink,
        ListItemLink,
        Breadcrumbs,
        Pagination
    },
    views: {
        // Common pages
        index: Index,
        login: Login,
        logout: Logout,
        outbox: Outbox,

        // Generic @wq/app routes
        '*_list': List,
        '*_detail': Detail,
        '*_edit': Edit,
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
