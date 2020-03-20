import React from 'react';
import { useRouteInfo, useComponents } from '../../hooks';

export default function Default() {
    const { name } = useRouteInfo(),
        { View, Text, DebugContext } = useComponents();

    return (
        <View>
            <Text>
                To customize this view, define <code>views.{name}</code> in a
                plugin.
            </Text>
            <DebugContext />
        </View>
    );
}
