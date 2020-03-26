import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function DateTime({ name, type, label }) {
    const [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue, setTouched } = helpers;

    const [show, setShow] = useState(false);

    function showPicker() {
        if (show) {
            return;
        }
        setShow(true);
    }
    function onChange(evt, val) {
        setValue(val);
        setShow(false);
    }
    function onBlur() {
        setTouched(true);
    }

    return (
        <>
            <TextInput
                label={label}
                value={format(value, type)}
                onFocus={showPicker}
                onBlur={onBlur}
            />
            {show && (
                <DateTimePicker
                    mode={type}
                    value={value || new Date()}
                    onChange={onChange}
                />
            )}
        </>
    );
}

DateTime.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string
};

function format(value, type) {
    if (!value) {
        return '';
    } else if (type === 'time') {
        return value.toLocaleTimeString();
    } else {
        return value.toLocaleDateString();
    }
}
