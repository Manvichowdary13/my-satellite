import React from "react";
import PropTypes from "prop-types";

export default function SatelliteFilter({
  search,
  setSearch,
  country,
  setCountry,
  type,
  setType,
  filterType,
  setFilterType,
}) {
  return (
    <div className="sat-filter">
      <input
        type="text"
        placeholder="Search satellite…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={country} onChange={(e) => setCountry(e.target.value)}>
        <option>All</option>
        <option>USA</option>
        <option>India</option>
        <option>Russia</option>
      </select>

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option>All</option>
        <option>LEO</option>
        <option>MEO</option>
        <option>GEO</option>
      </select>

      <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
        <option value="all">All Satellites</option>
        <option value="overIndia">Satellites Over India</option>
      </select>
    </div>
  );
}

SatelliteFilter.propTypes = {
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
  country: PropTypes.string.isRequired,
  setCountry: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  setType: PropTypes.func.isRequired,
  filterType: PropTypes.string.isRequired,
  setFilterType: PropTypes.func.isRequired,
};