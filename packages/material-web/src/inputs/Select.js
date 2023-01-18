import React, { useMemo } from "react";
import { Field, getIn } from "formik";
import { Select as FMuiSelect } from "formik-mui";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import PropTypes from "prop-types";
import { useFormikContext } from "formik";
import HelperText from "./HelperText";

function ContextCheckbox({ value, field }) {
    const { values } = useFormikContext();
    const checked = (getIn(values, field) || []).some((val) => val === value);
    return <Checkbox checked={checked} />;
}

ContextCheckbox.propTypes = {
    value: PropTypes.string,
    field: PropTypes.string,
};

export default function Select({
    choices,
    label,
    required,
    native,
    placeholder,
    renderValue,
    InputLabelProps,
    ...rest
}) {
    const { name: fieldName, type, hint } = rest,
        { errors, touched } = useFormikContext(),
        showError = !!getIn(errors, fieldName) && getIn(touched, fieldName),
        multiple = type === "select";

    if (multiple && !renderValue) {
        renderValue = (sel) => sel.map(getLabel).join(", ");
    }
    if (placeholder && !renderValue) {
        renderValue = (sel) => getLabel(sel) || sel || placeholder;
    }

    const getLabel = useMemo(() => {
        const labels = {};
        choices.forEach(({ name, label }) => {
            labels[name] = label;
        });
        return (name) => labels[name];
    }, [choices]);

    const choiceGroups = useMemo(() => {
        const choiceGroups = {};
        choices.forEach((choice) => {
            const group = choice.group || "";
            if (!choiceGroups[group]) {
                choiceGroups[group] = [];
            }
            choiceGroups[group].push(choice);
        });
        return choiceGroups;
    }, [choices]);

    const Option = native
        ? ({ value, children }) => <option value={value}>{children}</option>
        : ({ value, disabled, children, ...rest }) => (
              <MenuItem value={value} disabled={disabled} {...rest}>
                  {multiple && (
                      <ContextCheckbox value={value} field={fieldName} />
                  )}
                  <ListItemText primary={children} />
              </MenuItem>
          );

    const renderChoices = (choices) =>
        choices.map(({ name, label }) => (
            <Option key={name} value={name}>
                {label}
            </Option>
        ));

    const renderGroups = native
        ? (choiceGroups) =>
              Object.entries(choiceGroups).map(([group, choices]) =>
                  group ? (
                      <optgroup key={group} label={group}>
                          {renderChoices(choices)}
                      </optgroup>
                  ) : (
                      <>{renderChoices(choices)}</>
                  )
              )
        : (choiceGroups) => {
              const flattened = [];
              Object.entries(choiceGroups).forEach(([group, choices]) => {
                  if (group) {
                      flattened.push(
                          <ListSubheader style={{ backgroundColor: "white" }}>
                              {group}
                          </ListSubheader>
                      );
                  }
                  flattened.push(...renderChoices(choices));
              });
              return flattened;
          };

    return (
        <FormControl fullWidth margin="dense">
            <InputLabel
                htmlFor={fieldName}
                required={required}
                error={showError}
                {...InputLabelProps}
            >
                {label}
            </InputLabel>
            <Field
                component={FMuiSelect}
                multiple={multiple}
                required={required}
                native={native}
                renderValue={renderValue}
                displayEmpty={!!placeholder}
                {...rest}
            >
                {!multiple && (
                    <Option value={""} disabled={!!required}>
                        {required ? "Select one..." : "(No Selection)"}
                    </Option>
                )}
                {renderGroups(choiceGroups)}
            </Field>
            <HelperText name={fieldName} hint={hint} />
        </FormControl>
    );
}

Select.propTypes = {
    choices: PropTypes.arrayOf(PropTypes.object),
    label: PropTypes.string,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    native: PropTypes.bool,
    renderValue: PropTypes.func,
    InputLabelProps: PropTypes.object,
};
