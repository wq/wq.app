import React from 'react';
import { useComponents, useInputComponents, useRenderContext } from '../hooks';
import PropTypes from 'prop-types';
import { pascalCase } from 'pascal-case';

export default function AutoInput({ name, choices, type, bind = {}, ...rest }) {
    const inputs = useInputComponents(),
        { AutoSubform, AutoSubformArray, Text } = useComponents(),
        context = useRenderContext();

    if (type === 'group') {
        return <AutoSubform name={name} {...rest} />;
    } else if (type === 'repeat') {
        return <AutoSubformArray name={name} {...rest} />;
    }

    let inputType,
        required = bind.required;
    if (rest['wq:ForeignKey']) {
        let choicesFn = context[name.replace(/\[\d+\]/, '') + '_list'];
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
        if (type === 'picture' || type === 'photo') {
            inputType = 'image';
        } else if (type === 'video' || type === 'audio') {
            inputType = 'file';
        } else if (type === 'binary') {
            // wq.db <1.3
            inputType = 'file';
        } else {
            inputType = 'input';
        }
    }

    if (rest.control && rest.control.appearance) {
        inputType = rest.control.appearance;
    }

    const Input = inputs[inputType];

    if (!Input) {
        return (
            <Text>
                Unknown input type &quot;{inputType}&quot;. Perhaps you need to
                define inputs.{pascalCase(inputType)} in a plugin?
            </Text>
        );
    }

    return (
        <Input
            name={name}
            choices={choices}
            type={type}
            required={required}
            {...rest}
        />
    );
}

AutoInput.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    bind: PropTypes.object,
    'wq:ForeignKey': PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object)
};
