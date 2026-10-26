// src/components/IssueMap.jsx
import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

const IssueMap = ({ issues }) => {
  // Default center (Change this to your city's Lat/Lng)
  const defaultPosition = [12.9716, 77.5946]; 

  const getPinColor = (severity) => {
    switch (severity) {
      case 'Critical': return { color: 'red', fillColor: '#f03' };
      case 'High': return { color: 'orange', fillColor: '#fd7e14' };
      case 'Medium': return { color: 'gold', fillColor: '#ffc107' };
      default: return { color: 'green', fillColor: '#198754' };
    }
  };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0">
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        {/* Free OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {issues.map((issue) => {
          // Ensure location exists before rendering
          if (!issue.location) return null;

          const styles = getPinColor(issue.aiAnalysis?.severity);

          return (
            <CircleMarker 
              key={issue.id}
              center={[issue.location.lat, issue.location.lng]}
              pathOptions={styles}
              radius={10}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="block text-base mb-1">{issue.aiAnalysis?.category}</strong>
                  <p className="mb-2">{issue.aiAnalysis?.summary}</p>
                  <span className={`px-2 py-1 rounded text-white text-xs ${
                    issue.aiAnalysis?.severity === 'Critical' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {issue.aiAnalysis?.severity}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default IssueMap;