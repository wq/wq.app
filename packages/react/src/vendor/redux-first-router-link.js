import React, { forwardRef } from "react";
import { connect } from "react-redux";
import matchPath, {
    getOptions,
    history,
    actionToPath,
    pathToAction,
    redirect,
    selectLocationState,
    stripBasename,
} from "./redux-first-router.js";

var toUrl = (to, routesMap) => {
    const { querySerializer, basename } = getOptions();
    if (to && typeof to === "string") {
        return history().createHref({
            pathname: to,
        });
    } else if (Array.isArray(to)) {
        const path = `/${to.join("/")}`;
        return history().createHref({
            pathname: path,
        });
    } else if (typeof to === "object") {
        const action = to;
        try {
            const path = actionToPath(action, routesMap, querySerializer);
            return history().createHref({
                pathname: path,
            });
        } catch (e) {
            if (process.env.NODE_ENV === "development") {
                console.warn(
                    "[redux-first-router-link] could not create path from action:",
                    action,
                    "For reference, here are your current routes:",
                    routesMap
                );
            }
            return "#";
        }
    }
    if (process.env.NODE_ENV === "development") {
        console.warn(
            "[redux-first-router-link] `to` prop must be a string, array or action object. You provided:",
            to
        );
    }
    return "#";
};

var handlePress = (
    url,
    routesMap,
    onClick,
    shouldDispatch,
    target,
    dispatch,
    to,
    dispatchRedirect,
    e
) => {
    let shouldGo = true;
    if (onClick) {
        shouldGo = onClick(e); // onClick can return false to prevent dispatch
        shouldGo = typeof shouldGo === "undefined" ? true : shouldGo;
    }
    const prevented = e.defaultPrevented;
    if (e.button !== 1 && !target && e && e.preventDefault && !isModified(e)) {
        e.preventDefault();
    }
    if (
        shouldGo &&
        shouldDispatch &&
        !target &&
        !prevented &&
        e.button === 0 &&
        !isModified(e)
    ) {
        const { querySerializer: serializer } = getOptions();
        let action = to;
        if (!isAction(to)) {
            url =
                url.indexOf("#") > -1
                    ? url.substring(url.indexOf("#") + 1, url.length)
                    : url;
            action = pathToAction(url, routesMap, serializer);
        }
        action = dispatchRedirect ? redirect(action) : action;
        dispatch(action);
    }
};
const isAction = (to) => typeof to === "object" && !Array.isArray(to);
const isModified = (e) => !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);

var preventDefault = (e) => e && e.preventDefault && e.preventDefault();

const Link = React.forwardRef(
    (
        {
            to,
            href,
            redirect,
            replace,
            tagName = "a",
            children,
            onPress,
            onClick,
            down = false,
            shouldDispatch = true,
            target,
            dispatch,
            routesMap,
            ...props
        },
        ref
    ) => {
        to = href || to; // href is deprecated and will be removed in next major version

        const url = toUrl(to, routesMap);
        const handler = handlePress.bind(
            null,
            url,
            routesMap,
            onPress || onClick,
            shouldDispatch,
            target,
            dispatch,
            to,
            replace || redirect
        );
        const Root = tagName;
        const localProps = {};
        if (tagName === "a" && url) {
            localProps.href = url;
        }
        if (down && handler) {
            localProps.onMouseDown = handler;
            localProps.onTouchStart = handler;
        }
        if (target) {
            localProps.target = target;
        }
        return /*#__PURE__*/ React.createElement(
            Root,
            {
                onClick: (!down && handler) || preventDefault,
                ...localProps,
                ...props,
                ref,
            },
            children
        );
    }
);
const mapState$1 = (state) => ({
    routesMap: selectLocationState(state).routesMap,
});
const connector$1 = connect(mapState$1, undefined, undefined, {
    forwardRef: true,
});

// $FlowIgnore
var Link$1 = connector$1(Link);

const NavLink = forwardRef(
    (
        {
            to,
            href,
            location,
            className,
            style,
            activeClassName = "active",
            activeStyle,
            ariaCurrent = "true",
            exact,
            strict,
            isActive,
            ...props
        },
        ref
    ) => {
        to = href || to;
        const options = getOptions();
        const basename = options.basename ? options.basename : "";
        const path = toUrl(to, location.routesMap).split("?")[0];
        const match = matchPath(location.pathname, {
            path: stripBasename(path, basename),
            exact,
            strict,
        });
        const active = !!(isActive ? isActive(match, location) : match);
        const combinedClassName = active
            ? [className, activeClassName].filter((i) => i).join(" ")
            : className;
        const combinedStyle = active
            ? {
                  ...style,
                  ...activeStyle,
              }
            : style;
        return /*#__PURE__*/ React.createElement(Link, {
            className: combinedClassName,
            style: combinedStyle,
            "aria-current": active && ariaCurrent,
            routesMap: location.routesMap,
            ref,
            to,
            ...props,
        });
    }
);
const mapState = (state) => ({
    location: selectLocationState(state),
});
const connector = connect(mapState, undefined, undefined, {
    forwardRef: true,
});

// $FlowIgnore
var NavLink$1 = connector(NavLink);

export { NavLink$1 as NavLink, Link$1 as default };
