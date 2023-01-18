const SPIN_START = "SPIN_START";
const SPIN_DURATION = "@@SPIN_DURATION";
const SPIN_STOP = "SPIN_STOP";

export default {
    name: "spinner",
    actions: {
        start: (message, duration, type) => ({
            type: SPIN_START,
            payload: {
                message,
                duration,
                type,
            },
        }),
        alert: (message) => ({
            type: SPIN_DURATION,
            payload: {
                message,
                duration: 1.5,
                type: "alert",
            },
        }),
        stop: (message) => ({ type: SPIN_STOP, payload: { message } }),
    },
    thunks: {
        SPIN_DURATION: async (dispatch, getState, bag) => {
            const { action } = bag,
                { message, duration, type } = action.payload;

            dispatch({
                type: SPIN_START,
                payload: {
                    message,
                    type,
                },
            });
            if (duration) {
                await new Promise((resolve) =>
                    setTimeout(resolve, duration * 1000)
                );
                dispatch({ type: SPIN_STOP, payload: { message } });
            }
        },
    },
    reducer(state, action) {
        if (action.type !== SPIN_START && action.type !== SPIN_STOP) {
            return state || { active: false };
        }
        const message = action.payload.message || "",
            messages = (state.messages || []).filter((msg) => msg != message);

        if (action.type === SPIN_START) {
            messages.push(message);
            return {
                active: true,
                type: action.payload.type,
                message,
                messages,
            };
        } else if (action.type === SPIN_STOP) {
            if (messages.length > 0) {
                return {
                    ...state,
                    messages,
                };
            } else {
                return { active: false };
            }
        }
    },
};
