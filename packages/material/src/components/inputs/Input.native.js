import React from 'react';
import { TextInput } from 'react-native-paper';
import { useField } from 'formik';
import { useHtmlInput } from '@wq/react';
import PropTypes from 'prop-types';

const keyboards = {
    int: 'number-pad',
    decimal: 'decimal-pad',
    tel: 'phone-pad',
    email: 'email-address'
};

export default function Input(props) {
    const { name, type, label, style } = props,
        { maxLength } = useHtmlInput(props),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue, setTouched } = helpers;

    function handleChange(value) {
        if (type === 'int' || type === 'decimal') {
            setValue(+value);
        } else {
            setValue(value);
        }
    }

    return (
        <TextInput
            label={label}
            multiline={type === 'text'}
            keyboardType={keyboards[type] || 'default'}
            maxLength={maxLength}
            onChangeText={handleChange}
            onBlur={() => setTouched(true)}
            value={typeof value === 'number' ? '' + value : value}
            style={style}
        />
    );
}

Input.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    style: PropTypes.object
};
