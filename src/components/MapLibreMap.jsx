// src/components/MapLibreMap.jsx
import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import PropTypes from "prop-types";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({ satellites, onSelect }) {
  const mapRef = useRef();

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 0],
      zoom: 1.5,
    });

    satellites.forEach((sat) => {
      const el = document.createElement("div");
      el.innerText = "🛰️";
      el.style.cursor = "pointer";
      el.addEventListener("click", () => onSelect?.(sat));

      new maplibregl.Marker({ element: el })
        .setLngLat([sat.position.lng, sat.position.lat])
        .setPopup(new maplibregl.Popup().setText(sat.name))
        .addTo(map);
    });

    return () => map.remove();
  }, [satellites, onSelect]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

MapLibreMap.propTypes = {
  satellites: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
};
