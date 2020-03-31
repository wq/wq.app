import React from 'react';
import { Field } from 'formik';
import { CheckboxWithLabel } from 'formik-material-ui';
import PropTypes from 'prop-types';

export default function Input({ label, ...props }) {
    return <Field component={CheckboxWithLabel} Label={{ label }} {...props} />;
}

Input.propTypes = {
    label: PropTypes.string
};
