import React, { useState, useEffect } from 'react';
import { useComponents } from '@wq/react';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function GeoLocate({ name, type, setLocation }) {
    const { Button, Typography } = useComponents(),
        [gpsStatus, setGpsStatus] = useState(''),
        [gpsWatch, setGpsWatch] = useState(''),
        [, , { setValue: setAccuracy }] = useField(`${name}_accuracy`);

    function startGps() {
        if (gpsWatch) {
            return;
        }
        if (!('geolocation' in navigator)) {
            setGpsStatus('Geolocation not supported');
            return;
        }
        const watchId = navigator.geolocation.watchPosition(
            onPosition,
            onError,
            {
                enableHighAccuracy: true,
                timeout: 60 * 1000
            }
        );

        setGpsWatch(watchId);
        setGpsStatus('Determining location...');
    }

    function onPosition(evt) {
        const lat = +evt.coords.latitude.toFixed(6),
            lng = +evt.coords.longitude.toFixed(6),
            acc = +evt.coords.accuracy.toFixed(3);
        setLocation({
            longitude: lng,
            latitude: lat,
            zoom: true,
            save: type === 'geopoint'
        });
        setAccuracy(acc);

        const latFmt = lat > 0 ? lat + '°N' : -lat + '°S',
            lngFmt = lng > 0 ? lng + '°E' : -lng + '°W',
            accFmt =
                acc > 1000
                    ? '~' + Math.round(acc / 1000) + 'km'
                    : acc > 1
                    ? '~' + Math.round(acc) + 'm'
                    : acc + 'm';
        setGpsStatus(`${latFmt} ${lngFmt} (${accFmt})`);
    }

    function onError(error) {
        setGpsStatus(error.message);
        stopGps();
    }

    function stopGps() {
        if (gpsWatch) {
            navigator.geolocation.clearWatch(gpsWatch);
        }
        setGpsWatch(null);
    }

    useEffect(() => {
        return () => stopGps();
    }, []);

    const gpsActive = !!gpsWatch;

    return (
        <>
            <Typography
                style={{
                    marginRight: 8,
                    flex: 1,
                    textAlign: 'center'
                }}
                color="textSecondary"
            >
                {gpsStatus}
            </Typography>
            <Button
                icon={gpsActive ? 'gps-stop' : 'gps-start'}
                style={{ minWidth: 140 }}
                variant={gpsActive ? 'contained' : 'outlined'}
                color="secondary"
                onClick={gpsActive ? stopGps : startGps}
            >
                {gpsActive ? 'Stop GPS' : 'Start GPS'}
            </Button>
        </>
    );
}

GeoLocate.toolLabel = 'Current';

GeoLocate.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    setLocation: PropTypes.func
};
