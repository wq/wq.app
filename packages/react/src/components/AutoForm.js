import React from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function AutoForm({
    action,
    cancel,
    method,
    storage,
    backgroundSync,
    form = [],
    data,
    children
}) {
    const {
        AutoInput,
        Form,
        FormError,
        FormActions,
        SubmitButton,
        ButtonLink
    } = useComponents();

    const formData = {};

    form.forEach(
        field =>
            (formData[field.name] = data[field.name] || defaultValue(field))
    );

    return (
        <Form
            action={action}
            method={method}
            data={formData}
            storage={storage}
            backgroundSync={backgroundSync}
        >
            {(form || []).map(field => (
                <AutoInput key={field.name} {...field} />
            ))}
            <FormError />
            <FormActions>
                {cancel && <ButtonLink to={cancel}>Cancel</ButtonLink>}
                <SubmitButton>Submit</SubmitButton>
            </FormActions>
            {children}
        </Form>
    );
}

AutoForm.propTypes = {
    action: PropTypes.string,
    cancel: PropTypes.object,
    method: PropTypes.string,
    storage: PropTypes.string,
    backgroundSync: PropTypes.bool,
    form: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.object,
    children: PropTypes.node
};

function defaultValue(field) {
    if (field.type === 'select') {
        return [];
    } else {
        return '';
    }
}
