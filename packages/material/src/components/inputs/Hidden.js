import React from 'react';
import { Field, ErrorMessage } from 'formik';
import FormHelperText from '@material-ui/core/FormHelperText';
import PropTypes from 'prop-types';

export default function Hidden(props) {
    const { name } = props;
    return (
        <>
            <Field {...props} type="hidden" />
            <ErrorMessage error component={FormHelperText} name={name} />
        </>
    );
}

Hidden.propTypes = {
    name: PropTypes.string
};
