import * as Location from 'expo-location';

const geolocation = {
    supported: true,
    async watchPosition(onPosition, onError, options) {
        Location.installWebGeolocationPolyfill();
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status != 'success') {
            onError(new Error('Location permission not granted'));
        }

        return navigator.geolocation.watchPosition(
            onPosition,
            onError,
            options
        );
    },
    clearWatch(watchId) {
        return navigator.geolocation.clearWatch(watchId);
    }
};

export default geolocation;