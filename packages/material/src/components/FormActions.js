import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        justifyContent: 'flex-end',
        '& > *': {
            margin: theme.spacing(1)
        }
    }
}));

export default function FormActions({ children }) {
    const classes = useStyles();
    return <div className={classes.root}>{children}</div>;
}

FormActions.propTypes = {
    children: PropTypes.node
};
