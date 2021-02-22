import React from 'react';
import { useSitemap, useReverse, useRouteTitle, useComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function Index() {
    const reverse = useReverse(),
        routeTitle = useRouteTitle(),
        { options, models } = useSitemap(),
        {
            Message,
            ScrollView,
            List,
            ListSubheader,
            ListItemLink
        } = useComponents();

    function PageLink({ name }) {
        const to = reverse(name),
            title = routeTitle(name);
        return <ListItemLink to={to}>{title}</ListItemLink>;
    }
    PageLink.propTypes = {
        name: PropTypes.string
    };

    const subheadings = models.length > 0 && options.length > 0;

    return (
        <ScrollView>
            <List>
                {subheadings && (
                    <ListSubheader>
                        <Message id="OTHER_PAGES" />
                    </ListSubheader>
                )}
                {options.map(page => (
                    <PageLink key={page.name} name={page.name} />
                ))}
                {subheadings && (
                    <ListSubheader>
                        <Message id="MODEL_PAGES" />
                    </ListSubheader>
                )}
                {models.map(page => (
                    <PageLink key={page.name} name={`${page.name}_list`} />
                ))}
            </List>
        </ScrollView>
    );
}
