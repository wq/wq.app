import React from 'react';
import { ScrollView as PaperScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function ScrollView(props) {
    const theme = useTheme();
    return (
        <PaperScrollView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            {...props}
        />
    );
}
