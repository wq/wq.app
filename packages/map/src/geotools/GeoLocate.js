import React, { useState, useEffect, useRef } from "react";
import { useComponents, Message } from "@wq/react";
import PropTypes from "prop-types";

export default function GeoLocate({ type, setLocation, value, accuracy }) {
    const { Button, Typography, useGeolocation } = useComponents(),
        geolocation = useGeolocation(),
        [gpsStatus, setGpsStatus] = useState(""),
        gpsWatch = useRef();

    async function startGps() {
        if (gpsWatch.current) {
            return;
        }
        if (!geolocation.supported) {
            setGpsStatus("Geolocation not supported");
            return;
        }
        const watchId = await geolocation.watchPosition(onPosition, onError, {
            enableHighAccuracy: true,
            timeout: 60 * 1000,
        });

        gpsWatch.current = watchId;
        setGpsStatus("Determining location...");
    }

    function onPosition(evt) {
        const lat = +evt.coords.latitude.toFixed(6),
            lng = +evt.coords.longitude.toFixed(6),
            acc = +evt.coords.accuracy.toFixed(3);
        setLocation({
            longitude: lng,
            latitude: lat,
            accuracy: acc,
            zoom: true,
            save: type === "geopoint",
        });

        setGpsStatus(formatLoc(lat, lng, acc));
    }

    function onError(error) {
        setGpsStatus(error.message);
        stopGps();
    }

    function stopGps() {
        if (gpsWatch.current) {
            geolocation.clearWatch(gpsWatch.current);
        }
        gpsWatch.current = null;
    }

    function resetGps() {
        stopGps();
        setGpsStatus("");
    }

    useEffect(() => {
        return () => stopGps();
    }, []);

    const gpsActive = !!gpsWatch.current,
        valueStatus =
            value &&
            value.type === "Point" &&
            value.coordinates &&
            formatLoc(value.coordinates[1], value.coordinates[0], accuracy);

    return (
        <>
            <Typography
                style={{
                    marginRight: 8,
                    flex: 1,
                    textAlign: "center",
                }}
                color="textSecondary"
            >
                {gpsStatus || valueStatus || ""}
            </Typography>
            <Button
                icon={gpsActive ? "gps-stop" : "gps-start"}
                style={{ minWidth: 140 }}
                variant={gpsActive ? "contained" : "outlined"}
                color="secondary"
                onClick={gpsActive ? resetGps : startGps}
            >
                <Message id={gpsActive ? "GEO_STOP_GPS" : "GEO_START_GPS"} />
            </Button>
        </>
    );
}

GeoLocate.toolLabel = "Current";

GeoLocate.propTypes = {
    type: PropTypes.string,
    setLocation: PropTypes.func,
    value: PropTypes.object,
    accuracy: PropTypes.number,
};

function formatLoc(lat, lng, acc) {
    const latFmt = lat > 0 ? lat + "°N" : -lat + "°S",
        lngFmt = lng > 0 ? lng + "°E" : -lng + "°W",
        accFmt =
            acc > 1000
                ? " (~" + Math.round(acc / 1000) + "km)"
                : acc > 1
                ? " (~" + Math.round(acc) + "m)"
                : acc
                ? " (" + acc + "m)"
                : "";
    return `${latFmt} ${lngFmt}${accFmt}`;
}
