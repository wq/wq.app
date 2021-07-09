import React, { useCallback } from 'react';
import { useComponents } from '../hooks';
import { FieldArray, getIn } from 'formik';
import PropTypes from 'prop-types';
import { initData } from './AutoForm';
import { pascalCase } from 'pascal-case';

export default function AutoSubformArray({ name, label, subform, ...rest }) {
    const components = useComponents(),
        { AutoSubform } = components,
        componentName = rest.control && rest.control.appearance;

    let FieldsetArray;
    if (componentName) {
        // Defined in XLSForm config
        FieldsetArray = components[componentName];
        if (!FieldsetArray) {
            // eslint-disable-next-line
            FieldsetArray = ({ children, ...rest }) => {
                const { Text, FieldsetArray } = components;
                return (
                    <FieldsetArray {...rest}>
                        <Text>
                            Unknown fieldset array type &quot;{componentName}
                            &quot;. Perhaps you need to define components.
                            {pascalCase(componentName)} in a plugin?
                        </Text>
                        {children}
                    </FieldsetArray>
                );
            };
        }
    } else if (
        subform.length === 1 &&
        (subform[0].type === 'file' || subform[0].type === 'image')
    ) {
        // Special case for subforms containing only a single file field
        FieldsetArray = components.FileArray;
    } else {
        // Default (or global default override)
        FieldsetArray = components.FieldsetArray;
    }

    const SubformArray = useCallback(
        ({ form: formikContext, push, remove, pop }) => {
            const { values } = formikContext,
                list = getIn(values, name) || [];

            function addRow(vals) {
                const row = initData(subform, vals || {});
                push(row);
            }

            const removeRow = remove,
                removeLastRow = pop;

            return (
                <FieldsetArray
                    name={name}
                    label={label}
                    subform={subform}
                    addRow={addRow}
                    removeRow={removeRow}
                    removeLastRow={removeLastRow}
                    {...rest}
                >
                    {list.map((row, i) => (
                        <AutoSubform
                            key={i}
                            label={`${label} ${i + 1}`}
                            name={`${name}[${i}]`}
                            subform={subform}
                            component={FieldsetArray.Fieldset}
                        />
                    ))}
                </FieldsetArray>
            );
        },
        [name, label, subform, FieldsetArray, AutoSubform]
    );

    SubformArray.displayName = 'SubformArray';

    return (
        <FieldArray
            name={name}
            component={SubformArray}
            label={label}
            subform={subform}
        />
    );
}

AutoSubformArray.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    subform: PropTypes.arrayOf(PropTypes.object)
};
