import React from 'react';
import { Picker } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function Select({ name, choices, label }) {
    const theme = useTheme(),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue } = helpers;

    return (
        <TextInput
            label={label}
            value={'-'}
            render={() => (
                <Picker
                    prompt={label}
                    style={{ color: theme.colors.text, top: 16, left: 4 }}
                    selectedValue={value}
                    onValueChange={setValue}
                >
                    <Picker.Item label="" value="" />
                    {choices.map(({ name, label }) => (
                        <Picker.Item key={name} label={label} value={name} />
                    ))}
                </Picker>
            )}
        />
    );
}

Select.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object)
};
