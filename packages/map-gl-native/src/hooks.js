import { useContext } from "react";
import { MapContext } from "./components/MapProvider.js";

export function useMapInstance() {
    const { instance } = useContext(MapContext) || {};
    return instance;
}
