import React from 'react';
import { useComponents } from '../hooks';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
import { initData } from './AutoForm';

export default function AutoSubformArray({ name, label, subform, ...rest }) {
    const { FieldsetArray, AutoSubform } = useComponents();

    function SubformArray({ form: formikContext, push, pop }) {
        const { values } = formikContext,
            list = values[name] || [];

        function addRow(vals) {
            const row = initData(subform, vals || {});
            push(row);
        }

        const removeLastRow = pop;

        return (
            <FieldsetArray
                name={name}
                label={label}
                subform={subform}
                addRow={addRow}
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
    }
    SubformArray.propTypes = {
        form: PropTypes.object,
        push: PropTypes.func,
        pop: PropTypes.func
    };

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
