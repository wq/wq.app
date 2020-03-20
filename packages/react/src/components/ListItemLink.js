import React from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function ListItemLink({ children, ...rest }) {
    const { Link } = useComponents();
    return (
        <li>
            <Link {...rest}>{children}</Link>
        </li>
    );
}

ListItemLink.propTypes = {
    children: PropTypes.node
};
