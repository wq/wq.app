import React from 'react';
import { useRouteInfo, useComponents } from '../hooks';
import { pascalCase } from 'pascal-case';

export default function Default() {
    const { name } = useRouteInfo(),
        { View, Text, DebugContext } = useComponents();

    return (
        <View>
            <Text>
                To customize this view, define views.{pascalCase(name)} in a
                plugin.
            </Text>
            <DebugContext />
        </View>
    );
}
