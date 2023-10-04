import { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useControl } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

export default function Draw({ type, required, data, setData }) {
    const types = type === "all" ? ["point", "line_string", "polygon"] : [type],
        controls = {},
        ref = useRef();

    types.forEach((type) => (controls[type] = true));

    if (!required) {
        controls.trash = true;
    }
    const draw = useControl(
        () => {
            const { classes } = MapboxDraw.constants;
            for (const [key, value] of Object.entries(classes)) {
                if (value.startsWith("mapboxgl-")) {
                    classes[key] = value.replace("mapboxgl-", "maplibregl-");
                }
            }
            return new MapboxDraw({
                displayControlsDefault: false,
                controls,
            });
        },
        ({ map }) => {
            map.on("draw.create", handleChange);
            map.on("draw.delete", handleChange);
            map.on("draw.update", handleChange);
            map.on("draw.combine", handleChange);
            map.on("draw.uncombine", handleChange);
        },
        ({ map }) => {
            map.off("draw.create", handleChange);
            map.off("draw.delete", handleChange);
            map.off("draw.update", handleChange);
            map.off("draw.combine", handleChange);
            map.off("draw.uncombine", handleChange);
        },
        { position: "top-right" }
    );

    useEffect(() => {
        ref.current = { draw };
    }, [draw]);

    useEffect(() => {
        if (draw && data) {
            draw.set(data);
        }
    }, [draw, data]);

    function handleChange() {
        const { draw } = ref.current;
        setData(draw.getAll());
    }

    return null;
}

Draw.propTypes = {
    type: PropTypes.string,
    required: PropTypes.boolean,
    data: PropTypes.object,
    setData: PropTypes.func,
};
