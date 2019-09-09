import React from 'react';

import TablePagination from '@material-ui/core/TablePagination';
import Paper from '@material-ui/core/Paper';

import { useRenderContext, useRouteInfo, useReverse, useNav } from '../hooks';

export default function Pagination() {
    const { multiple, page: pageNum, count, per_page } = useRenderContext(),
        { name: routeName, params } = useRouteInfo(),
        reverse = useReverse(),
        nav = useNav();

    if (!(multiple && count && per_page)) {
        return null;
    }

    const updateParams = newParams => {
        nav(
            reverse(
                routeName,
                {},
                {
                    ...params,
                    ...newParams
                }
            )
        );
    };
    const handleChangePage = (evt, page) => updateParams({ page: page + 1 });
    const handleChangeRowsPerPage = evt =>
        updateParams({ limit: evt.target.value });
    return (
        <Paper>
            <TablePagination
                component="div"
                count={count}
                page={pageNum - 1}
                rowsPerPage={per_page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
