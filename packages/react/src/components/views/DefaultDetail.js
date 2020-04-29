import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../../hooks';

const Value = ({ context, field }) => {
    const { FormatJson } = useComponents(),
        value = context[field.name];

    if (field['wq:ForeignKey']) {
        if (value && typeof value === 'object' && value.label) {
            return value.label;
        } else {
            return (
                context[field.name + '_label'] || context[field.name + '_id']
            );
        }
    } else if (typeof value === 'object') {
        return <FormatJson json={value} />;
    } else {
        return value + '';
    }
};

function PropertyTable() {
    const context = useRenderContext(),
        { Table, TableBody, TableRow, TableCell } = useComponents(),
        { page_config } = useRouteInfo(),
        fields = page_config.form || [{ name: 'label' }];
    return (
        <Table>
            <TableBody>
                {fields.map(field => (
                    <TableRow key={field.name}>
                        <TableCell>{field.label || field.name}</TableCell>
                        <TableCell>
                            <Value context={context} field={field} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function DefaultDetail() {
    const reverse = useReverse(),
        { page, item_id, page_config } = useRouteInfo(),
        { ScrollView, Fab } = useComponents(),
        editUrl = reverse(`${page}_edit`, item_id);
    return (
        <>
            <ScrollView>
                <PropertyTable />
            </ScrollView>
            {page_config.can_change && <Fab icon="edit" to={editUrl} />}
        </>
    );
}
