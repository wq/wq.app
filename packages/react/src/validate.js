export default function validate(values, modelConf) {
    const labels = [],
        errors = validateRequired(values, modelConf && modelConf.form, labels);

    if (errors && labels.length) {
        errors["__other__"] =
            "The following fields are required: " +
            labels.filter((label, i) => labels.indexOf(label) === i).join(", ");
    }

    return errors || {};
}

function validateRequired(values, form, labels = null) {
    if (!values || !form) {
        return null;
    }

    const errors = {};

    form.forEach((field) => {
        let name, value, error;
        if (field["wq:ForeignKey"]) {
            const naturalKey = field.name.match(/^([^\]]+)\[([^\]]+)\]$/);
            if (naturalKey) {
                name = naturalKey[1];
                value =
                    values[naturalKey[1]] &&
                    values[naturalKey[1]][naturalKey[2]];
                error = { [naturalKey[2]]: "This field is required." };
            } else {
                name = field.name + "_id";
                value = values[name];
                error = "This field is required.";
            }
        } else {
            name = field.name;
            value = values[name];
            error = "This field is required.";
        }
        if (isMissing(value, field)) {
            errors[name] = error;
            if (labels) {
                labels.push(field.label);
            }
        } else if (value && field.type === "repeat") {
            const nestedErrors = value.map((row) =>
                validateRequired(row, field.children, labels)
            );
            if (nestedErrors.some((row) => row)) {
                errors[name] = nestedErrors;
            }
        } else if (field.type === "group") {
            if (name === "") {
                Object.assign(
                    errors,
                    validateRequired(values, field.children, labels)
                );
            } else if (value) {
                const nestedErrors = validateRequired(
                    value,
                    field.children,
                    labels
                );
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
        return value === undefined || value === null || value === "";
    } else {
        return false;
    }
}
