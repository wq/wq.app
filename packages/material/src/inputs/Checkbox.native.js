import React from 'react';
import { useField } from 'formik';
import { Checkbox as PaperCheckbox, useTheme } from 'react-native-paper';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';

export default function Checkbox({ name, label }) {
    const theme = useTheme(),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue } = helpers;

    function toggleChecked() {
        setValue(!value);
    }

    return (
        <View
            style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}
        >
            <PaperCheckbox.Android
                status={value ? 'checked' : 'unchecked'}
                onPress={toggleChecked}
            />
            <Text
                style={{ color: theme.colors.text, fontSize: 16, flex: 1 }}
                onPress={toggleChecked}
            >
                {label}
            </Text>
        </View>
    );
}

Checkbox.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string
};
