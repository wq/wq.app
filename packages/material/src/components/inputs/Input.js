import React from 'react';
import { Field } from 'formik';
import { TextField } from 'formik-material-ui';
import { useHtmlInput } from '@wq/react';

export default function Input(props) {
    const inputProps = useHtmlInput(props);
    return (
        <Field
            fullWidth
            margin="dense"
            component={TextField}
            {...props}
            {...inputProps}
        />
    );
}
