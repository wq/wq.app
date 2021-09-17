import useMediaQuery from '@material-ui/core/useMediaQuery';

export function useMinWidth(minWidth) {
    return useMediaQuery(`(min-width:${minWidth}px)`);
}
