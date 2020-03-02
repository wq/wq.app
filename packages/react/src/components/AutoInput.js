import React from 'react';
import { useComponents, useInputComponents, useRenderContext } from '../hooks';
import PropTypes from 'prop-types';

export default function AutoInput(props) {
    const inputs = useInputComponents(),
        { AutoSubform, AutoSubformArray } = useComponents(),
        context = useRenderContext();

    let { name, choices } = props,
        type = props['wq:ForeignKey'] ? 'wq:ForeignKey' : props.type;

    if (type === 'group') {
        return <AutoSubform {...props} />;
    } else if (type === 'repeat') {
        return <AutoSubformArray {...props} />;
    } else if (type === 'wq:ForeignKey') {
        let choicesFn = context[`${name}_list`];
        choices = choicesFn ? choicesFn.call(context) : [];
        choices = choices.map(({ id, label, outbox }) => ({
            name: id,
            label: outbox ? `* ${label}` : label
        }));

        name = `${name}_id`;
        type = 'select';
    } else if (type === 'select1' || type === 'select one') {
        if (!choices) {
            choices = [];
        }
        if (choices.length < 5) {
            type = 'toggle';
        } else if (choices.length < 10) {
            type = 'radio';
        } else {
            type = 'select';
        }
    } else if (!inputs[type]) {
        type = 'input';
    }

    const Input = inputs[type];

    return <Input choices={choices} {...props} />;
}

AutoInput.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    'wq:ForeignKey': PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object)
};
