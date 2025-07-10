import React from "react";
import {
  Alert,
  CircularProgress,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Satellite as SatelliteIcon,
} from "@mui/icons-material";

const LoadingState = ({ loading }) => {
  if (!loading) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        py: 4,
        bgcolor: "rgba(33, 150, 243, 0.05)",
        borderRadius: 2,
        border: "1px solid rgba(33, 150, 243, 0.2)",
      }}
      className="fade-in-up-animation"
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <CircularProgress
          size={32}
          sx={{
            color: "primary.main",
            animation: "pulse 2s infinite",
          }}
        />
        <Box>
          <Typography
            variant="h6"
            sx={{ color: "primary.main", fontWeight: "bold" }}
          >
            Loading GPS data...
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mt: 1 }}
          >
            <SatelliteIcon
              sx={{
                color: "info.main",
                fontSize: 16,
                animation: "spin 2s linear infinite",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Fetching real-time location and device status
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

const ErrorState = ({ error }) => {
  if (!error) return null;

  return (
    <Alert
      severity="error"
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "error.main",
        borderRadius: 2,
        animation: "shake 0.5s ease",
      }}
      icon={<ErrorIcon sx={{ animation: "shake 0.5s infinite" }} />}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
          ⚠️ GPS Operation Error
        </Typography>
        <Typography variant="body2">{error}</Typography>
      </Stack>
    </Alert>
  );
};

export { LoadingState, ErrorState };
