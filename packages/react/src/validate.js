export default function validate(values, modelConf) {
    return validateRequired(values, modelConf && modelConf.form) || {};
}

function validateRequired(values, form) {
    if (!values || !form) {
        return null;
    }

    const errors = {};

    form.forEach(field => {
        const name = field['wq:ForeignKey'] ? `${field.name}_id` : field.name,
            value = values[name];
        if (isMissing(value, field)) {
            errors[name] = 'This field is required.';
        } else if (value && field.type === 'repeat') {
            const nestedErrors = value.map(row =>
                validateRequired(row, field.children)
            );
            if (nestedErrors.some(row => row)) {
                errors[name] = nestedErrors;
            }
        } else if (field.type === 'group') {
            if (name === '') {
                Object.assign(errors, validateRequired(values, field.children));
            } else if (value) {
                const nestedErrors = validateRequired(value, field.children);
                if (nestedErrors) {
                    errors[name] = nestedErrors;
                }
            }
        }
    });

    return Object.keys(errors).length > 0 ? errors : null;
}

function isMissing(value, field) {
    if (field.required || (field.bind && field.bind.required)) {
        return value === undefined || value === null || value === '';
    } else {
        return false;
    }
}
