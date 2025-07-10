import React from "react";
import {
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  History as HistoryIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { timeRangeOptions } from "../constants/config";

const HistorySection = ({
  historyData,
  historyLoading,
  timeRange,
  customStartTime,
  customEndTime,
  page,
  rowsPerPage,
  onTimeRangeChange,
  onCustomStartTimeChange,
  onCustomEndTimeChange,
  onApplyCustomRange,
  onResetCustomRange,
  onPageChange,
  onRowsPerPageChange,
  onRefreshHistory,
  error,
  setError,
}) => {
  return (
    <Box sx={{ p: 2, bgcolor: "primary.light", borderRadius: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">
          <HistoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          GPS Tracking History
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={onTimeRangeChange}
            >
              {timeRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Custom Date/Time Range Section */}
      {timeRange === "custom" && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Custom Date & Time Range
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Start Date & Time"
                type="datetime-local"
                value={customStartTime}
                onChange={onCustomStartTimeChange}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  max: new Date().toISOString().slice(0, 16),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="End Date & Time"
                type="datetime-local"
                value={customEndTime}
                onChange={onCustomEndTimeChange}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  max: new Date().toISOString().slice(0, 16),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={onApplyCustomRange}
                disabled={!customStartTime || !customEndTime || historyLoading}
                fullWidth
                size="small"
              >
                Apply Range
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onResetCustomRange}
                fullWidth
                size="small"
              >
                Reset to Default
              </Button>
            </Grid>
          </Grid>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Note: End time cannot be in the future, must be after start time,
            and date range cannot exceed 30 days
          </Typography>
        </Box>
      )}

      {historyLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Loading history data...</Typography>
        </Box>
      ) : historyData.length > 0 ? (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>GPS Time</TableCell>
                  <TableCell>Receive Time</TableCell>
                  <TableCell>Latitude</TableCell>
                  <TableCell>Longitude</TableCell>
                  <TableCell>Speed (km/h)</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Battery (%)</TableCell>
                  <TableCell>Lock Status</TableCell>
                  <TableCell>Location Type</TableCell>
                  <TableCell>Mileage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((record, index) => (
                    <TableRow hover key={index}>
                      <TableCell>
                        {new Date(record.GT).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(record.RT).toLocaleString()}
                      </TableCell>
                      <TableCell>{record.Lat.toFixed(6)}</TableCell>
                      <TableCell>{record.Lon.toFixed(6)}</TableCell>
                      <TableCell>{record.Speed}</TableCell>
                      <TableCell>{record.Dir}°</TableCell>
                      <TableCell>
                        <Chip
                          label={`${record.Bat}%`}
                          color={
                            record.Bat > 30
                              ? "success"
                              : record.Bat > 15
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          {record.LS ? (
                            <LockIcon color="error" fontSize="small" />
                          ) : (
                            <LockOpenIcon color="success" fontSize="small" />
                          )}
                          <Typography variant="caption">
                            {record.LS ? "Locked" : "Unlocked"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.LType === 1 ? "GPS" : "LBS"}
                          color={record.LType === 1 ? "success" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.Mil} km</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100, 1000]}
            component="div"
            count={historyData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </Paper>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", py: 2 }}
        >
          No history data found for the selected time range.
        </Typography>
      )}
    </Box>
  );
};

export default HistorySection;
