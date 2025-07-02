// src/utils/visibilityUtils.js
import * as satellite from "satellite.js";

export function getVisibleSatellites(
  satList,
  userLat,
  userLng,
  userAlt = 0,
  minElevationDeg = 0
) {
  const observerGd = {
    latitude: satellite.degreesToRadians(userLat),
    longitude: satellite.degreesToRadians(userLng),
    height: userAlt, // in kilometers
  };

  const now = new Date();
  const gmst = satellite.gstime(now);

  return satList.map((sat) => {
    try {
      const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
      const positionAndVelocity = satellite.propagate(satrec, now);

      if (!positionAndVelocity?.position) {
        console.warn("No position data for", sat.name);
        return { ...sat, visibility: null };
      }

      const positionEcf = satellite.eciToEcf(positionAndVelocity.position, gmst);
      const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

      const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation);
      const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth);
      const isVisible = elevationDeg >= minElevationDeg;

      // ✅ Log visibility check
      console.log(
        `Checking visibility for ${sat.name}`,
        `→ Elevation: ${elevationDeg.toFixed(1)}°, Azimuth: ${azimuthDeg.toFixed(1)}°, Visible: ${isVisible}`
      );

      return {
        ...sat,
        visibility: {
          elevation: elevationDeg.toFixed(1),
          azimuth: azimuthDeg.toFixed(1),
          visibleNow: isVisible,
        },
      };
    } catch (err) {
      console.error(`Error computing visibility for ${sat.name}:`, err.message);
      return { ...sat, visibility: null };
    }
  });
}
