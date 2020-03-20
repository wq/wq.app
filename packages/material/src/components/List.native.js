import React from 'react';
import { ScrollView } from 'react-native';

export default function List(props) {
    return <ScrollView style={{ flex: 1 }} {...props} />;
}
