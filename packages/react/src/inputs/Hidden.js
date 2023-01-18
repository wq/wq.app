import React from "react";
import { Field, ErrorMessage } from "formik";
import PropTypes from "prop-types";

export default function Hidden(props) {
    const { name } = props;
    return (
        <>
            <Field {...props} type="hidden" />
            <ErrorMessage name={name} />
        </>
    );
}

Hidden.propTypes = {
    name: PropTypes.string,
};
