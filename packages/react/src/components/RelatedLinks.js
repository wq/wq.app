import React from "react";
import {
    useConfig,
    useComponents,
    useReverse,
    useRouteTitle,
    useApp,
} from "../hooks.js";
import PropTypes from "prop-types";

export default function RelatedLinks({ id, model }) {
    const { pages } = useConfig(),
        app = useApp(),
        { List, ListSubheader, ListItemLink } = useComponents(),
        reverse = useReverse(),
        routeTitle = useRouteTitle();

    const related = Object.values(pages).filter((conf) =>
        app.getParents(conf.name).includes(model)
    );
    if (related.length === 0) {
        return null;
    }
    related.sort(relSort);
    return (
        <List>
            <ListSubheader>Related</ListSubheader>
            {related.map((rel) => (
                <ListItemLink
                    icon={rel.icon}
                    key={rel.name}
                    to={reverse(`${rel.name}_list:${model}`, { parent_id: id })}
                >
                    {routeTitle(`${rel.name}_list`)}
                </ListItemLink>
            ))}
        </List>
    );
}

RelatedLinks.propTypes = {
    id: PropTypes.string,
    model: PropTypes.string,
};

function relSort(r1, r2) {
    const label1 = relLabel(r1),
        label2 = relLabel(r2);
    if (r1.order > r2.order) {
        return 1;
    } else if (r1.order < r2.order) {
        return -1;
    } else if (label1 < label2) {
        return 1;
    } else if (label1 > label2) {
        return -1;
    } else {
        return 0;
    }
}

function relLabel(rel) {
    return rel.verbose_name_plural || rel.url || rel.name;
}
