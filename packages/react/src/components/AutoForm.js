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
    modelConf,
    data,
    error,
    children
}) {
    const {
        Message,
        AutoInput,
        Form,
        FormError,
        HorizontalView,
        CancelButton,
        SubmitButton
    } = useComponents();

    const formData = initData(form, data);

    if (!modelConf) {
        modelConf = { form };
    }

    return (
        <Form
            action={action}
            method={method}
            data={formData}
            modelConf={modelConf}
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
                {cancel && (
                    <CancelButton to={cancel}>
                        <Message id="CANCEL" />
                    </CancelButton>
                )}
                <SubmitButton>
                    <Message id="SUBMIT" />
                </SubmitButton>
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
    modelConf: PropTypes.object,
    data: PropTypes.object,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    children: PropTypes.node
};

export function initData(form, data) {
    if (!data) {
        data = {};
    }

    const formData = {};

    if (data.id) {
        formData.id = data.id;
    }

    form.forEach(field => {
        const fieldName = field['wq:ForeignKey']
            ? `${field.name}_id`
            : field.name;

        let value;
        if (field.type === 'repeat') {
            value = (data[fieldName] || []).map(row =>
                initData(field.children, row)
            );
        } else if (field.type === 'group') {
            if (fieldName) {
                value = initData(field.children, data[fieldName] || {});
            } else {
                value = initData(field.children, data);
            }
        } else if (fieldName in data) {
            value = data[fieldName];
        } else {
            value = defaultValue(field);
        }

        if (fieldName) {
            formData[fieldName] = value;
        } else {
            Object.assign(formData, value);
        }
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
