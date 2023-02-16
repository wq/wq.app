import React from "react";
import { useComponents } from "../hooks.js";

export default function Loading() {
    const { Message, Text } = useComponents();
    return (
        <Text>
            <Message id="LOADING" />
        </Text>
    );
}
