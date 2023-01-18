import React from "react";
import { Button } from "react-native-paper";
import { useNav } from "@wq/react";
import PropTypes from "prop-types";

export default function ButtonLink({ to, children }) {
    const onPress = useNav(to);
    return <Button onPress={onPress}>{children}</Button>;
}

ButtonLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    children: PropTypes.node,
};
