// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import { buildModuleUrl } from "cesium";
// tell Cesium where to find its static files:
buildModuleUrl.setBaseUrl("/cesium/");

import 'leaflet/dist/leaflet.css'; // 🗺️ Leaflet styles
import './index.css';              // 🌐 Global app styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
