import React from "react";
import {
  Grid,
  Typography,
  Box,
  Stack,
  Chip,
} from "@mui/material";
import {
  Satellite as SatelliteIcon,
  GpsFixed as GpsIcon,
  LocationOn as LocationOnIcon,
  Speed as SpeedIcon,
  BatteryStd as BatteryIcon,
  SignalCellularAlt as SignalIcon,
  Wifi as OnlineIcon,
  OfflineBolt as OfflineIconAlt,
} from "@mui/icons-material";
import { getStatusColor, getBatteryAnimation, getSpeedAnimation } from "../utils/helpers";

const GPSLocationInformation = ({ locationData }) => {
  if (!locationData) return null;

  const getStatusChip = (online) => (
    <Chip
      label={online === 1 ? "Online" : "Offline"}
      color={online === 1 ? "success" : "error"}
      size="small"
    />
  );

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)",
        borderRadius: 2,
        border: "1px solid rgba(33, 150, 243, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
      className="fade-in-up-animation"
      style={{ animationDelay: "0.2s" }}
    >
      {/* Background animation */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(45deg, rgba(33, 150, 243, 0.1) 25%, transparent 25%, transparent 75%, rgba(33, 150, 243, 0.1) 75%)",
          backgroundSize: "30px 30px",
          animation: "float 6s ease-in-out infinite",
          opacity: 0.3,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <SatelliteIcon
            sx={{
              color: "info.main",
              fontSize: 28,
              animation: "spin 3s linear infinite",
            }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "info.main" }}
          >
            🛰️ GPS Location Intelligence
          </Typography>
          <Chip
            icon={<GpsIcon className="signal-animation" />}
            label="LOCATION ACTIVE"
            color="info"
            size="small"
            className="pulse-animation"
          />
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(76, 175, 80, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <OnlineIcon
                  sx={{
                    color:
                      locationData.FOnline === 1 ? "success.main" : "error.main",
                    fontSize: 18,
                    animation:
                      locationData.FOnline === 1
                        ? "pulse 2s infinite"
                        : "shake 0.5s infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Status
                </Typography>
              </Stack>
              {getStatusChip(locationData.FOnline)}
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(33, 150, 243, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <LocationOnIcon
                  sx={{
                    color: "primary.main",
                    fontSize: 18,
                    animation: "heartbeat 2s infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Latitude
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                }}
              >
                {locationData.FLatitude}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(33, 150, 243, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <LocationOnIcon
                  sx={{
                    color: "primary.main",
                    fontSize: 18,
                    animation: "heartbeat 2s infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Longitude
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                }}
              >
                {locationData.FLongitude}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(255, 152, 0, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <SpeedIcon
                  sx={{
                    color: getStatusColor(locationData.FSpeed, { high: 50, low: 20 }) + ".main",
                    fontSize: 18,
                    animation: getSpeedAnimation(locationData.FSpeed),
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Speed
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  color: getStatusColor(locationData.FSpeed, { high: 50, low: 20 }) + ".main",
                  fontWeight: "bold",
                }}
              >
                {locationData.FSpeed} km/h
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(76, 175, 80, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <BatteryIcon
                  sx={{
                    color: getStatusColor(locationData.FBattery) + ".main",
                    fontSize: 18,
                    animation: getBatteryAnimation(locationData.FBattery),
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Battery
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  color: getStatusColor(locationData.FBattery) + ".main",
                  fontWeight: "bold",
                }}
              >
                {locationData.FBattery}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(156, 39, 176, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <SignalIcon
                  sx={{
                    color: "secondary.main",
                    fontSize: 18,
                    animation: "signal 2s infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  GPS Signal
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: "bold" }}
              >
                {locationData.FGPSSignal}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default GPSLocationInformation;
