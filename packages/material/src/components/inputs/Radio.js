import React from 'react';
import { Field } from 'formik';
import { RadioGroup } from 'formik-material-ui';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MuiRadio from '@material-ui/core/Radio';
import HelperText from './HelperText';
import PropTypes from 'prop-types';

export default function Radio({ choices, label, ...rest }) {
    return (
        <FormControl component="fieldset" fullWidth margin="dense">
            <FormLabel component="legend">{label}</FormLabel>
            <Field component={RadioGroup} {...rest}>
                {choices.map(({ name, label }) => (
                    <FormControlLabel
                        key={name}
                        value={name}
                        label={label}
                        control={<MuiRadio />}
                    />
                ))}
            </Field>
            <HelperText name={rest.name} hint={rest.hint} />
        </FormControl>
    );
}

Radio.propTypes = {
    choices: PropTypes.arrayOf(PropTypes.object),
    label: PropTypes.string
};
