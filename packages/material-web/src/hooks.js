import { useMediaQuery } from "@mui/material";

export function useMinWidth(minWidth) {
    return useMediaQuery(`(min-width:${minWidth}px)`);
}
