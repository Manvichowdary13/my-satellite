import React, {
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Viewer, Entity, PolylineGraphics } from "resium";
import {
  Ion,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
  Math as CesiumMath,
} from "cesium";
import PropTypes from "prop-types";
import * as satellite from "satellite.js";
import {
  PolylineGlowMaterialProperty,
  // optionally, PolylineDashMaterialProperty
} from "cesium";


Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

const CesiumViewer = forwardRef(
  (
    {
      satellites,
      onSelect,
      selectedSat,
      userLocation,
      showGroundLinks,
      filterMode = "all",
    },
    ref
  ) => {
    const viewerRef = useRef(null);
    const [selectedGroundStation, setSelectedGroundStation] = useState(null);
    const [livePositions, setLivePositions] = useState({});
    const [nearbySats, setNearbySats] = useState([]);
    const [showPopup, setShowPopup] = useState(false);

    const maxDistanceKm = 2000;

    const INDIA_BOUNDS = {
      minLat: 6,
      maxLat: 37,
      minLng: 68,
      maxLng: 98,
    };

    useEffect(() => {
      const updatePositions = () => {
        const newPositions = {};
        const now = new Date();

        satellites.forEach((sat) => {
          if (!sat.line1 || !sat.line2) return;

          const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
          const positionAndVelocity = satellite.propagate(satrec, now);
          const gmst = satellite.gstime(now);
          const geo = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

          newPositions[sat.name] = {
            lat: satellite.degreesLat(geo.latitude),
            lng: satellite.degreesLong(geo.longitude),
            alt: geo.height,
          };
        });

        setLivePositions(newPositions);
      };

      updatePositions();
      const interval = setInterval(updatePositions, 1000);
      return () => clearInterval(interval);
    }, [satellites]);

    useEffect(() => {
      if (selectedSat && viewerRef.current?.cesiumElement && livePositions[selectedSat.name]) {
        const viewer = viewerRef.current.cesiumElement;
        const { lat, lng, alt } = livePositions[selectedSat.name];

        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(lng, lat, (alt + 500) * 1000),
          orientation: { heading: 0, pitch: -Math.PI / 4, roll: 0 },
          duration: 2.5,
        });
      }
    }, [selectedSat, livePositions]);

    useEffect(() => {
      if (selectedGroundStation && viewerRef.current?.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        const { lat, lng } = selectedGroundStation;

        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(lng, lat, 30000),
          orientation: { heading: 0, pitch: -Math.PI / 4, roll: 0 },
          duration: 2.5,
        });
      }
    }, [selectedGroundStation]);

    useImperativeHandle(ref, () => ({
      flyToUserLocation: () => {
        if (viewerRef.current?.cesiumElement && userLocation) {
          const viewer = viewerRef.current.cesiumElement;

          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(userLocation.lng, userLocation.lat, 50000),
            duration: 2.2,
            orientation: { heading: 0, pitch: -Math.PI / 5, roll: 0 },
          });

          const nearby = [];
          Object.entries(livePositions).forEach(([name, pos]) => {
            const dist = getDistanceKm(pos.lat, pos.lng, userLocation.lat, userLocation.lng);
            if (dist <= 500) {
              nearby.push({ name, ...pos });
            }
          });

          setNearbySats(nearby);
          setShowPopup(true);
        }
      },
    }));

    const orbitPositions = useMemo(() => {
      if (!selectedSat?.line1 || !selectedSat?.line2) return [];

      const satrec = satellite.twoline2satrec(selectedSat.line1, selectedSat.line2);
      const now = new Date();
      const points = [];

      for (let i = 0; i <= 90; i++) {
        const time = new Date(now.getTime() + i * 60 * 1000);
        const posVel = satellite.propagate(satrec, time);
        const gmst = satellite.gstime(time);
        const geo = satellite.eciToGeodetic(posVel.position, gmst);

        const lat = satellite.degreesLat(geo.latitude);
        const lng = satellite.degreesLong(geo.longitude);
        const alt = geo.height;

        points.push(Cartesian3.fromDegrees(lng, lat, alt * 1000));
      }

      return points;
    }, [selectedSat]);

    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = CesiumMath.toRadians(lat2 - lat1);
      const dLon = CesiumMath.toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(CesiumMath.toRadians(lat1)) *
          Math.cos(CesiumMath.toRadians(lat2)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const groundStations = [
      { name: "ISRO Telemetry, Tracking and Command Network (ISTRAC)", lat: 13.03, lng: 77.58, purpose: "Telemetry, Tracking and Command (TTC)", band: "S/X Band", url: "https://www.isro.gov.in/ISTRAC.html" },
      { name: "Sriharikota Range (SHAR)", lat: 13.7, lng: 80.2, purpose: "Launch Vehicle Tracking and Telemetry", band: "S/Ka Band", url: "https://www.isro.gov.in/SDSC.html" },
      { name: "Lucknow Ground Station", lat: 26.85, lng: 80.95, purpose: "Remote Sensing Satellite Data Reception", band: "X Band", url: "https://www.nrsc.gov.in/" },
      { name: "Port Blair Ground Station", lat: 11.62, lng: 92.72, purpose: "Launch phase tracking support", band: "S Band", url: "https://www.isro.gov.in/" },
      { name: "Bhopal Ground Station", lat: 23.25, lng: 77.41, purpose: "Data Reception and Dissemination", band: "X Band", url: "https://www.nrsc.gov.in/" },
      { name: "Shadnagar Ground Station", lat: 17.07, lng: 78.2, purpose: "National Remote Sensing Centre", band: "X/Ka Band", url: "https://www.nrsc.gov.in/" },
      { name: "Hassan Ground Station", lat: 13.0, lng: 76.1, purpose: "INSAT/GSAT Satellite Reception", band: "S/X Band", url: "https://www.isro.gov.in/" },
      { name: "Dehradun Ground Station", lat: 30.3165, lng: 78.0322, purpose: "Cartosat Data Reception", band: "X Band", url: "https://www.nrsc.gov.in/" },
    ];

   const groundLinks = useMemo(() => {
  const links = [];

  satellites.forEach((sat, idx) => {
    const pos = livePositions[sat.name];
    if (!pos) return;
    const { lat, lng, alt } = pos;

    groundStations.forEach((station) => {
      const dist = getDistanceKm(lat, lng, station.lat, station.lng);
      if (dist <= maxDistanceKm) {
        links.push({
          id: `link-${idx}-${station.name}`,
          positions: [
            Cartesian3.fromDegrees(lng, lat, alt * 1000),
            Cartesian3.fromDegrees(station.lng, station.lat, 0),
          ],
          description: `
            <b>Satellite:</b> ${sat.name}<br/>
            <b>Ground Station:</b> ${station.name}<br/>
            <b>Distance:</b> ${dist.toFixed(1)} km
          `,
        });
      }
    });
  });

  return links;
}, [satellites, groundStations, livePositions]);

    if (!satellites.length) {
      return <div className="cesium-loading">Loading satellites…</div>;
    }

    return (
      <>
        <Viewer
          full
          ref={viewerRef}
          baseLayerPicker={false}
          timeline={false}
          animation={false}
          infoBox={true}
          selectionIndicator={true}
        >
          {/* 🛰️ Satellite Entities */}
          {satellites.map((sat, i) => {
            const pos = livePositions[sat.name];
            if (!pos) return null;

            const { lat, lng, alt } = pos;
            const isInIndia =
              lat >= INDIA_BOUNDS.minLat &&
              lat <= INDIA_BOUNDS.maxLat &&
              lng >= INDIA_BOUNDS.minLng &&
              lng <= INDIA_BOUNDS.maxLng;

            if (filterMode === "india" && !isInIndia) return null;

            return (
              <Entity
                key={i}
                name={sat.name}
                onClick={() => onSelect(sat)}
                position={Cartesian3.fromDegrees(lng, lat, alt * 1000)}
                point={{ pixelSize: 8, color: Color.YELLOW }}
                label={{
                  text: "🛰️",
                  font: "18px sans-serif",
                  style: LabelStyle.FILL_AND_OUTLINE,
                  fillColor: Color.ASH,
                  outlineColor: Color.BLACK,
                  outlineWidth: 2,
                  verticalOrigin: VerticalOrigin.BOTTOM,
                  pixelOffset: new Cartesian2(0, -20),
                }}
              />
            );
          })}

          {/* 🌀 Orbit Path */}
          {selectedSat && orbitPositions.length > 0 && filterMode === "india" && (
            <Entity name={`${selectedSat.name}-orbit-path`}>
              <PolylineGraphics positions={orbitPositions} width={2} material={Color.CYAN} />
            </Entity>
          )}

          {/* 🗼 Ground Stations */}
          {groundStations.map((station, index) => (
            <Entity
              key={`ground-station-${index}`}
              name={station.name}
              position={Cartesian3.fromDegrees(station.lng, station.lat, 0)}
              point={{ pixelSize: 10, color: Color.RED }}
              label={{
                text: `🗼 ${station.name}`,
                font: "14px sans-serif",
                style: LabelStyle.FILL_AND_OUTLINE,
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 1.5,
                verticalOrigin: VerticalOrigin.CENTER,
                pixelOffset: new Cartesian2(15, 0),
              }}
              description={`<strong>${station.name}</strong><br/>
                <b>Coordinates:</b> ${station.lat.toFixed(3)}, ${station.lng.toFixed(3)}<br/>
                <b>Purpose:</b> ${station.purpose}<br/>
                <b>Frequency Band:</b> ${station.band}<br/>
                <b>More Info:</b> <a href="${station.url}" target="_blank">${station.url}</a>`}
              onClick={() => setSelectedGroundStation(station)}
            />
          ))}

          {/* 📍 User Location */}
          {userLocation && (
            <>
            <Entity
  name="User Location"
  position={Cartesian3.fromDegrees(userLocation.lng, userLocation.lat, 0)}
  label={{
    text: " 📍 You",
    font: "20px sans-serif",
    style: LabelStyle.FILL_AND_OUTLINE,
    fillColor: Color.RED,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    verticalOrigin: VerticalOrigin.BOTTOM,
    pixelOffset: new Cartesian2(0, -30),
  }}
/>

              {nearbySats.length > 0 && (
                <Entity
                  name="Nearby Satellites"
                  position={Cartesian3.fromDegrees(userLocation.lng, userLocation.lat, 0)}
                  label={{
                    text: `🧭 Satellites in 500km:\n${nearbySats.map(s => s.name).join(", ")}`,
                    font: "14px sans-serif",
                    fillColor: Color.WHITE,
                    style: LabelStyle.FILL_AND_OUTLINE,
                    outlineColor: Color.BLACK,
                    outlineWidth: 1,
                    verticalOrigin: VerticalOrigin.TOP,
                    pixelOffset: new Cartesian2(0, -50),
                  }}
                />
              )}
            </>
          )}
{showGroundLinks &&
  groundLinks.map((link) => (
    <Entity
      key={link.id}
      name={`Link: ${link.id}`}
      description={link.description}
    >
      <PolylineGraphics
        positions={link.positions}
        width={3}
        material={
          new PolylineGlowMaterialProperty({
            glowPower: 0.15,
            color: Color.SKYBLUE.withAlpha(0.8),
          })
        }
      />
    </Entity>
  ))}

        </Viewer>

        {/* 📦 Satellite Popup */}
   {showPopup && nearbySats.length > 0 && (
  <div className="satellite-popup">
    <div className="popup-header">
      <h4>🛰 Satellites Within 500km</h4>
      <button className="popup-close" onClick={() => setShowPopup(false)}>✖</button>
    </div>
    <ul className="popup-list">
      {nearbySats.map((sat, idx) => (
        <li key={idx}>{sat.name}</li>
      ))}
    </ul>
  </div>
)}

      </>
    );
  }
);

CesiumViewer.propTypes = {
  satellites: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  selectedSat: PropTypes.object,
  userLocation: PropTypes.object,
  showGroundLinks: PropTypes.bool,
  filterMode: PropTypes.oneOf(["all", "india"]),
};

export default CesiumViewer;
