import React from 'react';
import { Field } from 'formik';
import { CheckboxWithLabel } from 'formik-material-ui';
import HelperText from './HelperText';
import PropTypes from 'prop-types';

export default function Input({ label, ...props }) {
    return (
        <>
            <Field component={CheckboxWithLabel} Label={{ label }} {...props} />
            <HelperText name={props.name} hint={props.hint} />
        </>
    );
}

Input.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    hint: PropTypes.string
};
