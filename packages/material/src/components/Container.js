import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
    }
}));

export default function Container({ children }) {
    const classes = useStyles();
    return <div className={classes.container}>{children}</div>;
}
Container.propTypes = {
    children: PropTypes.node
};
