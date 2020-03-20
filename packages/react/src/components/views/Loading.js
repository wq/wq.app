import React from 'react';
import { useComponents } from '../../hooks';

export default function Loading() {
    const { Text } = useComponents();
    return <Text>Loading...</Text>;
}
