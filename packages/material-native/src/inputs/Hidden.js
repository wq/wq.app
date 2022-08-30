import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { HelperText } from 'react-native-paper';
import PropTypes from 'prop-types';

function Empty() {
    return null;
}

export default function Hidden(props) {
    const { name } = props;
    return (
        <>
            <Field {...props} component={Empty} />
            <ErrorMessage type="error" component={HelperText} name={name} />
        </>
    );
}

Hidden.propTypes = {
    name: PropTypes.string
};
