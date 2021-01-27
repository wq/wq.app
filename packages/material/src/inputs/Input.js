import React from 'react';
import { Field } from 'formik';
import { TextField } from 'formik-material-ui';
import { useHtmlInput } from '@wq/react';
import PropTypes from 'prop-types';

export default function Input({ hint, ...rest }) {
    const inputProps = useHtmlInput(rest);
    return (
        <Field
            fullWidth
            margin="dense"
            component={TextField}
            helperText={hint}
            {...rest}
            {...inputProps}
        />
    );
}

Input.propTypes = {
    name: PropTypes.string,
    hint: PropTypes.string
};
