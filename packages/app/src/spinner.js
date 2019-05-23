var jqm;

const SPIN_START = 'SPIN_START';
const SPIN_STOP = 'SPIN_STOP';

async function startSpin(dispatch, getState, bag) {
    const { action } = bag,
        { duration } = action.payload;

    if (duration) {
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        dispatch({ type: SPIN_STOP });
    }
}

function reducer(context = {}, action) {
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

function render(state) {
    if (!jqm) {
        return;
    }
    if (state.spinner && state.spinner.active) {
        var { options: opts, message: msg } = state.spinner;

        if (!opts) {
            opts = {};
        }
        if (msg) {
            opts.text = msg;
            opts.textVisible = true;
        }
        jqm.loading('show', opts);
    } else {
        jqm.loading('hide');
    }
}

export default {
    name: 'spinner',
    init: function() {
        jqm = this.app.jQuery && this.app.jQuery.mobile;
    },
    actions: {
        start: (msg, duration, opts) => ({
            type: SPIN_START,
            payload: {
                message: msg,
                duration: duration,
                opts: opts
            }
        }),
        stop: () => ({ type: SPIN_STOP })
    },
    thunks: {
        SPIN_START: startSpin
    },
    reducer: reducer,
    render: render
};
