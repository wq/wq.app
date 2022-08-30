import React, { useEffect } from 'react';
import { Field, useField } from 'formik';
import {
    KeyboardDatePicker,
    KeyboardTimePicker,
    KeyboardDateTimePicker
} from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import PropTypes from 'prop-types';
import { usePlugin } from '@wq/react';
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
    date: KeyboardDatePicker,
    time: KeyboardTimePicker,
    datetime: KeyboardDateTimePicker
};

const utils = {
    date: makeUtils('date'),
    time: makeUtils('time'),
    datetime: makeUtils('datetime')
};

export default function DateTime({ type, hint, ...rest }) {
    type = type.toLowerCase();

    const Picker = pickers[type],
        inputFormat = usePlugin('material').config.inputFormat,
        [, { value, error, touched }, { setValue }] = useField(rest.name);

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
                helperText={!!error && touched ? error : hint}
                format={inputFormat[type]}
                {...rest}
                type="tel"
            />
        </MuiPickersUtilsProvider>
    );
}

DateTime.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    hint: PropTypes.string
};
