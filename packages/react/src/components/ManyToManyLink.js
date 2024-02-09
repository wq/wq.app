import React from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

export default function ManyToManyLink({ ids, labels, model }) {
    const { ForeignKeyLink, Text } = useComponents();
    if (labels && typeof labels === "string") {
        labels = [labels];
    }
    return (ids || []).map((id, index) => (
        <React.Fragment key={id}>
            <ForeignKeyLink
                id={id}
                label={(labels || [])[index]}
                model={model}
            />
            <Text> </Text>
        </React.Fragment>
    ));
}

ManyToManyLink.propTypes = {
    ids: PropTypes.arrayOf(PropTypes.string),
    labels: PropTypes.arrayOf(PropTypes.string),
    model: PropTypes.string,
};
