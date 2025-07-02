// src/components/MapSwitcher.jsx
import React from "react";
import PropTypes from "prop-types";

export default function MapSwitcher({ currentMap, onSwitch }) {
  return (
    <div className="map-switcher">
      <button
        className={currentMap === "cesium" ? "active" : ""}
        onClick={() => onSwitch("cesium")}
      >
        🌍 Cesium 3D
      </button>
      <button
        className={currentMap === "maplibre" ? "active" : ""}
        onClick={() => onSwitch("maplibre")}
      >
        🗺️ 2D Map
      </button>
    </div>
  );
}

MapSwitcher.propTypes = {
  currentMap: PropTypes.string.isRequired,
  onSwitch: PropTypes.func.isRequired,
};
