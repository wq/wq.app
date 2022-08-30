import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Text } from 'react-native';
import { TouchableRipple, TextInput } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';
import { format, parse } from './date-utils';

const displayFormat = {
    date: value => parse.date(value).toLocaleDateString(),
    time: value => parse.time(value).toLocaleTimeString(),
    datetime: value => parse.datetime(value).toLocaleString()
};

export default function DateTime({ name, type, label }) {
    type = type.toLowerCase();

    const [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue } = helpers;

    const [show, setShow] = useState(false);

    function showPicker() {
        setShow(true);
    }
    function hidePicker() {
        setShow(false);
    }
    function onConfirm(val) {
        hidePicker();
        setValue(format[type](val));
    }

    return (
        <>
            <TextInput
                label={label}
                value={value ? displayFormat[type](value) : ''}
                render={({ style, value }) => (
                    <TouchableRipple onPress={showPicker}>
                        <Text style={style}>{value}</Text>
                    </TouchableRipple>
                )}
            />
            <DateTimePickerModal
                isVisible={show}
                mode={type}
                date={parse[type](value) || new Date()}
                onConfirm={onConfirm}
                onCancel={hidePicker}
            />
        </>
    );
}

DateTime.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string
};
