import React from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  FlashOn as FlashIcon,
} from "@mui/icons-material";

const ActionButtons = ({
  loading,
  historyLoading,
  assetData,
  mapUrl,
  onRefreshData,
  onRefreshHistory,
}) => {
  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "linear-gradient(135deg, #f5f5f5 0%, #e8f5e8 100%)",
        borderRadius: 2,
        border: "1px solid rgba(96, 125, 139, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
      className="fade-in-up-animation"
      style={{ animationDelay: "0.8s" }}
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
            "linear-gradient(45deg, rgba(96, 125, 139, 0.1) 25%, transparent 25%, transparent 75%, rgba(96, 125, 139, 0.1) 75%)",
          backgroundSize: "30px 30px",
          animation: "float 10s ease-in-out infinite",
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
          <SettingsIcon
            sx={{
              color: "grey.600",
              fontSize: 28,
              animation: "spin 4s linear infinite",
            }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "grey.600" }}
          >
            ⚡ Quick Actions
          </Typography>
          <Chip
            icon={<FlashIcon />}
            label="CONTROL PANEL"
            color="default"
            size="small"
            className="pulse-animation"
          />
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            startIcon={
              <RefreshIcon
                sx={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />
            }
            onClick={onRefreshData}
            disabled={loading}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(33, 150, 243, 0.4)",
                animation: "glow 0.5s ease",
              },
              "&:disabled": {
                bgcolor: "grey.400",
              },
            }}
            className={loading ? "" : "bounce-animation"}
          >
            🔄 Refresh Data
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={
              <HistoryIcon
                sx={{
                  animation: historyLoading
                    ? "spin 1s linear infinite"
                    : "pulse 2s infinite",
                }}
              />
            }
            onClick={onRefreshHistory}
            disabled={historyLoading || !assetData?.FGUID}
            sx={{
              borderColor: "info.main",
              color: "info.main",
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              "&:hover": {
                borderColor: "info.dark",
                color: "info.dark",
                bgcolor: "info.light",
                transform: "translateY(-2px)",
                animation: "glow 0.5s ease",
              },
              "&:disabled": {
                borderColor: "grey.400",
                color: "grey.400",
              },
            }}
          >
            📊 Refresh History
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={
              <MapIcon
                sx={{
                  animation: "float 3s ease-in-out infinite",
                }}
              />
            }
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderColor: "success.main",
              color: "success.main",
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              "&:hover": {
                borderColor: "success.dark",
                color: "success.dark",
                bgcolor: "success.light",
                transform: "translateY(-2px)",
                animation: "glow 0.5s ease",
              },
            }}
            className="slide-in-animation"
          >
            🗺️ Open in Google Maps
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default ActionButtons;
