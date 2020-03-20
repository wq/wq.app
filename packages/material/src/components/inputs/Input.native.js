import React from 'react';
import { TextInput } from 'react-native-paper';
import { useFormikContext } from 'formik';
import PropTypes from 'prop-types';

export default function Input({ name, label }) {
    const { handleChange, handleBlur, values } = useFormikContext();
    return (
        <TextInput
            label={label}
            onChangeText={handleChange(name)}
            onBlur={handleBlur(name)}
            value={values[name]}
        />
    );
}

Input.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string
};
