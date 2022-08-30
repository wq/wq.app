export default function VectorTile() {
    // Handled with style= prop in root Map
    return null;
}

export function asBasemapStyle(basemap) {
    return basemap.style || basemap.url;
}

VectorTile.asBasemapStyle = asBasemapStyle;
