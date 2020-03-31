import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Text } from 'react-native';
import { TouchableRipple, TextInput } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function DateTime({ name, type, label }) {
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
        setValue(val);
    }

    return (
        <>
            <TextInput
                label={label}
                value={format(value, type)}
                render={({ style, value }) => (
                    <TouchableRipple onPress={showPicker}>
                        <Text style={style}>{value}</Text>
                    </TouchableRipple>
                )}
            />
            <DateTimePickerModal
                isVisible={show}
                mode={type}
                value={value || new Date()}
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

function format(value, type) {
    if (!value) {
        return '';
    } else if (type === 'time') {
        return value.toLocaleTimeString();
    } else {
        return value.toLocaleDateString();
    }
}
