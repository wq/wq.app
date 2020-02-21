import React from 'react';
import { useApp } from '../hooks';
import { Formik, Form as FormikForm } from 'formik';
import PropTypes from 'prop-types';

export default function Form({
    action,
    method,
    storage,
    backgroundSync,
    outboxId,
    preserve,
    data = {},
    children
}) {
    const app = useApp();

    async function handleSubmit(values, { setSubmitting, setErrors }) {
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
            const errors = {};
            Object.entries(item.error).map(([key, error]) => {
                if (!(key in values)) {
                    key = Object.keys(values).reverse()[0];
                }
                if (!Array.isArray(error)) {
                    error = [error];
                }
                if (errors[key]) {
                    error = [error[key], ...error];
                }
                errors[key] = error.join('; ');
            });
            setErrors(errors);
        }

        setSubmitting(false);
    }

    return (
        <Formik initialValues={data} onSubmit={handleSubmit}>
            <FormikForm>{children}</FormikForm>
        </Formik>
    );
}

Form.propTypes = {
    action: PropTypes.string,
    method: PropTypes.string,
    storage: PropTypes.string,
    backgroundSync: PropTypes.bool,
    outboxId: PropTypes.string,
    preserve: PropTypes.arrayOf(PropTypes.string),
    data: PropTypes.object,
    children: PropTypes.node
};
