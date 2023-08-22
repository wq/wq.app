import React from "react";
import { useApp, useComponents, useValidate } from "../hooks.js";
import { Formik } from "formik";
import PropTypes from "prop-types";

export default function Form({
    action,
    method,
    onSubmit,
    storage,
    backgroundSync,
    outboxId,
    preserve,
    modelConf,
    data = {},
    error,
    FormRoot,
    children,
}) {
    const app = useApp(),
        validate = useValidate(),
        { FormRoot: DefaultRoot } = useComponents();

    if (backgroundSync === undefined) {
        backgroundSync = app.config.backgroundSync;
    }

    if (!FormRoot) {
        FormRoot = DefaultRoot;
    }

    async function handleSubmit(
        values,
        { setSubmitting, setTouched, setErrors }
    ) {
        if (onSubmit) {
            const result = await onSubmit(values);
            if (!result) {
                setSubmitting(false);
                return;
            }
        }

        const has_files = checkForFiles(values);

        const [item, error] = await app.submitForm({
            url: action,
            storage,
            backgroundSync,
            has_files,
            outboxId,
            preserve,
            data: {
                _method: method,
                ...values,
            },
        });

        if (error) {
            const errors = parseApiError(item.error, values);
            setErrors(errors);
            setTouched(errors, false);
        }

        setSubmitting(false);

        return item;
    }

    const errors = parseApiError(error, data);

    return (
        <Formik
            initialValues={data}
            initialErrors={errors}
            initialTouched={errors}
            validate={(values) => validate(values, modelConf)}
            validateOnBlur={true}
            validateOnChange={false}
            onSubmit={handleSubmit}
            enableReinitialize={true}
        >
            <FormRoot>{children}</FormRoot>
        </Formik>
    );
}

Form.propTypes = {
    action: PropTypes.string,
    method: PropTypes.string,
    onSubmit: PropTypes.func,
    storage: PropTypes.string,
    backgroundSync: PropTypes.bool,
    outboxId: PropTypes.number,
    preserve: PropTypes.arrayOf(PropTypes.string),
    modelConf: PropTypes.object,
    data: PropTypes.object,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    FormRoot: PropTypes.func,
    children: PropTypes.node,
};

function parseApiError(error, values) {
    if (!error) {
        return;
    }
    const errors = {};
    if (typeof error === "string") {
        errors["__other__"] = error;
    } else {
        Object.entries(error).map(([key, error]) => {
            if (!(key in values)) {
                key = "__other__";
            }
            if (Array.isArray(error)) {
                if (typeof error[0] === "object") {
                    errors[key] = error.map((err, i) =>
                        parseApiError(err, (values[key] || [])[i] || {})
                    );
                    return;
                }
            } else if (typeof error === "object") {
                errors[key] = parseApiError(error, values[key] || {});
                return;
            } else {
                error = [error];
            }
            if (errors[key]) {
                error = [errors[key], ...error];
            }
            errors[key] = error.join("; ");
        });
    }
    return errors;
}

function checkForFiles(values) {
    if (!values || typeof values !== "object") {
        return false;
    }
    if (values.name && values.type && (values.body || values.uri)) {
        return true;
    }
    if (Array.isArray(values)) {
        return values.some(checkForFiles);
    }
    return Object.values(values).some(checkForFiles);
}
