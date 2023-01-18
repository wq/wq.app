import { useWindowDimensions } from "react-native";

export function useMinWidth(minWidth) {
    const { width } = useWindowDimensions();
    return width >= minWidth;
}
