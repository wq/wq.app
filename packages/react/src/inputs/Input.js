import React from "react";
import { Field, ErrorMessage } from "formik";
import PropTypes from "prop-types";

const HTML5_INPUT_TYPES = {
    // Map XForm field types to <input type>
    barcode: false,
    file: "file",
    binary: "file", // wq.db <1.3
    date: "date",
    dateTime: "datetime-local",
    decimal: "number",
    geopoint: false,
    geoshape: false,
    geotrace: false,
    int: "number",
    select: false,
    select1: false,
    string: "text",
    time: "time",

    // String subtypes
    password: "password",
    email: "email",
    phone: "tel",
    text: false,
    note: false,
};

export function useHtmlInput({ name, type, ["wq:length"]: length }) {
    return {
        name,
        type: HTML5_INPUT_TYPES[type] || "text",
        maxLength: length && +length,
    };
}

export default function Input(props) {
    const inputProps = useHtmlInput(props),
        { name, label } = props;
    return (
        <div style={{ marginBottom: "0.5em" }}>
            <div style={{ display: "flex" }}>
                <label htmlFor={name} style={{ width: "25%" }}>
                    {label}
                </label>
                <Field style={{ flex: 1 }} {...inputProps} />
            </div>
            <ErrorMessage name={name} />
        </div>
    );
}

Input.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
};
