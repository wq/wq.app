import React, { useMemo } from "react";
import { Field, getIn } from "formik";
import { Select as FMuiSelect } from "formik-mui";
import { MenuItem, Checkbox, ListItemText, ListSubheader } from "@mui/material";
import PropTypes from "prop-types";
import { useFormikContext } from "formik";

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

    const Option = useMemo(
        () =>
            native
                ? ({ value, children }) => (
                      <option value={value}>{children}</option>
                  )
                : ({ children, ...rest }) => (
                      <MenuItem {...rest}>
                          {multiple && (
                              <ContextCheckbox
                                  value={rest["data-value"]}
                                  field={fieldName}
                              />
                          )}
                          <ListItemText
                              primary={children}
                              data-value={rest["data-value"]}
                              primaryTypographyProps={{
                                  "data-value": rest["data-value"],
                              }}
                          />
                      </MenuItem>
                  ),
        [native, multiple, fieldName]
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
        <Field
            component={FMuiSelect}
            formControl={{ fullWidth: true, margin: "dense" }}
            inputLabel={{ required, error: showError, ...InputLabelProps }}
            formHelperText={{ children: hint }}
            multiple={multiple}
            required={required}
            native={native}
            label={label}
            renderValue={renderValue}
            displayEmpty={!!placeholder}
            {...(InputLabelProps && InputLabelProps.shrink
                ? { notched: true }
                : {})}
            {...rest}
        >
            {!multiple && (
                <Option value={""} disabled={!!required}>
                    {required ? "Select one..." : "(No Selection)"}
                </Option>
            )}
            {renderGroups(choiceGroups)}
        </Field>
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
