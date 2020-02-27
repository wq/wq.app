import React from 'react';
import { Field } from 'formik';
import { TextField } from 'formik-material-ui';

export default function Input(props) {
    return <Field fullWidth margin="dense" component={TextField} {...props} />;
}
