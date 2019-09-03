const SPIN_START = 'SPIN_START';
const SPIN_DURATION = '@@SPIN_DURATION';
const SPIN_STOP = 'SPIN_STOP';

export default {
    name: 'spinner',
    actions: {
        start: (message, duration, type) => ({
            type: SPIN_START,
            payload: {
                message,
                duration,
                type
            }
        }),
        alert: message => ({
            type: SPIN_DURATION,
            payload: {
                message,
                duration: 1.5,
                type: 'alert'
            }
        }),
        stop: () => ({ type: SPIN_STOP })
    },
    thunks: {
        SPIN_DURATION: async (dispatch, getState, bag) => {
            const { action } = bag,
                { message, duration, type } = action.payload;

            dispatch({
                type: SPIN_START,
                payload: {
                    message,
                    type
                }
            });
            if (duration) {
                await new Promise(resolve =>
                    setTimeout(resolve, duration * 1000)
                );
                dispatch({ type: SPIN_STOP });
            }
        }
    },
    reducer(context = {}, action) {
        if (action.type === SPIN_START) {
            context = {
                active: true,
                ...action.payload
            };
        } else if (action.type === SPIN_STOP) {
            context = {};
        }
        return context;
    }
};
