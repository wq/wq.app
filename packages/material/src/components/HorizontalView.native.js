import React from 'react';
import { View } from 'react-native';

export default function HorizontalView(props) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 8
            }}
            {...props}
        />
    );
}
