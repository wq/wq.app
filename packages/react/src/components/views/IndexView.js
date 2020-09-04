import React from 'react';
import {
    useRenderContext,
    useReverse,
    useRouteTitle,
    useComponents
} from '../../hooks';
import PropTypes from 'prop-types';

export default function Index() {
    const reverse = useReverse(),
        routeTitle = useRouteTitle(),
        { pages } = useRenderContext(),
        {
            Message,
            ScrollView,
            List,
            ListSubheader,
            ListItemLink
        } = useComponents();

    const options = (pages || []).filter(page => !page.list),
        models = (pages || []).filter(page => page.list);

    function PageLink({ name }) {
        const to = reverse(name),
            title = routeTitle(name);
        return <ListItemLink to={to}>{title}</ListItemLink>;
    }
    PageLink.propTypes = {
        name: PropTypes.string
    };

    return (
        <ScrollView>
            <List>
                {models.length > 0 && (
                    <ListSubheader>
                        <Message id="OTHER_PAGES" />
                    </ListSubheader>
                )}
                {options.map(page => (
                    <PageLink key={page.name} name={page.name} />
                ))}
                {models.length > 0 && (
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
