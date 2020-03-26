import React from 'react';
import { TextInput } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function Input({ name, type, label }) {
    const [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue, setTouched } = helpers;
    return (
        <TextInput
            label={label}
            multiline={type === 'text'}
            keyboardType={
                type === 'decimal' || type == 'int' ? 'numeric' : 'default'
            }
            onChangeText={setValue}
            onBlur={() => setTouched(true)}
            value={value}
        />
    );
}

Input.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string
};
