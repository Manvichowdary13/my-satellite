// src/components/SatelliteInfoPanel.jsx
import React from "react";
import PropTypes from "prop-types";

export default function SatelliteInfoPanel({ satellite, onClose }) {
  if (!satellite) return null;
  const { name, country, type, position } = satellite;

  return (
    <div className="sat-info-panel">
      <button className="close-btn" onClick={onClose}>✖</button>
      <h2>{name}</h2>
      <p><strong>Country:</strong> {country}</p>
      <p><strong>Orbit:</strong> {type}</p>
      <p><strong>Latitude:</strong> {position.lat.toFixed(2)}°</p>
      <p><strong>Longitude:</strong> {position.lng.toFixed(2)}°</p>
      <p><strong>Altitude:</strong> {position.alt.toFixed(2)} km</p>

      {/* ✅ Visibility Section */}
      <p>
        <strong>Visibility:</strong>{" "}
        {satellite.visibility ? (
          satellite.visibility.visibleNow ? (
            <span style={{ color: "green" }}>
              ✅ Visible Now (Elev: {satellite.visibility.elevation}°)
            </span>
          ) : (
            <span style={{ color: "gray" }}>❌ Not Visible</span>
          )
        ) : (
          <span style={{ color: "gray" }}>Unknown</span>
        )}
      </p>
    </div>
  );
}

SatelliteInfoPanel.propTypes = {
  satellite: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
