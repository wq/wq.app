import React, { useState } from "react";
import { useIcon } from "@wq/react";
import { List } from "react-native-paper";
import PropTypes from "prop-types";

export default function ExpandableListItem({
    children,
    description,
    icon,
    open,
    onToggle,
    ...rest
}) {
    const Icon = useIcon(icon),
        [summary, ...details] = React.Children.toArray(children),
        [internalOpen, setOpen] = useState(false);

    let toggleOpen;
    if (open === false || open || onToggle) {
        toggleOpen = () => onToggle(!open);
    } else {
        open = internalOpen;
        toggleOpen = () => setOpen(!open);
    }

    return (
        <List.Accordion
            title={summary}
            description={description}
            left={Icon ? (props) => <List.Icon icon={Icon} {...props} /> : null}
            expanded={open}
            onPress={toggleOpen}
            {...rest}
        >
            {details}
        </List.Accordion>
    );
}

ExpandableListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string,
    open: PropTypes.bool,
    onToggle: PropTypes.func,
};
