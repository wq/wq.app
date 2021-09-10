export * from './util.js';

export function zoomToLocation(instance, geometry) {
    if (geometry.type == 'Point') {
        instance.camera.setCamera({
            centerCoordinate: geometry.coordinates,
            zoomLevel: 18,
            animationDuration: 2000
        });
    } else {
        // FIXME
    }
}
