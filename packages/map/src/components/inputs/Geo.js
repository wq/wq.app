import React, { useState, useEffect, useMemo } from 'react';
import { useComponents, useInputComponents, usePlugin } from '@wq/react';
import { useOverlayComponents } from '../../hooks';
import { useField, useFormikContext } from 'formik';
import PropTypes from 'prop-types';

export const TYPE_MAP = {
    geopoint: 'point',
    geotrace: 'line_string',
    geoshape: 'polygon'
};

const LOOKUP_METHODS = [
    { name: 'gps', label: 'Current' },
    { name: 'geocode', label: 'Address' },
    { name: 'manual', label: 'Lat/Lng' }
];

export default function Geo({ name, type, label }) {
    const {
            Fieldset,
            AutoMap,
            View,
            Button,
            IconButton,
            Typography
        } = useComponents(),
        { Input, Toggle } = useInputComponents(),
        { Draw } = useOverlayComponents(),
        [, { value }, { setValue }] = useField(name),
        [, { value: method }] = useField(name + '_method'),
        [
            ,
            { value: address },
            { setValue: setAddress, setError: setAddressError }
        ] = useField(name + '_address'),
        [, { value: latitude }, { setValue: setLatitude }] = useField(
            name + '_latitude'
        ),
        [, { value: longitude }, { setValue: setLongitude }] = useField(
            name + '_longitude'
        ),
        [, , { setValue: setAccuracy }] = useField(name + '_accuracy'),
        { setBounds, config } = usePlugin('map'),
        [gpsStatus, setGpsStatus] = useState(''),
        [gpsWatch, setGpsWatch] = useState(''),
        [geocodeStatus, setGeocodeStatus] = useState(null),
        maxGeometries = 1; // FIXME;

    const { values } = useFormikContext();

    const drawType = TYPE_MAP[type] || 'all',
        geojson = useFeatureCollection(value);

    async function geocode() {
        setAddressError(null);
        setGeocodeStatus('Looking up location...');
        try {
            const result = await config.geocoder(address);
            const geometry = flatten(result.geometry);
            if (type === 'geopoint') {
                setValue(geometry);
            }
            recenterMap(geometry.coordinates[1], geometry.coordinates[0]);
            setGeocodeStatus(result.label || 'Location found!');
        } catch (e) {
            setAddressError(e.message || '' + e);
            setGeocodeStatus(null);
        }
    }

    function handleChange(geojson) {
        geojson = flatten(geojson);
        if (
            geojson.type === 'GeometryCollection' &&
            geojson.geometries.length > maxGeometries
        ) {
            geojson = geojson.geometries[geojson.geometries.length - 1];
        }
        if (
            method === 'manual' &&
            type === 'geopoint' &&
            geojson.type === 'Point'
        ) {
            setLongitude(+geojson.coordinates[0].toFixed(6));
            setLatitude(+geojson.coordinates[1].toFixed(6));
        }
        setValue(geojson);
    }

    useEffect(() => {
        if (gpsWatch && method !== 'gps') {
            stopGps();
        }
    }, [gpsWatch, method]);

    useEffect(() => {
        if (
            address === undefined &&
            method === 'geocode' &&
            config.geocoderAddress
        ) {
            setDefaultAddress();
        }
        async function setDefaultAddress() {
            setAddress(await config.geocoderAddress(values));
        }
    }, [address, method, values]);

    function saveLatLong() {
        if (
            !latitude ||
            !longitude ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
        ) {
            return;
        }
        if (type === 'geopoint') {
            setValue({
                type: 'Point',
                coordinates: [longitude, latitude]
            });
        }
        recenterMap(latitude, longitude);
    }

    function recenterMap(lat, lng) {
        setBounds([
            [lat - 0.0005, lng - 0.0005],
            [lat + 0.0005, lng + 0.0005]
        ]);
    }

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

    const methods = config.geocoder
        ? LOOKUP_METHODS
        : LOOKUP_METHODS.filter(method => method.name !== 'geocode');

    function onPosition(evt) {
        const lat = +evt.coords.latitude.toFixed(6),
            lng = +evt.coords.longitude.toFixed(6),
            acc = +evt.coords.accuracy.toFixed(3);
        setAccuracy(acc);
        if (type === 'geopoint') {
            setValue({
                type: 'Point',
                coordinates: [lng, lat]
            });
        }
        const latFmt = lat > 0 ? lat + '°N' : -lat + '°S',
            lngFmt = lng > 0 ? lng + '°E' : -lng + '°W',
            accFmt =
                acc > 1000
                    ? '~' + Math.round(acc / 1000) + 'km'
                    : acc > 1
                    ? '~' + Math.round(acc) + 'm'
                    : acc + 'm';
        setGpsStatus(`${latFmt} ${lngFmt} (${accFmt})`);
        recenterMap(lat, lng);
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

    const gpsActive = !!gpsWatch;

    return (
        <Fieldset label={label}>
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
            >
                <View style={{ marginRight: 8 }}>
                    <Toggle name={name + '_method'} choices={methods} />
                </View>
                {method === 'gps' && (
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
                )}
                {method === 'geocode' && (
                    <>
                        <Input
                            name={name + '_address'}
                            label="Address"
                            helperText={
                                geocodeStatus || 'Enter address or city name'
                            }
                        />
                        <IconButton
                            onClick={geocode}
                            icon="search"
                            color="secondary"
                        />
                    </>
                )}
                {method === 'manual' && (
                    <>
                        <Input
                            name={name + '_latitude'}
                            label="Latitude"
                            type="decimal"
                            inputProps={{
                                step: 0.000001,
                                min: -90,
                                max: 90
                            }}
                            InputLabelProps={{
                                shrink: true
                            }}
                            style={{ marginRight: 4 }}
                        />
                        <Input
                            name={name + '_longitude'}
                            label="Longitude"
                            type="decimal"
                            inputProps={{
                                step: 0.000001,
                                min: -180,
                                max: 180
                            }}
                            InputLabelProps={{
                                shrink: true
                            }}
                            style={{ marginLeft: 4 }}
                        />
                        <IconButton
                            onClick={saveLatLong}
                            icon="search"
                            variant="filled"
                            color="secondary"
                        />
                    </>
                )}
            </View>
            <AutoMap containerStyle={{ minHeight: 400 }}>
                <Draw type={drawType} data={geojson} setData={handleChange} />
            </AutoMap>
        </Fieldset>
    );
}

Geo.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string
};

