import reactRenderer from './src/index';
import App from './src/App';
import {
    Link,
    Form,
    FormError,
    AutoForm,
    AutoInput,
    AutoSubform,
    AutoSubformArray,
    DebugContext
} from './src/components/index';
import {
    useRoutesMap,
    useNav,
    useRenderContext,
    useContextTitle,
    useRouteInfo,
    useRouteTitle,
    useReverse,
    useIndexRoute,
    useBreadcrumbs,
    useSpinner,
    useComponents,
    useInputComponents,
    useHtmlInput,
    useViewComponents,
    useApp,
    useModel,
    usePlugin,
    usePluginComponentMap,
    usePluginState,
    usePluginContent
} from './src/hooks';

export default reactRenderer;

export {
    App,
    Link,
    Form,
    FormError,
    AutoForm,
    AutoInput,
    AutoSubform,
    AutoSubformArray,
    DebugContext,
    useRoutesMap,
    useNav,
    useRenderContext,
    useContextTitle,
    useRouteInfo,
    useRouteTitle,
    useReverse,
    useIndexRoute,
    useBreadcrumbs,
    useSpinner,
    useComponents,
    useInputComponents,
    useHtmlInput,
    useViewComponents,
    useApp,
    useModel,
    usePlugin,
    usePluginComponentMap,
    usePluginState,
    usePluginContent
};
