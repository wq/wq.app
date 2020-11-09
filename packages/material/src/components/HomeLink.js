import React from 'react';
import { Link } from '@wq/react';
import Button from '@material-ui/core/Button';
import HomeIcon from '@material-ui/icons/Home';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles(() => ({
    icon: {
        verticalAlign: 'middle'
    }
}));

export default function HomeLink({ to, label, active, ...rest }) {
    const styles = useStyles();
    return (
        <Button
            component={Link}
            to={to}
            color={active ? 'inherit' : 'primary'}
            aria-label={label}
            {...rest}
        >
            <HomeIcon className={styles.icon} />
        </Button>
    );
}

HomeLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    label: PropTypes.string,
    active: PropTypes.bool
};
