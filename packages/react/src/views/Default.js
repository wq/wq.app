import React from "react";
import { useRouteInfo, useComponents } from "../hooks.js";
import { pascalCase } from "pascal-case";

export default function Default() {
    const { template } = useRouteInfo(),
        { View, Text, DebugContext } = useComponents();

    return (
        <View>
            <Text>
                To customize this view, define views.{pascalCase(template)} in a
                plugin.
            </Text>
            <DebugContext />
        </View>
    );
}
