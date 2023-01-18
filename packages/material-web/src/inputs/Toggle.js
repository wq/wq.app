import React from "react";
import { Field } from "formik";
import ToggleButton from "@mui/material/ToggleButton";
import { ToggleButtonGroup } from "formik-mui";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import HelperText from "./HelperText";
import PropTypes from "prop-types";

export default function Toggle({ choices, label, ...rest }) {
    return (
        <FormControl component="fieldset" fullWidth margin="dense">
            <FormLabel component="legend">{label}</FormLabel>
            <Field
                component={ToggleButtonGroup}
                exclusive
                {...rest}
                type="checkbox"
            >
                {choices.map(({ name, label }) => (
                    <ToggleButton key={name} value={name}>
                        {label}
                    </ToggleButton>
                ))}
            </Field>
            <HelperText name={rest.name} hint={rest.hint} />
        </FormControl>
    );
}

Toggle.propTypes = {
    choices: PropTypes.arrayOf(PropTypes.object),
    label: PropTypes.string,
};
