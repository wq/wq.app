import React from "react";
import { Field, ErrorMessage } from "formik";
import PropTypes from "prop-types";

export default function Select({ name, type, label, choices }) {
    const multiple = type === "select";
    return (
        <div style={{ marginBottom: "0.5em" }}>
            <div style={{ display: "flex" }}>
                <label htmlFor={name} style={{ width: "25%" }}>
                    {label}
                </label>
                <Field
                    as="select"
                    style={{ flex: 1 }}
                    name={name}
                    multiple={multiple}
                >
                    {!multiple && <option value="">Select one...</option>}
                    {choices.map(({ name, label }) => (
                        <option key={name} value={name}>
                            {label}
                        </option>
                    ))}
                </Field>
            </div>
            <ErrorMessage name={name} />
        </div>
    );
}

Select.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object),
};
