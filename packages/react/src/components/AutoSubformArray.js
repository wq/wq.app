import React from 'react';
import { useComponents } from '../hooks';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
import { initData } from './AutoForm';

export default function AutoSubformArray({ name, label, subform }) {
    const { Button, AutoSubform } = useComponents();

    function SubformArray({ form: formikContext, push }) {
        const { values } = formikContext,
            list = values[name] || [];

        function addRow() {
            const row = initData(subform, {});
            push(row);
        }

        return (
            <div>
                {list.map((row, i) => (
                    <AutoSubform
                        key={i}
                        label={`${label} ${i + 1}`}
                        name={`${name}[${i}]`}
                        subform={subform}
                    />
                ))}
                <Button onClick={addRow}>{`Add ${name}`}</Button>
            </div>
        );
    }
    SubformArray.propTypes = {
        form: PropTypes.object,
        push: PropTypes.func
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
