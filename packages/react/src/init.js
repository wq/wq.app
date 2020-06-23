import React from 'react';
import ReactDOM from 'react-dom';

export function init() {
    if (!this.root) {
        this.root = document.body.appendChild(document.createElement('div'));
        this.root.id = 'wq-app-root';
    }
}

export function start() {
    const RootComponent = this.getRootComponent();
    ReactDOM.render(<RootComponent />, this.root);
}

export function unmount() {
    ReactDOM.unmountComponentAtNode(this.root);
}
