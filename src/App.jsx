import React, { useState, useRef, useEffect } from "react";
import MapSwitcher from "./components/MapSwitcher";
import CesiumViewer from "./components/CesiumViewer";
import MapLibreMap from "./components/MapLibreMap";
import SatelliteFilter from "./components/SatelliteFilter";
import SatelliteInfoPanel from "./components/SatelliteInfoPanel";
import useSatelliteData from "./hooks/useSatelliteData";
import useOverpassPrediction from "./hooks/useOverpassPrediction";
import OverpassPanel from "./components/overpassPanel";
import { getVisibleSatellites } from "./utils/visibilityUtils";

import "./App.css";
import "cesium/Widgets/widgets.css";

export default function App() {
  const [mapType, setMapType] = useState("cesium");
  const [searchText, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [orbitType, setOrbitType] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [selectedSat, setSelectedSat] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 13.6288, lng: 79.4192 }); // Default: Tirupati
  const [aboveMeSats, setAboveMeSats] = useState([]);
  const [showAboveMe, setShowAboveMe] = useState(false);

  const cesiumRef = useRef();
  const maplibreRef = useRef();

  const { satellites, loading, error } = useSatelliteData();
  const overpasses = useOverpassPrediction(
    selectedSat,
    userLocation.lat,
    userLocation.lng
  );

  // ✅ Automatically filter satellites above user when data is ready
  useEffect(() => {
    if (!userLocation || satellites.length === 0) return;

    const visible = getVisibleSatellites(
      satellites,
      userLocation.lat,
      userLocation.lng,
      0,
      0 // min elevation
    );

    const filtered = visible.filter((sat) => {
      if (!sat.visibility?.visibleNow) return false;

      if (!sat.position?.lat || !sat.position?.lng) return false;

      const distance = getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        sat.position.lat,
        sat.position.lng
      );

      return distance <= 50;
    });

    setAboveMeSats(filtered);
  }, [userLocation, satellites]);



const handleLocateMe = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setUserLocation(location);

        // Fly to location via ref
        cesiumRef.current?.flyToUserLocation(location);
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
};


  if (loading) return <div className="loading">Loading satellites…</div>;
  if (error) return <div className="error">{error}</div>;

  const filtered = satellites.filter((sat) => {
    const matchesSearch = sat.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCountry = country === "All" || sat.country === country;
    const matchesOrbit = orbitType === "All" || sat.type === orbitType;
    const isOverIndia = sat.overIndia === true;
    const matchesFilterType =
      filterType === "all" ||
      (filterType === "overIndia" && isOverIndia);

    return matchesSearch && matchesCountry && matchesOrbit && matchesFilterType;
  });

  const displaySats = showAboveMe ? aboveMeSats : filtered;

  return (
    <div className="app-container">
      <MapSwitcher currentMap={mapType} onSwitch={setMapType} />
 <div className="top-left-controls">
  <div className="locate-me-container">
    <button onClick={handleLocateMe} className="locate-me-btn">
      📍 Locate Me
    </button>
  </div>

  {selectedSat && (
    <div className="satellite-info-wrapper">
      <div className="sat-info-panel">
        <SatelliteInfoPanel
          satellite={selectedSat}
          passes={overpasses}
          onClose={() => setSelectedSat(null)}
        />
        <OverpassPanel
          passes={overpasses}
          location="Tirupati"
          satelliteName={selectedSat.name}
        />
      </div>
    </div>
  )}
<button
  onClick={() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(80.2, 13.7, 2000000), // Try SHAR for testing
        duration: 2,
      });
    }
  }}
>
  Zoom to SHAR
</button>

  <SatelliteFilter
    search={searchText}
    setSearch={setSearch}
    country={country}
    setCountry={setCountry}
    type={orbitType}
    setType={setOrbitType}
    filterType={filterType}
    setFilterType={setFilterType}
  />
</div>

      <div className="map-container">
        {mapType === "cesium" ? (
          <CesiumViewer
            ref={cesiumRef}
            satellites={displaySats}
            onSelect={setSelectedSat}
            selectedSat={selectedSat}
            userLocation={userLocation}
          />
        ) : (
          <MapLibreMap
            ref={maplibreRef}
            satellites={displaySats}
            onSelect={setSelectedSat}
            selectedSat={selectedSat}
            userLocation={userLocation}
          />
        )}

        {selectedSat && (
          <div className="satellite-info-wrapper">
            <div className="sat-info-panel">
              <SatelliteInfoPanel
                satellite={selectedSat}
                passes={overpasses}
                onClose={() => setSelectedSat(null)}
              />
              <OverpassPanel
                passes={overpasses}
                location="Tirupati"
                satelliteName={selectedSat.name}
              />
            </div>
          </div>
        )}

        {showAboveMe && (
          <div className="above-me-list">
            <h3>🛰️ Satellites Above You (within 50 km)</h3>
            <button className="close-btn" onClick={() => setShowAboveMe(false)}>
              ❌ Close
            </button>
            <ul>
              {aboveMeSats.map((sat) => (
                <li key={sat.name}>
                  {sat.name} - {sat.country || "Unknown"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// 📏 Distance calculator using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
