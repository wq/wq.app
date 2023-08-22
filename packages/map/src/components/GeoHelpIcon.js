import PropTypes from "prop-types";

export default function GeoHelpIcon({ name }) {
    return `{${name}}`;
}

GeoHelpIcon.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
};
