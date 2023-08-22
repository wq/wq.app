import React from "react";
import { Field } from "formik";
import HelperText from "./HelperText.js";
import PropTypes from "prop-types";

function Empty() {
    return null;
}

export default function Hidden(props) {
    const { name, hint } = props;
    return (
        <>
            <Field {...props} component={Empty} />
            <HelperText name={name} hint={hint} />
        </>
    );
}

Hidden.propTypes = {
    name: PropTypes.string,
    hint: PropTypes.string,
};
