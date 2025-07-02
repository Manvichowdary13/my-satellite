import { useState, useEffect } from "react";
import * as satellite from "satellite.js";

function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function useOverpassPrediction(satelliteData, userLat, userLng) {
  const [passes, setPasses] = useState([]);

  useEffect(() => {
    if (!satelliteData?.line1 || !satelliteData?.line2) {
      setPasses([]);
      return;
    }

    const satrec = satellite.twoline2satrec(
      satelliteData.line1,
      satelliteData.line2
    );

    const now = new Date();
    const durationMinutes = 180;
    const stepSeconds = 10;

    const newPasses = [];
    let isOver = false;
    let start = null;

    for (let i = 0; i < durationMinutes * 60; i += stepSeconds) {
      const time = new Date(now.getTime() + i * 1000);
      const gmst = satellite.gstime(time);
      const positionAndVelocity = satellite.propagate(satrec, time);

      if (!positionAndVelocity.position) continue;

      const geo = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
      const lat = satellite.degreesLat(geo.latitude);
      const lon = satellite.degreesLong(geo.longitude);
      const distance = computeDistanceKm(userLat, userLng, lat, lon);

      if (distance < 1000 && !isOver) {
        isOver = true;
        start = time;
      } else if (distance >= 1000 && isOver) {
        isOver = false;
        newPasses.push({ start, end: time });
      }
    }

    setPasses(newPasses);
  }, [satelliteData, userLat, userLng]);

  return passes;
}
