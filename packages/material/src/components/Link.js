import React from 'react';
import { Link as RLink } from '@wq/react';
import UILink from '@material-ui/core/Link';

export default function Link(props) {
    return <UILink component={RLink} {...props} />;
}
