import * as ReduxFirstRouter from "redux-first-router";
import * as PathUtils from "rudy-history/PathUtils.js";
import rudyMatchPath from "rudy-match-path";

const {
    getOptions,
    history,
    actionToPath,
    pathToAction,
    redirect,
    selectLocationState,
} = ReduxFirstRouter;

const { stripBasename } = PathUtils;

const matchPath = rudyMatchPath.default || rudyMatchPath;

export {
    getOptions,
    history,
    actionToPath,
    pathToAction,
    redirect,
    selectLocationState,
    stripBasename,
};

export default matchPath;
