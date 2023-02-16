import React, { useEffect } from "react";
import { Field, useField } from "formik";
import {
    DatePicker,
    TimePicker,
    DateTimePicker,
} from "formik-mui-x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import DateFnsUtils from "@date-io/date-fns";
import PropTypes from "prop-types";
import { usePlugin } from "@wq/react";
import { format, parse } from "./date-utils.js";
import Input from "./Input.js";

function makeUtils(type) {
    class Utils extends DateFnsUtils {
        date(value) {
            if (typeof value === "undefined") {
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
    datetime: DateTimePicker,
};

const utils = {
    date: makeUtils("date"),
    time: makeUtils("time"),
    datetime: makeUtils("datetime"),
};

export default function DateTime({ native, ...rest }) {
    if (native) {
        return <NativeDateTime {...rest} />;
    } else {
        return <PickerDateTime {...rest} />;
    }
}

function NativeDateTime(props) {
    return <Input {...props} />;
}

function PickerDateTime({ type, hint, ...rest }) {
    type = type.toLowerCase();

    const Picker = pickers[type],
        inputFormat = usePlugin("material").config.inputFormat,
        [, { value, error, touched }, { setValue }] = useField(rest.name);

    useEffect(() => {
        if (value instanceof Date) {
            setValue(format[type](value));
        }
    }, [value]);

    return (
        <LocalizationProvider dateAdapter={utils[type]}>
            <Field
                fullWidth
                margin="dense"
                component={Picker}
                helperText={!!error && touched ? error : hint}
                format={inputFormat[type]}
                {...rest}
                type="tel"
            />
        </LocalizationProvider>
    );
}

PickerDateTime.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    hint: PropTypes.string,
};
