import React from 'react';
import { useRenderContext } from '../hooks';

export default function NotFound() {
    const { url } = useRenderContext();
    return <>Page {url} not found.</>;
}
