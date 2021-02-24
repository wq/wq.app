import React from 'react';
import { useApp, useComponents } from '../hooks';
import { Formik } from 'formik';
import PropTypes from 'prop-types';

export default function Form({
    action,
    method,
    onSubmit,
    storage,
    backgroundSync,
    outboxId,
    preserve,
    data = {},
    error,
    children
}) {
    const app = useApp(),
        { FormRoot } = useComponents();

    if (backgroundSync === undefined) {
        backgroundSync = app.config.backgroundSync;
    }

    async function handleSubmit(
        values,
        { setSubmitting, setTouched, setErrors }
    ) {
        if (onSubmit) {
            const result = await onSubmit();
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
                ...values
            }
        });

        if (error) {
            const errors = parseApiError(item.error, values);
            setErrors(errors);
            setTouched(errors, false);
        }

        setSubmitting(false);
    }

    const errors = parseApiError(error, data);

    return (
        <Formik
            initialValues={data}
            initialErrors={errors}
            initialTouched={errors}
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
    data: PropTypes.object,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    children: PropTypes.node
};

function parseApiError(error, values) {
    if (!error) {
        return;
    }
    const errors = {};
    if (typeof error === 'string') {
        errors['__other__'] = error;
    } else {
        Object.entries(error).map(([key, error]) => {
            if (!(key in values)) {
                key = '__other__';
            }
            if (Array.isArray(error)) {
                // pass
            } else if (typeof error === 'object') {
                errors[key] = parseApiError(error, values[key] || {});
                return;
            } else {
                error = [error];
            }
            if (errors[key]) {
                error = [errors[key], ...error];
            }
            errors[key] = error.join('; ');
        });
    }
    return errors;
}

function checkForFiles(values) {
    if (!values || typeof values !== 'object') {
        return false;
    }
    if (values.name && values.type && values.body) {
        return true;
    }
    if (Array.isArray(values)) {
        return values.some(checkForFiles);
    }
    return Object.values(values).some(checkForFiles);
}
