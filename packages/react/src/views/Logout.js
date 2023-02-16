import React from "react";
import { useRenderContext, useComponents } from "../hooks.js";

export default function Logout() {
    const { is_authenticated } = useRenderContext(),
        { Message, View, Text } = useComponents();
    return (
        <View>
            <Text>
                <Message id={is_authenticated ? "LOGGING_OUT" : "LOGGED_OUT"} />
            </Text>
        </View>
    );
}
