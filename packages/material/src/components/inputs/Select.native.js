import React from 'react';
import RNPickerSelect from 'react-native-picker-select';
import { Platform } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function Select({ name, choices, label }) {
    const theme = useTheme(),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue } = helpers;

    const styles = {
        viewContainer:
            Platform.OS === 'ios'
                ? {
                      top: 32,
                      left: 12
                  }
                : {
                      top: 16,
                      left: 4
                  },
        inputIOS: {
            color: theme.colors.text,
            fontSize: 16
        },
        inputAndroid: {
            color: theme.colors.text
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
