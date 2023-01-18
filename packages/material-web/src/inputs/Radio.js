import React from "react";
import { Field } from "formik";
import { RadioGroup } from "formik-mui";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import MuiRadio from "@mui/material/Radio";
import HelperText from "./HelperText";
import PropTypes from "prop-types";

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
    label: PropTypes.string,
};
