import React from "react";

import { TablePagination, Paper } from "@mui/material";

import { useRenderContext, useRouteInfo, useReverse, useNav } from "@wq/react";

export default function Pagination() {
    const reverse = useReverse(),
        nav = useNav(),
        { multiple, page: pageNum, count, per_page } = useRenderContext(),
        { name: routeName, params } = useRouteInfo();

    if (!(multiple && count && per_page)) {
        return null;
    }

    const updateParams = (newParams) => {
        nav(
            reverse(
                routeName,
                {},
                {
                    ...params,
                    ...newParams,
                }
            )
        );
    };
    const handleChangePage = (evt, page) => updateParams({ page: page + 1 });
    const handleChangeRowsPerPage = (evt) =>
        updateParams({ limit: evt.target.value });
    return (
        <Paper>
            <TablePagination
                component="div"
                count={count}
                page={pageNum - 1}
                rowsPerPage={per_page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
