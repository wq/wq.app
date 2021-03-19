import React, { useMemo } from 'react';
import { Field, getIn } from 'formik';
import { Select as FMuiSelect } from 'formik-material-ui';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';
import HelperText from './HelperText';

function ContextCheckbox({ value, field }) {
    const { values } = useFormikContext();
    const checked = (getIn(values, field) || []).some(val => val === value);
    return <Checkbox checked={checked} />;
}

ContextCheckbox.propTypes = {
    value: PropTypes.string,
    field: PropTypes.string
};

export default function Select({
    choices,
    label,
    required,
    renderValue,
    ...rest
}) {
    const { name: fieldName, type, hint } = rest,
        { errors, touched } = useFormikContext(),
        showError = !!getIn(errors, fieldName) && getIn(touched, fieldName),
        multiple = type === 'select';

    if (multiple && !renderValue) {
        renderValue = sel => sel.map(getLabel).join(', ');
    }

    const getLabel = useMemo(() => {
        const labels = {};
        choices.forEach(({ name, label }) => {
            labels[name] = label;
        });
        return name => labels[name];
    }, [choices]);

    return (
        <FormControl fullWidth margin="dense">
            <InputLabel
                htmlFor={fieldName}
                required={required}
                error={showError}
            >
                {label}
            </InputLabel>
            <Field
                component={FMuiSelect}
                multiple={multiple}
                required={required}
                renderValue={renderValue}
                {...rest}
            >
                {!multiple && (
                    <MenuItem value="" disabled>
                        Select one...
                    </MenuItem>
                )}
                {choices.map(({ name, label }) => (
                    <MenuItem key={name} value={name}>
                        {multiple && (
                            <ContextCheckbox value={name} field={fieldName} />
                        )}
                        <ListItemText primary={label} />
                    </MenuItem>
                ))}
            </Field>
            <HelperText name={fieldName} hint={hint} />
        </FormControl>
    );
}

Select.propTypes = {
    choices: PropTypes.arrayOf(PropTypes.object),
    label: PropTypes.string,
    required: PropTypes.bool,
    renderValue: PropTypes.func
};
