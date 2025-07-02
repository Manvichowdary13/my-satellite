// src/App.jsx
import React, { useState } from "react";
import MapSwitcher from "./components/MapSwitcher";
import CesiumViewer from "./components/CesiumViewer";
import MapLibreMap from "./components/MapLibreMap";
import SatelliteFilter from "./components/SatelliteFilter";
import SatelliteInfoPanel from "./components/SatelliteInfoPanel";
import useSatelliteData from "./hooks/useSatelliteData";
import useOverpassPrediction from "./hooks/useOverpassPrediction";
import OverpassPanel from "./components/overpassPanel";

import "./App.css";
import "cesium/Widgets/widgets.css";

export default function App() {
  const [mapType, setMapType] = useState("cesium");
  const [searchText, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [orbitType, setOrbitType] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [selectedSat, setSelectedSat] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 13.6288, lng: 79.4192 }); // Tirupati

  const { satellites, loading, error } = useSatelliteData();
  const overpasses = useOverpassPrediction(
    selectedSat,
    userLocation.lat,
    userLocation.lng
  );

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

  return (
    <div className="app-container">
      <MapSwitcher currentMap={mapType} onSwitch={setMapType} />

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

      <div className="map-container">
        {mapType === "cesium" ? (
          <CesiumViewer
            satellites={filtered}
            onSelect={setSelectedSat}
            selectedSat={selectedSat}
          />
        ) : (
          <MapLibreMap
            satellites={filtered}
            onSelect={setSelectedSat}
            selectedSat={selectedSat}
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


      </div>
    </div>
  );
}