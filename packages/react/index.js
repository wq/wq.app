import reactRenderer from './src/index';
import App from './src/App';
import Link from './src/components/Link';
import {
    useNav,
    useRenderContext,
    useRouteInfo,
    useTitle,
    useReverse,
    useIndexRoute,
    useBreadcrumbs,
    useSpinner,
    useComponents,
    useViews,
    useApp,
    usePlugin,
    usePluginContent
} from './src/hooks';

export default reactRenderer;

export {
    App,
    Link,
    useNav,
    useRenderContext,
    useRouteInfo,
    useTitle,
    useReverse,
    useIndexRoute,
    useBreadcrumbs,
    useSpinner,
    useComponents,
    useViews,
    useApp,
    usePlugin,
    usePluginContent
};
