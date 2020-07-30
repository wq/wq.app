import React from 'react';
import RNPickerSelect from 'react-native-picker-select';
import { TextInput, useTheme } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function Select({ name, choices, label }) {
    const theme = useTheme(),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue } = helpers;

    const styles = {
        inputIOS: {
            color: theme.colors.text,
            marginLeft: 12,
            paddingTop: 32,
            fontSize: 16
        },
        inputAndroid: {
            color: theme.colors.text,
            marginLeft: 4,
            paddingTop: 40,
            paddingBottom: 40,
            marginBottom: -40
        }
    };

    return (
        <TextInput
            label={label}
            value={'-'}
            render={() => (
                <RNPickerSelect
                    value={value}
                    onValueChange={setValue}
                    items={choices.map(({ name, label }) => ({
                        value: name,
                        label
                    }))}
                    style={styles}
                />
            )}
        />
    );
}

Select.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object)
};
