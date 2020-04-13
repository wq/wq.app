import React from 'react';
import {
    Text,
    Subheading,
    Title,
    Paragraph,
    Headline,
    Caption
} from 'react-native-paper';
import PropTypes from 'prop-types';

const variants = {
    default: Text,
    h1: Headline,
    h2: Headline,
    h3: Headline,
    h4: Headline,
    h5: Headline,
    h6: Title,
    subtitle1: Subheading,
    subtitle2: Subheading,
    body1: Paragraph,
    body2: Paragraph,
    caption: Caption
};

export default function Typography({ variant, ...rest }) {
    const Component = variants[variant] || variants.default;
    return <Component {...rest} />;
}

Typography.propTypes = {
    variant: PropTypes.string
};
