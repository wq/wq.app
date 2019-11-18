export default function load() {
    try {
        return require('leaflet-draw');
    } catch (e) {
        return false;
    }
}
