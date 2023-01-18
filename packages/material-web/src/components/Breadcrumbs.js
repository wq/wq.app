import React from "react";
import Paper from "@mui/material/Paper";
import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import { useReverse, useComponents } from "@wq/react";

import PropTypes from "prop-types";

export default function Breadcrumbs({ links }) {
    const reverse = useReverse(),
        { ButtonLink, HomeLink } = useComponents();

    if (!links) {
        links = [{ url: reverse("index"), label: "Home", active: true }];
    }

    // FIXME: NavLink should already be able to detect current page
    links[links.length - 1].active = true;

    return (
        <Paper
            elevation={0}
            square
            sx={{
                py: 1,
                borderBottomColor: "divider",
            }}
        >
            <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                <HomeLink
                    to={links[0].url}
                    label={links[0].label}
                    active={links[0].active}
                />
                {links.slice(1).map(({ url, label, active }, i) => (
                    <ButtonLink
                        key={i}
                        to={url}
                        color={active ? "inherit" : "primary"}
                    >
                        {label}
                    </ButtonLink>
                ))}
            </MuiBreadcrumbs>
        </Paper>
    );
}

Breadcrumbs.propTypes = {
    links: PropTypes.arrayOf(PropTypes.object),
};
