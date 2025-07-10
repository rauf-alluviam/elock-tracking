import React from "react";
import {
  Grid,
  Typography,
  Box,
  Stack,
  Chip,
} from "@mui/material";
import {
  DeviceThermostat as ThermostatIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  PhoneAndroid as DeviceIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Navigation as DirectionIcon,
} from "@mui/icons-material";
import { formatDateTime } from "../utils/helpers";

const AssetInformation = ({ assetData }) => {
  if (!assetData) return null;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%)",
        borderRadius: 2,
        border: "1px solid rgba(76, 175, 80, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
      className="fade-in-up-animation"
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
            "linear-gradient(45deg, rgba(76, 175, 80, 0.1) 25%, transparent 25%, transparent 75%, rgba(76, 175, 80, 0.1) 75%)",
          backgroundSize: "30px 30px",
          animation: "float 8s ease-in-out infinite",
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
          <DeviceIcon
            sx={{
              color: "success.main",
              fontSize: 28,
              animation: "heartbeat 2s infinite",
            }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "success.main" }}
          >
            🏷️ Asset Information
          </Typography>
          <Chip
            icon={<InfoIcon />}
            label="DEVICE INFO"
            color="success"
            size="small"
            className="glow-animation"
          />
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
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
                <SecurityIcon
                  sx={{ color: "primary.main", fontSize: 18 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  E-Lock No.
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ color: "primary.main", fontWeight: "bold" }}
              >
                {assetData.FAssetID}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
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
                <DirectionIcon
                  sx={{
                    color: "warning.main",
                    fontSize: 18,
                    animation: "spin 4s linear infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Vehicle Name
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ color: "warning.main", fontWeight: "bold" }}
              >
                {assetData.FVehicleName}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
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
                <PersonIcon
                  sx={{ color: "secondary.main", fontSize: 18 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Agent
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: "bold" }}
              >
                {assetData.FAgentName}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
                p: 2,
                borderRadius: 1,
                border: "1px solid rgba(244, 67, 54, 0.2)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <TimeIcon
                  sx={{
                    color: "error.main",
                    fontSize: 18,
                    animation: "pulse 2s infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "500" }}
                >
                  Expire Time
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ color: "error.main", fontWeight: "bold" }}
              >
                {formatDateTime(assetData.FExpireTime)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AssetInformation;
