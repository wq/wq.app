import React from "react";
import { createRoot } from "react-dom/client";

export function init() {
    if (!this.root) {
        this.root = document.body.appendChild(document.createElement("div"));
        this.root.id = "wq-app-root";
    }
}

export function start() {
    const RootComponent = this.getRootComponent();
    this._reactRoot = createRoot(this.root);
    this._reactRoot.render(<RootComponent />);
}

export function unmount() {
    if (this._reactRoot) {
        this._reactRoot.unmount();
    }
}
