import React from 'react';
import { useRenderContext, useComponents } from '../../hooks';

export default function Logout() {
    const { is_authenticated } = useRenderContext(),
        { View, Text } = useComponents();
    const message = is_authenticated ? 'Logging out...' : 'Logged out';
    return (
        <View>
            <Text>{message}</Text>
        </View>
    );
}
