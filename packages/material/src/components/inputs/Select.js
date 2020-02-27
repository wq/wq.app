import React, { useMemo } from 'react';
import { Field } from 'formik';
import { Select as FMuiSelect } from 'formik-material-ui';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';

function ContextCheckbox({ value, field }) {
    const { values } = useFormikContext();
    const checked = values[field] && values[field].some(val => val === value);
    return <Checkbox checked={checked} />;
}

ContextCheckbox.propTypes = {
    value: PropTypes.string,
    field: PropTypes.string
};

export default function Select({ choices, label, ...rest }) {
    const { name: fieldName, type } = rest,
        multiple = type === 'select',
        renderValue = sel => sel.map(getLabel).join(', ');

    const getLabel = useMemo(() => {
        const labels = {};
        choices.forEach(({ name, label }) => {
            labels[name] = label;
        });
        return name => labels[name];
    }, [choices]);

    return (
        <FormControl fullWidth margin="dense">
            <InputLabel htmlFor={fieldName}>{label}</InputLabel>
            <Field
                component={FMuiSelect}
                multiple={multiple}
                renderValue={multiple ? renderValue : undefined}
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
        </FormControl>
    );
}

Select.propTypes = {
    choices: PropTypes.arrayOf(PropTypes.object),
    label: PropTypes.string
};
