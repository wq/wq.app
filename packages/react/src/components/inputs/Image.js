import React from 'react';
import File from './File';

export default function Image(props) {
    return <File accept="image/*" {...props} />;
}
