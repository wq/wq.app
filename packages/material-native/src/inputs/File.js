import React, { useState } from "react";
import { useField } from "formik";
import { useComponents } from "@wq/react";
import { View, Text } from "react-native";
import { Button, List, Menu } from "react-native-paper";
import * as Application from "expo-application";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { format } from "./date-utils.js";
import HelperText from "./HelperText.js";
import PropTypes from "prop-types";

export default function File({ name, accept, capture, required, label, hint }) {
    const [, { value }, { setValue }] = useField(name),
        [imageOpen, setImageOpen] = useState(false),
        [menuOpen, setMenuOpen] = useState(false),
        { Img, Popup } = useComponents(),
        acceptImage = accept && accept.startsWith("image/"),
        showImage = () => setImageOpen(true),
        hideImage = () => setImageOpen(false),
        showMenu = () => setMenuOpen(true),
        hideMenu = () => setMenuOpen(false);

    async function handleFile(mode) {
        const value = await mode(accept, capture);
        if (value || mode === clear) {
            setValue(value);
        }
        hideMenu();
    }

    const modes = capture
        ? [takePhoto]
        : acceptImage
        ? [takePhoto, pickFile]
        : [pickFile];

    if (value && !required) {
        modes.push(clear);
    }

    return (
        <View>
            {label && <List.Subheader>{label}</List.Subheader>}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 8,
                }}
            >
                {isImage(value) && (
                    <Img
                        onPress={showImage}
                        style={{ width: 64, height: 64 }}
                        src={typeof value === "string" ? value : value.uri}
                    />
                )}
                {value && !isImage(value) && <List.Icon icon="attachment" />}
                <Text style={{ flex: 1, padding: 8 }}>
                    {value ? value.name : "No file selected"}
                </Text>
                <Menu
                    visible={menuOpen}
                    onDismiss={hideMenu}
                    anchor={
                        <Button
                            onPress={
                                modes.length > 1
                                    ? showMenu
                                    : () => handleFile(modes[0])
                            }
                            icon={value ? "pencil" : "plus"}
                            mode="contained-tonal"
                        >
                            {value
                                ? "Change"
                                : capture
                                ? "Add Photo"
                                : acceptImage
                                ? "Add Image"
                                : "Add File"}
                        </Button>
                    }
                >
                    {modes.map((mode) => (
                        <Menu.Item
                            key={mode.icon}
                            onPress={() => handleFile(mode)}
                            leadingIcon={mode.icon}
                            title={mode.label}
                        />
                    ))}
                </Menu>
            </View>
            <HelperText name={name} hint={hint} />
            <Popup open={value && imageOpen} onClose={hideImage}>
                <Img
                    onPress={hideImage}
                    resizeMode="contain"
                    style={{
                        width: "90%",
                        height: "90%",
                        margin: "5%",
                    }}
                    src={typeof value === "string" ? value : value && value.uri}
                />
            </Popup>
        </View>
    );
}
File.propTypes = {
    name: PropTypes.string,
    accept: PropTypes.string,
    capture: PropTypes.string,
    required: PropTypes.bool,
    label: PropTypes.string,
    hint: PropTypes.string,
};

function isImage(value) {
    if (typeof value === "string") {
        return IMAGE_EXTENSIONS.some((ext) =>
            value.toLowerCase().endsWith(ext)
        );
    } else {
        return (
            value && value.type && value.type.startsWith("image/") && value.uri
        );
    }
}

function generateName() {
    const appName = Application.applicationName.replace(/ /, ""),
        timestamp = new Date(),
        date = format.date(timestamp).replace(/-/g, ""),
        time = format.time(timestamp).replace(/:/g, "");
    return `${appName}_${date}_${time}.jpg`;
}

async function pickFile(accept) {
    const result = await DocumentPicker.getDocumentAsync({ type: accept });
    if (result.assets && result.assets.length > 0) {
        const { name, mimeType: type, uri } = result.assets[0];
        return { name, type, uri };
    }
}
pickFile.icon = "folder";
pickFile.label = "Pick File";

async function takePhoto(accept, capture) {
    const options = {};
    if (capture) {
        options.cameraType =
            capture === "user"
                ? ImagePicker.CameraType.front
                : ImagePicker.CameraType.back;
    }
    const result = await ImagePicker.launchCameraAsync(options);
    if (result.assets && result.assets.length > 0) {
        const name = generateName(),
            type = "image/jpeg",
            { uri } = result.assets[0];
        return { name, type, uri };
    }
}
takePhoto.icon = "camera";
takePhoto.label = "Take Photo";

function clear() {
    return null;
}
clear.icon = "delete";
clear.label = "Remove";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif"];
