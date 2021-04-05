import React, { useState } from 'react';
import { useComponents } from '@wq/react';
import Collapse from '@material-ui/core/Collapse';
import PropTypes from 'prop-types';

export default function ExpandableListItem({ children, ...rest }) {
    const [summary, ...details] = React.Children.toArray(children),
        [open, setOpen] = useState(false),
        toggleOpen = () => setOpen(!open),
        { ListItem, IconButton } = useComponents();

    return (
        <>
            <ListItem
                button
                onClick={toggleOpen}
                secondaryAction={
                    <IconButton
                        icon={open ? 'collapse' : 'expand'}
                        onClick={toggleOpen}
                    />
                }
                {...rest}
            >
                {summary}
            </ListItem>
            <Collapse in={open} timeout="auto">
                {details}
            </Collapse>
        </>
    );
}

ExpandableListItem.propTypes = {
    children: PropTypes.node
};
