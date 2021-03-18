import React, { useEffect } from 'react';
import { Field, useField } from 'formik';
import {
    DatePicker,
    TimePicker,
    DateTimePicker
} from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import PropTypes from 'prop-types';
import { format, parse } from './date-utils';

function makeUtils(type) {
    class Utils extends DateFnsUtils {
        date(value) {
            if (typeof value === 'undefined') {
                return new Date();
            } else if (value instanceof Date) {
                return value;
            } else {
                return parse[type](value);
            }
        }
    }
    return Utils;
}

const pickers = {
    date: DatePicker,
    time: TimePicker,
    datetime: DateTimePicker
};

const utils = {
    date: makeUtils('date'),
    time: makeUtils('time'),
    datetime: makeUtils('datetime')
};

export default function DateTime({ type, hint, ...rest }) {
    type = type.toLowerCase();

    const Picker = pickers[type],
        [, { value }, { setValue }] = useField(rest.name);

    useEffect(() => {
        if (value instanceof Date) {
            setValue(format[type](value));
        }
    }, [value]);

    return (
        <MuiPickersUtilsProvider utils={utils[type]}>
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