export function flatten(geojson) {
    var geoms = [];
    if (geojson.type === 'FeatureCollection') {
        geojson.features.forEach(function (feature) {
            addGeometry(feature.geometry);
        });
    } else if (geojson.type === 'Feature') {
        addGeometry(geojson.geometry);
    } else {
        addGeometry(geojson);
    }

    if (geoms.length == 1) {
        return geoms[0];
    } else {
        return {
            type: 'GeometryCollection',
            geometries: geoms
        };
    }
    function addGeometry(geometry) {
        if (geometry.type == 'GeometryCollection') {
            geometry.geometries.forEach(addGeometry);
        } else {
            geoms.push(geometry);
        }
    }
}

export function useFeatureCollection(value) {
    return useMemo(() => {
        return asFeatureCollection(value);
    }, [value]);
}

function asFeatureCollection(geojson) {
    if (typeof geojson === 'string') {
        try {
            geojson = JSON.parse(geojson);
        } catch (e) {
            geojson = null;
        }
    }
    if (!geojson || !geojson.type) {
        return geojson;
    }
    const geometry = flatten(geojson);

    let features;
    if (geometry.type === 'GeometryCollection') {
        features = geometry.geometries.map(geometry => ({
            type: 'Feature',
            properties: {},
            geometry
        }));
    } else {
        features = [
            {
                type: 'Feature',
                properties: {},
                geometry
            }
        ];
    }

    return {
        type: 'FeatureCollection',
        features
    };
}
