import React, { useState, useEffect } from "react";
import { useComponents, useInputComponents, usePlugin } from "@wq/react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";

export default function GeoCode({ name, type, setLocation }) {
    const { IconButton } = useComponents(),
        { Input } = useInputComponents(),
        [
            ,
            { value: address },
            { setValue: setAddress, setError: setAddressError },
        ] = useField(name + "_address"),
        [geocodeStatus, setGeocodeStatus] = useState(null),
        { geocoder, geocoderAddress } = usePlugin("map").config,
        { values } = useFormikContext();

    async function geocode() {
        if (!geocoder) {
            setAddressError("No geocoder plugin registered!");
            return;
        }
        setAddressError(null);
        setGeocodeStatus("Looking up location...");
        try {
            const result = await geocoder(address),
                { label, geometry } = result;
            if (geometry) {
                setLocation({
                    latitude: geometry.coordinates[1],
                    longitude: geometry.coordinates[0],
                    zoom: true,
                    save: type === "geopoint",
                });
                setGeocodeStatus(label || "Location found!");
            } else {
                setGeocodeStatus(label || "Not found");
            }
        } catch (e) {
            setAddressError(e.message || "" + e);
            setGeocodeStatus(null);
        }
    }

    useEffect(() => {
        if (address === undefined && geocoderAddress) {
            setDefaultAddress();
        }
        async function setDefaultAddress() {
            setAddress(await geocoderAddress(values));
        }
    }, [address, values]);

    return (
        <>
            <Input
                name={name + "_address"}
                label="Address"
                helperText={geocodeStatus || "Enter address or city name"}
                style={{ flex: 1 }}
            />
            <IconButton onClick={geocode} icon="search" color="secondary" />
        </>
    );
}

GeoCode.toolLabel = "Address";

GeoCode.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    setLocation: PropTypes.func,
};
