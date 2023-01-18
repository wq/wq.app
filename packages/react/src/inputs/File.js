import React from "react";
import { useField, ErrorMessage } from "formik";
import PropTypes from "prop-types";

export default function File({ name, label, ...rest }) {
    const [, { value, initialValue }, { setValue }] = useField(name);

    function setFile(evt) {
        if (evt.target.files) {
            const { name, type } = evt.target.files[0];
            setValue({
                name,
                type,
                body: evt.target.files[0],
            });
        } else {
            setValue(initialValue || null);
        }
    }

    const hasValue = value && value !== "__clear__";

    return (
        <div style={{ marginBottom: "0.5em" }}>
            <div style={{ display: "flex" }}>
                <label htmlFor={name} style={{ width: "25%" }}>
                    {label}
                </label>
                <input
                    style={{ flex: 1 }}
                    name={name}
                    onChange={setFile}
                    {...rest}
                    type="file"
                />
            </div>
            {hasValue && (
                <p>
                    Current: {value.name ? value.name : value}
                    <button
                        onClick={() =>
                            setValue(initialValue ? "__clear__" : null)
                        }
                    >
                        Clear
                    </button>
                </p>
            )}
            <ErrorMessage name={name} />
        </div>
    );
}

File.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
};
