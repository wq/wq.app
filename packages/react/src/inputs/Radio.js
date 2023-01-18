import React from "react";
import { Field, ErrorMessage } from "formik";
import PropTypes from "prop-types";

export default function Radio({ name, label, choices, horizontal }) {
    const style = {
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
    };
    return (
        <div style={{ marginBottom: "0.5em" }}>
            <fieldset>
                <legend>{label}</legend>
                <div style={style}>
                    {choices.map(({ name: value, label }) => (
                        <label key={value}>
                            <Field name={name} type="radio" value={value} />
                            {label}
                        </label>
                    ))}
                </div>
            </fieldset>
            <ErrorMessage name={name} />
        </div>
    );
}

Radio.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    horizontal: PropTypes.bool,
    choices: PropTypes.arrayOf(PropTypes.object),
};
