// src/utils/satelliteUtils.js

export const parseTLEData = (tleText) => {
  const lines = tleText.trim().split("\n");
  const satellites = [];

  for (let i = 0; i < lines.length; i += 3) {
    satellites.push({
      name: lines[i],
      line1: lines[i + 1],
      line2: lines[i + 2],
    });
  }

  return satellites;
};
