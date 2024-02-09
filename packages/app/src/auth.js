const LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGIN_CHECK = "LOGIN_CHECK",
    LOGIN_RELOAD = "LOGIN_RELOAD",
    LOGOUT_SUBMIT = "LOGOUT_SUBMIT",
    LOGOUT_SUCCESS = "LOGOUT_SUCCESS",
    CSRFTOKEN = "CSRFTOKEN";

export default {
    name: "auth",
    persist: true,

    pages: {
        login: {
            url: "login",
            show_in_index: "not_authenticated",
            order: 1000,
            icon: "login",
        },

        logout: {
            url: "logout",
            show_in_index: "is_authenticated",
            order: 1000,
            icon: "logout",
            thunk(dispatch, getState) {
                if (!getState().auth.user) {
                    return;
                }
                dispatch({ type: LOGOUT_SUBMIT });
            },
        },
    },

    start() {
        this.refreshCSRFToken();
        this.app.store.dispatch({ type: LOGIN_CHECK });
    },

    getState() {
        return this.app.store.getState().auth || {};
    },

    reducer(state = {}, action) {
        switch (action.type) {
            case LOGIN_SUCCESS:
            case LOGIN_RELOAD: {
                const { user, config, csrftoken } = action.payload;
                return { user, config, csrftoken };
            }
            case LOGOUT_SUBMIT: {
                return {};
            }
            case LOGOUT_SUCCESS: {
                const { csrftoken } = action.payload || {};
                if (csrftoken) {
                    return { csrftoken };
                } else {
                    return {};
                }
            }
            case CSRFTOKEN: {
                const { csrftoken } = action.payload;
                return {
                    ...state,
                    csrftoken,
                };
            }
            default: {
                return state;
            }
        }
    },
    thunks: {
        CSRFTOKEN() {
            this.refreshCSRFToken();
        },

        // LOGIN_SUBMIT handled automatically by @wq/outbox form logic

        LOGIN_SUCCESS() {
            this.refreshUserInfo();
        },

        LOGIN_RELOAD() {
            this.refreshUserInfo();
        },

        LOGIN_CHECK(dispatch, getState) {
            const user = getState().auth.user,
                ds = this.app.store;
            setTimeout(function () {
                ds.fetch("/login").then(function (result) {
                    if (result && result.user && result.config) {
                        dispatch({
                            type: LOGIN_RELOAD,
                            payload: result,
                        });
                    } else {
                        const { csrftoken } = result || {};
                        dispatch({
                            type: user ? LOGOUT_SUCCESS : CSRFTOKEN,
                            payload: {
                                csrftoken,
                            },
                        });
                    }
                });
            }, 10);
        },

        LOGOUT_SUBMIT(dispatch) {
            this.app.store.fetch("/logout").then(function (result) {
                dispatch({
                    type: LOGOUT_SUCCESS,
                    payload: result,
                });
            });
        },

        LOGOUT_SUCCESS() {
            this.refreshUserInfo();
        },
    },

    context(ctx) {
        return this.userInfo(ctx);
    },

    userInfo(ctx = {}) {
        const { user, config, csrftoken } = this.getState(),
            pageConf =
                (ctx && ctx.router_info && ctx.router_info.page_config) || {},
            wqPageConf =
                (config && config.pages && config.pages[pageConf.name]) || {};
        return {
            user: ctx.user_id ? ctx.user : user,
            is_authenticated: !!user,
            app_config: this.app.config,
            user_config: config,
            csrf_token: csrftoken,
            router_info: {
                ...(ctx && ctx.router_info),
                page_config: {
                    ...pageConf,
                    can_view: wqPageConf.can_view !== false,
                    can_add: wqPageConf.can_add || false,
                    can_change: wqPageConf.can_change || false,
                    can_delete: wqPageConf.can_delete || false,
                },
            },
        };
    },

    async refreshUserInfo() {
        await this.refreshCSRFToken();
        const app = this.app,
            context = app.router.getContext();
        if (context) {
            app.router.render(
                {
                    ...context,
                    ...this.userInfo(context),
                },
                true
            );
        }
        // FIXME: Better way to do this?
        app.spin.start();
        await app.prefetchAll();
        app.spin.stop();
        await app.router.reload();
    },

    async refreshCSRFToken() {
        const { csrftoken } = this.getState();
        this.app.outbox.setCSRFToken(csrftoken);
    },
};
