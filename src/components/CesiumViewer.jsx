import React, { useRef, useEffect, useMemo } from "react";
import { Viewer, Entity, PolylineGraphics } from "resium";
import {
  Ion,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
} from "cesium";
import PropTypes from "prop-types";
import * as satellite from "satellite.js";

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

export default function CesiumViewer({ satellites, onSelect, selectedSat }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (selectedSat && viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      const { lat, lng, alt } = selectedSat.position;

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lng, lat, (alt + 500) * 1000),
        orientation: {
          heading: 0,
          pitch: -Math.PI / 4,
          roll: 0,
        },
        duration: 2.5,
      });
    }
  }, [selectedSat]);

  // ✅ Orbit Path Prediction (future points)
  const orbitPositions = useMemo(() => {
    if (!selectedSat?.line1 || !selectedSat?.line2) return [];

    const satrec = satellite.twoline2satrec(selectedSat.line1, selectedSat.line2);
    const now = new Date();
    const points = [];

    for (let i = 0; i <= 90; i += 1) {
      const time = new Date(now.getTime() + i * 60 * 1000); // every 1 minute
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

  if (!satellites.length) {
    return <div className="cesium-loading">Loading satellites…</div>;
  }

  return (
    <Viewer
      full
      ref={viewerRef}
      baseLayerPicker={false}
      timeline={false}
      animation={false}
      infoBox={false}              // ✅ Disable default Cesium infoBox
  selectionIndicator={false} 
    >
     {satellites
  .filter((sat) => sat?.position?.lat != null && sat?.position?.lng != null)
  .map((sat, i) => (

        <Entity
          key={i}
          name={sat.name}
          onClick={() => onSelect(sat)}
          position={Cartesian3.fromDegrees(
            sat.position.lng,
            sat.position.lat,
            sat.position.alt * 1000
          )}
          point={{ pixelSize: 6, color: Color.YELLOW }}
          label={{
            text: "🛰️",
            font: "20px sans-serif",
            style: LabelStyle.FILL_AND_OUTLINE,
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -20),
          }}
        />
      ))}

      {/* ✅ Orbit Path */}
      {selectedSat && orbitPositions.length > 0 && (
        <Entity name={`${selectedSat.name}-orbit-path`}>
          <PolylineGraphics
            positions={orbitPositions}
            width={2}
            material={Color.CYAN}
          />
        </Entity>
      )}
    </Viewer>
  );
}

CesiumViewer.propTypes = {
  satellites: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  selectedSat: PropTypes.object,
};
