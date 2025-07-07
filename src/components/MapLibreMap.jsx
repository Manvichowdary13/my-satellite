// src/components/MapLibreMap.jsx
import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import maplibregl from "maplibre-gl";
import PropTypes from "prop-types";
import "maplibre-gl/dist/maplibre-gl.css";

const MapLibreMap = forwardRef(({ satellites, onSelect, userLocation }, ref) => {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null); // to store map instance

  // 🔴 Indian Ground Stations (static)
  const groundStations = [
    { name: "ISRO Telemetry, Tracking and Command Network (ISTRAC)", lat: 13.03, lng: 77.58 },
    { name: "Sriharikota Range (SHAR)", lat: 13.7, lng: 80.2 },
    { name: "Lucknow Ground Station", lat: 26.85, lng: 80.95 },
    { name: "Port Blair Ground Station", lat: 11.62, lng: 92.72 },
    { name: "Bhopal Ground Station", lat: 23.25, lng: 77.41 },
    { name: "Shadnagar Ground Station", lat: 17.07, lng: 78.2 },
    { name: "Hassan Ground Station", lat: 13.0, lng: 76.1 },
    { name: "Dehradun Ground Station", lat: 30.3165, lng: 78.0322 }
  ];

  useImperativeHandle(ref, () => ({
    flyToUserLocation: () => {
      if (mapInstanceRef.current && userLocation) {
        mapInstanceRef.current.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 7,
          essential: true,
          speed: 1.2,
          curve: 1.8,
        });
      }
    },
  }));

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [userLocation.lng, userLocation.lat],
      zoom: 3,
    });

    mapInstanceRef.current = map;

    // 🛰️ Add satellite markers (yellow)
    satellites.forEach((sat) => {
      if (!sat.position?.lat || !sat.position?.lng) return;

      const el = document.createElement("div");
      el.innerText = "🛰️";
      el.style.cursor = "pointer";
      el.style.fontSize = "20px";
      el.style.color = "gold";

      el.addEventListener("click", () => {
        if (onSelect) onSelect(sat);
      });

      new maplibregl.Marker({ element: el })
        .setLngLat([sat.position.lng, sat.position.lat])
        .setPopup(new maplibregl.Popup().setText(sat.name))
        .addTo(map);
    });

    // 🗼 Add ground station markers (red)
    groundStations.forEach((station) => {
      const el = document.createElement("div");
      el.innerText = "🗼";
      el.style.cursor = "default";
      el.style.fontSize = "20px";
      el.style.color = "red";

      new maplibregl.Marker({ element: el })
        .setLngLat([station.lng, station.lat])
        .setPopup(new maplibregl.Popup().setText(station.name))
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [satellites, onSelect, userLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
});

MapLibreMap.propTypes = {
  satellites: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default MapLibreMap;
