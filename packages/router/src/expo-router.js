import { useMemo, useCallback } from "react";
import { router as expoRouter } from "expo-router";
import queryString from "query-string";
import router from "./router.js";

router.config.parseRouteInfo = function ({ pathname, segments, params }) {
    const info = {};
    info.name = router.getRouteName(pathname);
    info.template = router.config.getTemplateName(info.name);
    info.prev_path = null;
    info.path = pathname;
    info.path_enc = escape(info.path);
    info.params = {};
    info.slugs = {};
    for (const [key, val] of Object.entries(params)) {
        if (segments.includes(`[${key}]`)) {
            info.slugs[key] = val;
        } else {
            info.params[key] = val;
        }
    }
    info.full_pathname =
        Object.keys(info.params).length === 0
            ? pathname
            : pathname +
              "?" +
              queryString.stringify(info.params, { arrayFormat: "comma" });
    info.full_path_enc = escape(info.full_path);
    return info;
};

router.push = (path) => expoRouter.push(path);
router.notFound = () => {
    throw new Error("Page not found");
};

export default router;

export {
    useRenderContext,
    useRouteInfo,
    useContextTitle,
    RouteContext,
} from "./router.js";

export function useNav(to) {
    return useMemo(() => {
        function nav(path) {
            router.push(path);
        }
        return to ? nav.bind(null, to) : nav;
    }, [to]);
}

export function useReverse() {
    return useCallback((name, slugs, query) => {
        if (!router.routes[name]) {
            throw new Error(`Unknown route: ${name}`);
        }
        let path = router.routes[name].path;
        if (slugs) {
            if (typeof slugs !== "object") {
                slugs = { slug: slugs };
            }
            for (const [key, value] of Object.entries(slugs)) {
                path = path.replace(`:${key}`, value);
            }
        }
        if (query) {
            path +=
                "?" + queryString.stringify(query, { arrayFormat: "comma" });
        }
        return path;
    }, []);
}
