import React from 'react';
import { useComponents, useInputs } from '../hooks';
import PropTypes from 'prop-types';

function AutoField(props) {
    const { type } = props,
        inputs = useInputs(),
        Input = inputs[type] || inputs.default;
    return <Input {...props} />;
}

AutoField.propTypes = {
    type: PropTypes.string
};

export default function AutoForm({
    action,
    method,
    storage,
    backgroundSync,
    form = [],
    data,
    children
}) {
    const { Form } = useComponents();

    const formData = {};

    form.forEach(field => (formData[field.name] = data[field.name] || ''));

    return (
        <Form
            action={action}
            method={method}
            data={formData}
            storage={storage}
            backgroundSync={backgroundSync}
        >
            {(form || []).map(field => (
                <AutoField key={field.name} {...field} />
            ))}
            {children}
        </Form>
    );
}

AutoForm.propTypes = {
    action: PropTypes.string,
    method: PropTypes.string,
    storage: PropTypes.string,
    backgroundSync: PropTypes.bool,
    form: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.object,
    children: PropTypes.node
};
