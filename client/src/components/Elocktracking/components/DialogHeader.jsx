import React from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  Badge,
} from "@mui/material";
import {
  Satellite as SatelliteIcon,
  Close as CloseIcon,
  PhoneAndroid as DeviceIcon,
  Wifi as OnlineIcon,
  OfflineBolt as OfflineIconAlt,
} from "@mui/icons-material";

const DialogHeader = ({ elockNo, isRealTimeConnected, onClose }) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      sx={{ position: "relative", overflow: "hidden" }}
    >
      {/* Animated background gradient */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(45deg, rgba(33, 150, 243, 0.1) 25%, transparent 25%, transparent 75%, rgba(33, 150, 243, 0.1) 75%)",
          backgroundSize: "40px 40px",
          animation: "float 8s ease-in-out infinite",
          opacity: 0.3,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: "100%",
        }}
      >
        <SatelliteIcon
          sx={{
            color: "primary.main",
            fontSize: 32,
            animation: "spin 4s linear infinite",
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "primary.main" }}
          >
            🛰️ E-Lock GPS Operation
          </Typography>
          <Chip
            icon={<DeviceIcon className="pulse-animation" />}
            label={elockNo}
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: "bold",
              animation: "glow 2s infinite",
            }}
          />
        </Box>

        {/* Connection Status Indicator */}
        <Box
          sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}
        >
          {isRealTimeConnected ? (
            <Chip
              icon={<OnlineIcon className="pulse-animation" />}
              label="LIVE"
              color="success"
              size="small"
              sx={{ animation: "glow 2s infinite" }}
            />
          ) : (
            <Chip
              icon={<OfflineIconAlt />}
              label="STATIC"
              color="warning"
              size="small"
            />
          )}
        </Box>
      </Box>

      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          zIndex: 2,
          "&:hover": {
            animation: "spin 0.5s ease",
            bgcolor: "error.light",
          },
        }}
      >
        <CloseIcon />
      </IconButton>
    </Stack>
  );
};

export default DialogHeader;
