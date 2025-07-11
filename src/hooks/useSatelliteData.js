// src/hooks/useSatelliteData.js
import { useState, useEffect } from "react";
import axios from "axios";
import * as satellite from "satellite.js";

export default function useSatelliteData() {
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Step 1: Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.warn("Geolocation failed, using Tirupati as fallback");
        setUserLocation({ lat: 13.6288, lng: 79.4192 }); // Fallback
      }
    );
  }, []);

  // Step 2: Fetch and process satellite data
  useEffect(() => {
    if (!userLocation) return;

    async function fetchData() {
      try {
        const response = await axios.get("http://localhost:3001/api/tle");
        const tleData = response.data;

        const now = new Date();
        const userLat = userLocation.lat;
        const userLng = userLocation.lng;

        const sats = tleData.map((s) => {
          if (!s.line1 || !s.line2) return null;

          const satrec = satellite.twoline2satrec(s.line1, s.line2);
          const pv = satellite.propagate(satrec, now);
          if (!pv?.position) return null;

          const gmst = satellite.gstime(now);
          const geo = satellite.eciToGeodetic(pv.position, gmst);

          const lat = satellite.degreesLat(geo.latitude);
          const lng = satellite.degreesLong(geo.longitude);

          // Next pass prediction
          let nextPassTime = null;
          for (let minutes = 0; minutes < 1440; minutes++) {
            const future = new Date(now.getTime() + minutes * 60000);
            const futurePv = satellite.propagate(satrec, future);
            if (!futurePv?.position) continue;

            const futureGeo = satellite.eciToGeodetic(
              futurePv.position,
              satellite.gstime(future)
            );
            const futureLat = satellite.degreesLat(futureGeo.latitude);
            const futureLng = satellite.degreesLong(futureGeo.longitude);

            const latDiff = Math.abs(futureLat - userLat);
            const lngDiff = Math.abs(futureLng - userLng);

            if (latDiff < 1 && lngDiff < 1) {
              nextPassTime = future.toLocaleString();
              break;
            }
          }

          return {
            name: s.name,
            norad: s.norad,
            country: s.country || "Unknown",
            line1: s.line1,
            line2: s.line2,
            position: {
              lat,
              lng,
              alt: geo.height, // in km
            },
            overIndia: lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98,
            type: s.type || "Unknown",
            nextPass: nextPassTime || "No pass today",
            visibleFromUser:
              Math.abs(lat - userLat) < 5 && Math.abs(lng - userLng) < 5,
          };
        }).filter(Boolean); // remove nulls

        setSatellites(sats);
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);

       
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userLocation]);

  return { satellites, loading, error, userLocation };
}
