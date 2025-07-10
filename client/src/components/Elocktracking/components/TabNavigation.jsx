import React from "react";
import {
  Box,
  Tabs,
  Tab,
  Stack,
  Badge,
} from "@mui/material";
import {
  History as HistoryIcon,
  RadioButtonChecked as LiveIcon,
} from "@mui/icons-material";

const TabNavigation = ({ currentTab, isRealTimeConnected, onTabChange }) => {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "rgba(0, 0, 0, 0.02)",
        borderRadius: "8px 8px 0 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Tab background animation */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)",
          animation: "float 6s ease-in-out infinite",
        }}
      />

      <Tabs
        value={currentTab}
        onChange={onTabChange}
        sx={{
          position: "relative",
          zIndex: 1,
          "& .MuiTab-root": {
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            },
          },
        }}
      >
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <HistoryIcon
                className={currentTab === 0 ? "bounce-animation" : ""}
              />
              <span>📊 Static Information</span>
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <LiveIcon
                color={isRealTimeConnected ? "success" : "disabled"}
                className={isRealTimeConnected ? "pulse-animation" : ""}
              />
              <span>🔴 Real-Time Tracking</span>
              {isRealTimeConnected && (
                <Badge
                  color="success"
                  variant="dot"
                  sx={{
                    "& .MuiBadge-dot": {
                      animation: "pulse 2s infinite",
                    },
                  }}
                />
              )}
            </Stack>
          }
        />
      </Tabs>
    </Box>
  );
};

export default TabNavigation;
