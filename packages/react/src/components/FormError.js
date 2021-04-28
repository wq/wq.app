import React from 'react';
import { useField } from 'formik';

export default function FormError(props) {
    const [, { error }] = useField('__other__');
    if (!error) {
        return null;
    }
    return error;
}
