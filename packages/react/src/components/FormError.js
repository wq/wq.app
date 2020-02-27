import React from 'react';
import { ErrorMessage } from 'formik';

export default function FormError(props) {
    return <ErrorMessage name="__other__" {...props} />;
}
