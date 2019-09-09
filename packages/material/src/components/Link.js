import React from 'react';
import { NavLink } from 'redux-first-router-link';
import UILink from '@material-ui/core/Link';

export default function Link(props) {
    return <UILink component={NavLink} {...props} />;
}
