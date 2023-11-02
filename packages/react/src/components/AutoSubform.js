import React from "react";
import { useComponents, useInputComponents } from "../hooks.js";
import PropTypes from "prop-types";
import { pascalCase } from "pascal-case";

export default function AutoSubform({
    name,
    label,
    subform,
    component,
    ...rest
}) {
    const components = useComponents(),
        inputs = useInputComponents(),
        { AutoInput } = components,
        componentName = rest.control && rest.control.appearance;

    let Fieldset;
    if (component) {
        // Passed in from parent AutoSubformArray
        Fieldset = component;
    } else if (componentName) {
        // Defined in XLSForm config
        Fieldset = inputs[componentName];
        if (!Fieldset) {
            // eslint-disable-next-line
            Fieldset = ({ children, ...rest }) => {
                const { Text } = components,
                    { Fieldset } = inputs,
                    name = pascalCase(componentName);
                return (
                    <Fieldset {...rest}>
                        <Text>
                            Unknown fieldset type &quot;{componentName}&quot;.{" "}
                            {components[componentName] ? (
                                <>
                                    Move or copy components.{name} to inputs.
                                    {name}?
                                </>
                            ) : (
                                <>
                                    Perhaps you need to define inputs.{name} in
                                    a plugin?
                                </>
                            )}
                        </Text>
                        {children}
                    </Fieldset>
                );
            };
        }
    } else {
        // Default (or global default override)
        Fieldset = inputs.Fieldset;
    }

    const prefix = name ? `${name}.` : "";

    return (
        <Fieldset name={name} label={label} {...rest}>
            {subform.map(({ name: fieldName, children: subform, ...rest }) => (
                <AutoInput
                    key={fieldName}
                    name={`${prefix}${fieldName}`}
                    subform={subform}
                    {...rest}
                />
            ))}
        </Fieldset>
    );
}

AutoSubform.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    subform: PropTypes.arrayOf(PropTypes.object),
    component: PropTypes.elementType,
};
