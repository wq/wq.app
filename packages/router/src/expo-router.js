import { useMemo, useCallback } from "react";
import { router as expoRouter } from "expo-router";
import queryString from "query-string";
import router from "./src/router.js";

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
