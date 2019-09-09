import React from 'react';
import { NavLink } from 'redux-first-router-link';
import Button from '@material-ui/core/Button';

export default function ButtonLink(props) {
    return <Button component={NavLink} {...props} />;
}
