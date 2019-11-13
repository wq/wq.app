import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    main: {
        flexGrow: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
    }
}));

export default function Main({ children }) {
    const classes = useStyles();
    return <main className={classes.main}>
        {children}
    </main>;
}

Main.propTypes = {
    children: PropTypes.node
};
