import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapModal = ({ location, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Extract coordinates from location data
  // Adjust this based on the actual API response format
  const getCoordinates = () => {
    if (location.latitude && location.longitude) {
      return [parseFloat(location.latitude), parseFloat(location.longitude)];
    }
    
    if (location.lat && location.lng) {
      return [parseFloat(location.lat), parseFloat(location.lng)];
    }
    
    if (location.coordinates) {
      return [parseFloat(location.coordinates.lat), parseFloat(location.coordinates.lng)];
    }
    
    // Default to a location (you can change this)
    return [28.6139, 77.2090]; // New Delhi, India
  };

  const coordinates = getCoordinates();
  const isValidCoordinates = coordinates[0] !== 0 && coordinates[1] !== 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Asset Location - {location.containerNo || location.assetId}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Current GPS coordinates and location details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isValidCoordinates ? (
            <div className="space-y-4">
              {/* Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Coordinates</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Latitude:</strong> {coordinates[0].toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Longitude:</strong> {coordinates[1].toFixed(6)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Asset Details</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Asset ID:</strong> {location.assetId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Container:</strong> {location.containerNo || 'N/A'}
                  </p>
                  {location.timestamp && (
                    <p className="text-sm text-gray-600">
                      <strong>Last Updated:</strong> {new Date(location.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapContainer
                  center={coordinates}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  className="z-10"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={coordinates}>
                    <Popup>
                      <div className="text-center">
                        <strong>{location.containerNo || location.assetId}</strong>
                        <br />
                        <span className="text-sm text-gray-600">
                          {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              {/* Additional Information */}
              {location.address && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Address</h3>
                  <p className="text-sm text-blue-800">{location.address}</p>
                </div>
              )}

              {(location.speed || location.heading) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {location.speed && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">Speed</h3>
                      <p className="text-sm text-green-800">{location.speed} km/h</p>
                    </div>
                  )}
                  {location.heading && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900 mb-2">Heading</h3>
                      <p className="text-sm text-purple-800">{location.heading}°</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                  Location Data Unavailable
                </h3>
                <p className="text-yellow-700">
                  The GPS coordinates for this asset are not available or invalid.
                  The device may be offline or in an area with poor GPS reception.
                </p>
                {location.assetId && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Asset ID: {location.assetId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
