const geolocation = {
    supported: 'geolocation' in navigator,
    watchPosition(onPosition, onError, options) {
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
