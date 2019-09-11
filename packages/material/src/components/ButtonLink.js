import React from 'react';
import { Link } from '@wq/react';
import Button from '@material-ui/core/Button';

export default function ButtonLink(props) {
    return <Button component={Link} {...props} />;
}
