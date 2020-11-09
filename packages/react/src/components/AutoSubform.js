import React from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';
import { pascalCase } from 'pascal-case';

export default function AutoSubform({
    name,
    label,
    subform,
    component,
    ...rest
}) {
    const components = useComponents(),
        { AutoInput } = components,
        componentName = rest.control && rest.control.appearance;

    let Fieldset;
    if (component) {
        // Passed in from parent AutoSubformArray
        Fieldset = component;
    } else if (componentName) {
        // Defined in XLSForm config
        Fieldset = components[componentName];
        if (!Fieldset) {
            // eslint-disable-next-line
            Fieldset = ({ children, ...rest }) => {
                const { Text, Fieldset } = components;
                return (
                    <Fieldset {...rest}>
                        <Text>
                            Unknown fieldset type &quot;{componentName}&quot;.
                            Perhaps you need to define components.
                            {pascalCase(componentName)} in a plugin?
                        </Text>
                        {children}
                    </Fieldset>
                );
            };
        }
    } else {
        // Default (or global default override)
        Fieldset = components.Fieldset;
    }

    const prefix = name ? `${name}.` : '';

    return (
        <Fieldset name={name} label={label}>
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
    component: PropTypes.elementType
};
