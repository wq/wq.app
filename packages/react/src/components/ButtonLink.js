import React from 'react';
import { NavLink } from 'redux-first-router-link';

export default function ButtonLink(props) {
    return (
        <NavLink
            style={{
                textDecoration: 'none',
                border: '1px solid #eee',
                borderRadius: '0.2em',
                padding: '0.2em'
            }}
            {...props}
        />
    );
}
