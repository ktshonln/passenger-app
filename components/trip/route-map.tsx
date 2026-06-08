/**
 * RouteMap — OpenStreetMap via Leaflet in a WebView.
 * Shows the full route line, all stops as markers, and highlights
 * the selected boarding (blue) and alighting (green) stops.
 */

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

export interface MapStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order?: number;
}

interface Props {
  origin: MapStop;
  destination: MapStop;
  stops?: MapStop[];
  boardingStopId?: string | null;
  alightingStopId?: string | null;
  height?: number;
}

export function RouteMap({
  origin,
  destination,
  stops = [],
  boardingStopId,
  alightingStopId,
  height = 220,
}: Props) {
  const html = useMemo(() => {
    // Build ordered list: origin → intermediate stops → destination
    const allStops: MapStop[] =
      stops.length >= 2
        ? stops
        : [origin, ...stops, destination].filter(
            (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i,
          );

    // Center map on midpoint
    const lats = allStops.map((s) => s.lat);
    const lngs = allStops.map((s) => s.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Build markers JSON
    const markers = allStops.map((s) => {
      const isBoarding = s.id === boardingStopId;
      const isAlighting = s.id === alightingStopId;
      const isOrigin = s.id === origin.id && !boardingStopId;
      const isDest = s.id === destination.id && !alightingStopId;

      let color = "#6A717D";
      let size = 10;
      let zIndex = 1;
      let label = "";

      if (isBoarding) {
        color = "#0A4370";
        size = 16;
        zIndex = 10;
        label = "🧍";
      } else if (isAlighting) {
        color = "#38A169";
        size = 16;
        zIndex = 10;
        label = "🏁";
      } else if (isOrigin) {
        color = "#0A4370";
        size = 14;
        zIndex = 5;
      } else if (isDest) {
        color = "#38A169";
        size = 14;
        zIndex = 5;
      }

      return {
        lat: s.lat,
        lng: s.lng,
        name: s.name,
        color,
        size,
        zIndex,
        label,
      };
    });

    // Polyline coords
    const polyline = allStops.map((s) => [s.lat, s.lng]);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker {
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; border: 2.5px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 10px; color: #fff; font-weight: 800;
    }
    .stop-label {
      background: white; border: 1.5px solid #CBD5E0; border-radius: 6px;
      padding: 2px 6px; font-size: 10px; font-weight: 700; color: #1A202C;
      white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: false })
    .setView([${centerLat}, ${centerLng}], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(map);

  // Markers
  var markers = ${JSON.stringify(markers)};
  markers.forEach(function(m) {
    var icon = L.divIcon({
      className: '',
      html: '<div class="custom-marker" style="width:' + m.size + 'px;height:' + m.size + 'px;background:' + m.color + '">' + (m.label || '') + '</div>',
      iconSize: [m.size, m.size],
      iconAnchor: [m.size/2, m.size/2],
      popupAnchor: [0, -m.size/2]
    });
    L.marker([m.lat, m.lng], { icon: icon, zIndexOffset: m.zIndex * 100 })
      .addTo(map)
      .bindPopup('<div class="stop-label">' + m.name + '</div>');
  });

  // Fetch actual road route from OSRM
  var coords = ${JSON.stringify(polyline)};
  if (coords.length > 1) {
    var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/';
    var query = coords.map(c => c[1] + ',' + c[0]).join(';');
    
    fetch(osrmUrl + query + '?overview=full&geometries=geojson')
      .then(response => response.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          var routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          var roadLine = L.polyline(routeCoords, {
            color: '#0A4370', weight: 5, opacity: 0.9,
            lineJoin: 'round'
          }).addTo(map);
          
          map.fitBounds(roadLine.getBounds(), { padding: [30, 30] });
        } else {
          // Fallback to straight line if OSRM fails
          L.polyline(coords, { color: '#0A4370', weight: 4, opacity: 0.8 }).addTo(map);
          map.fitBounds(L.latLngBounds(coords), { padding: [24, 24] });
        }
      })
      .catch(err => {
        // Fallback to straight line
        L.polyline(coords, { color: '#0A4370', weight: 4, opacity: 0.8 }).addTo(map);
        map.fitBounds(L.latLngBounds(coords), { padding: [24, 24] });
      });
  }
</script>
</body>
</html>`;
  }, [origin, destination, stops, boardingStopId, alightingStopId]);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        onMessage={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
});
