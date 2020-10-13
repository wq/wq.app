import React from 'react';
import { Field } from 'formik';
import {
    DatePicker,
    TimePicker,
    DateTimePicker
} from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import PropTypes from 'prop-types';

const pickers = {
    date: DatePicker,
    time: TimePicker,
    datetime: DateTimePicker
};

export default function DateTime({ type, hint, ...rest }) {
    const Picker = pickers[type];
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Field
                fullWidth
                margin="dense"
                component={Picker}
                helperText={hint}
                {...rest}
            />
        </MuiPickersUtilsProvider>
    );
}

DateTime.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    hint: PropTypes.string
};
