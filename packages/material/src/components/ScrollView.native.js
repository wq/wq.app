import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function Main(props) {
    const theme = useTheme();
    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            {...props}
        />
    );
}
