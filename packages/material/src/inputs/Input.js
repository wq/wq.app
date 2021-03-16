import React from 'react';
import { Field } from 'formik';
import { TextField } from 'formik-material-ui';
import { useHtmlInput } from '@wq/react';
import PropTypes from 'prop-types';

export default function Input({ hint, inputProps, ...rest }) {
    const { name, type, maxLength } = useHtmlInput(rest);
    return (
        <Field
            name={name}
            type={type}
            fullWidth
            margin="dense"
            component={TextField}
            helperText={hint}
            inputProps={{ maxLength, ...inputProps }}
            {...rest}
        />
    );
}

Input.propTypes = {
    name: PropTypes.string,
    hint: PropTypes.string,
    inputProps: PropTypes.object
};
