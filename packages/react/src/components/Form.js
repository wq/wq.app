import React from 'react';
import { useApp, useComponents } from '../hooks';
import { Formik } from 'formik';
import PropTypes from 'prop-types';

export default function Form({
    action,
    method,
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
        const has_files = false; // FIXME

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

    const errors = parseApiError(error);

    return (
        <Formik
            initialValues={data}
            initialErrors={errors}
            initialTouched={errors}
            onSubmit={handleSubmit}
        >
            <FormRoot>{children}</FormRoot>
        </Formik>
    );
}

Form.propTypes = {
    action: PropTypes.string,
    method: PropTypes.string,
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
            if (!Array.isArray(error)) {
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
