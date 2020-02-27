import React from 'react';
import { Link as RLink } from '@wq/react';
import MuiLink from '@material-ui/core/Link';

export default function Link(props) {
    return <MuiLink component={RLink} {...props} />;
}
