import React from "react";
import PropTypes from "prop-types";

export default function FormatJson({ json }) {
    return (
        <pre>
            <code>{JSON.stringify(json, null, 4)}</code>
        </pre>
    );
}

FormatJson.propTypes = {
    json: PropTypes.object,
};
