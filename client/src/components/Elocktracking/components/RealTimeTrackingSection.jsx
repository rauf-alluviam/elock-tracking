import React from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Badge,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  RadioButtonChecked as LiveIcon,
  RadioButtonUnchecked as OfflineIcon,
  Wifi as OnlineIcon,
  OfflineBolt as OfflineIconAlt,
  StopCircle as StopIcon,
  CleaningServices as CleaningServicesIcon,
  LocationOn as LocationOnIcon,
  Speed as SpeedIcon,
  BatteryStd as BatteryIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Warning as WarningIcon,
  FlashOn as FlashIcon,
  Satellite as SatelliteIcon,
  CellWifi as CellSignalIcon,
  NetworkCell as NetworkIcon,
  CarRepair as MotorIcon,
  ElectricCar as AccIcon,
  SensorDoor as DoorIcon,
  LocalGasStation as FuelIcon,
  Anchor as AnchorIcon,
  Sensors as SensorIcon,
  DeviceThermostat as ThermostatIcon,
  WaterDrop as HumidityIcon,
  Build as BuildIcon,
  Shield as ShieldIcon,
  Update as UpdateIcon,
  Vibration as ShakeIcon,
  ElectricalServices as VoltageIcon,
  DataUsage as DataIcon,
  Memory as MemoryIcon,
  ControlCamera as ControlsIcon,
  SignalCellular4Bar as StatusIcon,
} from "@mui/icons-material";
import MapComponent from "./MapComponent";

