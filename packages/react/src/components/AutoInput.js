import React from 'react';
import { useComponents, useInputComponents, useRenderContext } from '../hooks';
import PropTypes from 'prop-types';

export default function AutoInput({ name, choices, type, ...rest }) {
    const inputs = useInputComponents(),
        { AutoSubform, AutoSubformArray } = useComponents(),
        context = useRenderContext();

    if (type === 'group') {
        return <AutoSubform name={name} {...rest} />;
    } else if (type === 'repeat') {
        return <AutoSubformArray name={name} {...rest} />;
    }

    let inputType;
    if (rest['wq:ForeignKey']) {
        let choicesFn = context[`${name}_list`];
        choices = choicesFn ? choicesFn.call(context) : [];
        choices = choices.map(({ id, label, outbox }) => ({
            name: id,
            label: outbox ? `* ${label}` : label
        }));

        name = `${name}_id`;
        inputType = 'select';
    } else if (type === 'select1' || type === 'select one') {
        if (!choices) {
            choices = [];
        }
        if (choices.length < 5) {
            inputType = 'toggle';
        } else if (choices.length < 10) {
            inputType = 'radio';
        } else {
            inputType = 'select';
        }
    } else if (inputs[type]) {
        inputType = type;
    } else {
        inputType = 'input';
    }

    const Input = inputs[inputType];

    return <Input name={name} choices={choices} type={type} {...rest} />;
}

AutoInput.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    'wq:ForeignKey': PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object)
};
