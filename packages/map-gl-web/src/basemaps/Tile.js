export default function Tile() {
    // Handled with style= prop in root Map
    return null;
}

export function asBasemapStyle(basemap) {
    const urls = [];
    if (basemap.url.match("{s}")) {
        (basemap.subdomains || ["a", "b", "c"]).forEach((s) =>
            urls.push(basemap.url.replace("{s}", s))
        );
    } else {
        urls.push(basemap.url);
    }
    return {
        version: 8,
        sources: {
            [basemap.name]: {
                type: "raster",
                tiles: urls,
                tileSize: basemap.tileSize || 256,
            },
        },
        layers: [
            {
                id: basemap.name,
                type: "raster",
                source: basemap.name,
            },
        ],
    };
}

Tile.asBasemapStyle = asBasemapStyle;
