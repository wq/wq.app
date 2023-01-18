import React from "react";
import reactRenderer from ".";
import TestRenderer from "react-test-renderer";

export default function renderTest(Component, app) {
    const RootComponent = app ? reactRenderer.wrap(Component, app) : Component;
    return TestRenderer.create(<RootComponent />, {
        createNodeMock: (el) => document.createElement(el.type),
    });
}

export async function nextTick() {
    await TestRenderer.act(async () => {
        await new Promise((res) => setTimeout(res, 1));
    });
}
