import React from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Grid,
} from "@mui/material";
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";

const LockStatusSection = ({ locationData }) => {
  if (!locationData) return null;

  return (
    <Box sx={{ p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Lock Status
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">
            Lock Status
          </Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            {locationData.FLockStatus ? (
              <LockIcon color="error" />
            ) : (
              <LockOpenIcon color="success" />
            )}
            <Typography variant="body1">
              {locationData.FLockStatus ? "Locked" : "Unlocked"}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LockStatusSection;
