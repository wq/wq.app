import React from 'react';
import { Field } from 'formik';
import ToggleButton from '@material-ui/lab/ToggleButton';
import MuiToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import PropTypes from 'prop-types';

function ToggleButtonGroup({ field, form, ...rest }) {
    /* eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
    const props = { ...rest, ...field };
    return <MuiToggleButtonGroup {...props} />;
}

ToggleButtonGroup.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object
};

export default function Toggle({ choices, label, ...rest }) {
    const { name: fieldName } = rest;
    return (
        <FormControl component="fieldset" fullWidth margin="dense">
            <FormLabel component="legend">{label}</FormLabel>
            <div>
                <Field component={ToggleButtonGroup} exclusive {...rest}>
                    {choices.map(({ name, label }) => (
                        <ToggleButton name={fieldName} key={name} value={name}>
                            {label}
                        </ToggleButton>
                    ))}
                </Field>
            </div>
        </FormControl>
    );
}

Toggle.propTypes = {
    choices: PropTypes.arrayOf(PropTypes.object),
    label: PropTypes.string
};
