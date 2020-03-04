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

    const formData = initData(form, data);

    return (
        <Form
            action={action}
            method={method}
            data={formData}
            storage={storage}
            backgroundSync={backgroundSync}
            outboxId={outboxId}
        >
            {(form || []).map(({ name, children: subform, ...rest }) => (
                <AutoInput key={name} name={name} subform={subform} {...rest} />
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
    outboxId: PropTypes.string,
    form: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.object,
    children: PropTypes.node
};

export function initData(form, data) {
    const formData = {};

    form.forEach(field => {
        const fieldName = field['wq:ForeignKey']
            ? `${field.name}_id`
            : field.name;
        formData[fieldName] = (data && data[fieldName]) || defaultValue(field);
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
