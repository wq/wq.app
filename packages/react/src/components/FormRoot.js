import React from "react";
import { Form } from "formik";
import PropTypes from "prop-types";

export default function FormRoot({ children }) {
    return <Form style={{ padding: "1em" }}>{children}</Form>;
}

FormRoot.propTypes = {
    children: PropTypes.node,
};
