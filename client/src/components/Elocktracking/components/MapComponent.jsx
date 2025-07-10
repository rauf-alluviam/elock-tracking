import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography } from "@mui/material";
import truckIcon from "../../../assets/images/truckLong.svg";

// Custom truck icon for the map
const customTruckIcon = L.icon({
  iconUrl: truckIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const MapComponent = ({ locationData, assetData, title = "Current Location" }) => {
  if (!locationData || !assetData) return null;

  return (
    <Box sx={{ p: 2, bgcolor: "success.light", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ height: 400, borderRadius: 1, overflow: "hidden" }}>
        <MapContainer
          center={[locationData.FLatitude, locationData.FLongitude]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          key={`${locationData.FLatitude}-${locationData.FLongitude}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={[locationData.FLatitude, locationData.FLongitude]}
            icon={customTruckIcon}
          >
            <Popup>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {assetData.FVehicleName}
                </Typography>
                <Typography variant="caption" display="block">
                  E-Lock No.: {assetData.FAssetID}
                </Typography>
                <Typography variant="caption" display="block">
                  Speed: {locationData.FSpeed} km/h
                </Typography>
                <Typography variant="caption" display="block">
                  Battery: {locationData.FBattery}%
                </Typography>
                <Typography variant="caption" display="block">
                  Status: {locationData.FOnline === 1 ? "Online" : "Offline"}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        </MapContainer>
      </Box>
    </Box>
  );
};

export default MapComponent;
