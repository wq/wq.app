import React from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function AutoForm({
    action,
    cancel,
    method,
    storage,
    backgroundSync,
    outboxId,
    form = [],
    data,
    error,
    children
}) {
    const {
        AutoInput,
        Form,
        FormError,
        HorizontalView,
        SubmitButton,
        ButtonLink
    } = useComponents();

    const formData = initData(form, data);

    return (
        <Form
            action={action}
            method={method}
            data={formData}
            error={error}
            storage={storage}
            backgroundSync={backgroundSync}
            outboxId={outboxId}
        >
            {(form || []).map(({ name, children: subform, ...rest }) => (
                <AutoInput key={name} name={name} subform={subform} {...rest} />
            ))}
            <FormError />
            <HorizontalView>
                {cancel && <ButtonLink to={cancel}>Cancel</ButtonLink>}
                <SubmitButton>Submit</SubmitButton>
            </HorizontalView>
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
    outboxId: PropTypes.number,
    form: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.object,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    children: PropTypes.node
};

export function initData(form, data) {
    if (!data) {
        data = {};
    }

    const formData = {};

    form.forEach(field => {
        const fieldName = field['wq:ForeignKey']
            ? `${field.name}_id`
            : field.name;

        let value;
        if (field.type === 'repeat') {
            value = (data[fieldName] || []).map(row =>
                initData(field.children, row)
            );
        } else if (field.type == 'group') {
            value = initData(field.children, data[fieldName] || {});
        } else if (fieldName in data) {
            value = data[fieldName];
        } else {
            value = defaultValue(field);
        }

        formData[fieldName] = value;
    });

    return formData;

    function defaultValue(field) {
        if (field.type === 'select') {
            return [];
        } else {
            return '';
        }
    }
}