const RealTimeTrackingSection = ({
  isRealTimeConnected,
  realTimeData,
  realTimeUpdates,
  locationData,
  assetData,
  connectToRealTimeTracking,
  disconnectFromRealTimeTracking,
  clearRealTimeUpdates,
}) => {
  return (
    <Box>
      {/* Real-time connection status */}
      <Box
        sx={{
          p: 2,
          bgcolor: isRealTimeConnected ? "success.light" : "warning.light",
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {isRealTimeConnected ? (
            <LiveIcon color="success" />
          ) : (
            <OfflineIcon color="warning" />
          )}
          <Typography variant="h6">
            Real-Time Tracking:{" "}
            {isRealTimeConnected ? "Connected" : "Disconnected"}
          </Typography>
          {isRealTimeConnected && (
            <Chip
              label="LIVE"
              color="success"
              size="small"
              sx={{ animation: "pulse 2s infinite" }}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {isRealTimeConnected
            ? `Receiving live updates from device`
            : `Click to connect for real-time tracking`}
        </Typography>
      </Box>

      {/* Enhanced Real-Time Data Display */}
      {realTimeData && (
        <Box
          sx={{
            p: 2,
            background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
            borderRadius: 2,
            mb: 2,
            border: "2px solid #2196F3",
            position: "relative",
            overflow: "hidden",
          }}
          className="glow-animation"
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            🔍 Live Device Data Analysis
          </Typography>

          <Grid container spacing={3}>
            {/* Location Data */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: 2,
                  p: 2,
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: "success.main" }}>
                  📍 Real-time Location
                </Typography>
                
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOnIcon sx={{ color: "success.main" }} />
                    <Typography variant="caption">Coordinates:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                      {realTimeData.latitude}, {realTimeData.longitude}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SpeedIcon sx={{ color: "warning.main" }} />
                    <Typography variant="caption">Speed:</Typography>
                    <Chip
                      label={`${realTimeData.speed} km/h`}
                      size="small"
                      color={realTimeData.speed > 50 ? "error" : "success"}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BatteryIcon sx={{ color: "info.main" }} />
                    <Typography variant="caption">Battery:</Typography>
                    <Chip
                      label={`${realTimeData.battery}%`}
                      size="small"
                      color={realTimeData.battery > 50 ? "success" : "error"}
                    />
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Device Status */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: "rgba(255, 152, 0, 0.1)",
                  borderRadius: 2,
                  p: 2,
                  border: "1px solid rgba(255, 152, 0, 0.3)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: "warning.main" }}>
                  🔒 Security & Status
                </Typography>

                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {realTimeData.lockStatus === "LOCKED" ? (
                      <LockIcon sx={{ color: "error.main" }} />
                    ) : (
                      <LockOpenIcon sx={{ color: "success.main" }} />
                    )}
                    <Typography variant="caption">Lock Status:</Typography>
                    <Chip
                      label={realTimeData.lockStatus}
                      size="small"
                      color={realTimeData.lockStatus === "LOCKED" ? "error" : "success"}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WarningIcon sx={{ color: "error.main" }} />
                    <Typography variant="caption">Alarm:</Typography>
                    <Chip
                      label={realTimeData.alarm}
                      size="small"
                      color={realTimeData.alarm !== "NORMAL" ? "error" : "success"}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {realTimeData.online ? (
                      <OnlineIcon sx={{ color: "success.main" }} />
                    ) : (
                      <OfflineIconAlt sx={{ color: "error.main" }} />
                    )}
                    <Typography variant="caption">Status:</Typography>
                    <Chip
                      label={realTimeData.online ? "ONLINE" : "OFFLINE"}
                      size="small"
                      color={realTimeData.online ? "success" : "error"}
                    />
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Raw JSON Data */}
            <Grid item xs={12}>
              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.05)",
                  borderRadius: 2,
                  p: 2,
                  border: "1px dashed rgba(0, 0, 0, 0.2)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📝 Raw JSON Data Stream
                </Typography>
                <Box
                  sx={{
                    bgcolor: "black",
                    color: "lime",
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                >
                  <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                    {realTimeData.rawData}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Live Map */}
      {locationData && assetData && (
        <MapComponent
          locationData={locationData}
          assetData={assetData}
          title="🌍 Live Location Map"
        />
      )}

      {/* Real-time Updates Log */}
      <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Live Updates Log - Raw Data Points
        </Typography>
        {realTimeUpdates.length > 0 ? (
          <Paper sx={{ maxHeight: 500, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Basic Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {realTimeUpdates.map((update, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {update.timestamp}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={update.type}
                        color={
                          update.type.includes("alarm")
                            ? "error"
                            : update.type.includes("position")
                            ? "success"
                            : "info"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {update.deviceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" component="div">
                        {update.type.includes("position") && (
                          <div>
                            <div>Lat: {update.latitude?.toFixed(6)}</div>
                            <div>Lng: {update.longitude?.toFixed(6)}</div>
                            <div>Speed: {update.speed} km/h</div>
                            <div>Battery: {update.battery}%</div>
                          </div>
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            {isRealTimeConnected
              ? "Waiting for live updates..."
              : "Connect to start receiving live updates"}
          </Typography>
        )}
      </Box>

      {/* Real-Time Control Center */}
      <Box
        sx={{
          p: 3,
          bgcolor: "linear-gradient(135deg, #f0f8ff 0%, #e8f5e8 100%)",
          borderRadius: 2,
          border: "2px solid",
          borderColor: isRealTimeConnected ? "success.main" : "warning.main",
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
          🎮 Real-Time Control Center
        </Typography>

        <Stack direction="row" spacing={3}>
          {!isRealTimeConnected ? (
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<LiveIcon />}
              onClick={connectToRealTimeTracking}
              sx={{ px: 4, py: 2, fontWeight: "bold" }}
            >
              🚀 Start Live Tracking
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<StopIcon />}
              onClick={disconnectFromRealTimeTracking}
              sx={{ px: 4, py: 2, fontWeight: "bold" }}
            >
              ⏹️ Stop Live Tracking
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            startIcon={<CleaningServicesIcon />}
            onClick={clearRealTimeUpdates}
            sx={{ px: 4, py: 2, fontWeight: "bold" }}
          >
            🧹 Clear Updates Log
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default RealTimeTrackingSection;
