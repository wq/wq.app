import React from "react";
import { Button } from "react-native";
import { useNav } from "@wq/react";
import PropTypes from "prop-types";

export default function Link({ to, children }) {
    const onPress = useNav(to);
    // FIXME: Use styled text instead?
    return <Button title={children} onPress={onPress} />;
}

Link.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    children: PropTypes.node,
};
