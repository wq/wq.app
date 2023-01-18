import useMediaQuery from "@mui/material/useMediaQuery";

export function useMinWidth(minWidth) {
    return useMediaQuery(`(min-width:${minWidth}px)`);
}
