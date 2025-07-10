import { timeRangeOptions } from "../constants/config";

export const getTimeRange = (
  selectedRange,
  customStartTime = null,
  customEndTime = null
) => {
  const now = new Date();

  if (selectedRange === "custom" && customStartTime && customEndTime) {
    return {
      start: new Date(customStartTime).toISOString(),
      end: new Date(customEndTime).toISOString(),
    };
  }

  const option = timeRangeOptions.find((opt) => opt.value === selectedRange);
  const startTime = new Date(now.getTime() - option.hours * 60 * 60 * 1000);

  return {
    start: startTime.toISOString(),
    end: now.toISOString(),
  };
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString();
};

export const getStatusColor = (value, thresholds = { high: 50, low: 20 }) => {
  if (value > thresholds.high) return "success";
  if (value > thresholds.low) return "warning";
  return "error";
};

export const getBatteryAnimation = (battery) => {
  if (battery < 20) return "shake 0.5s infinite";
  return "pulse 2s infinite";
};

export const getSpeedAnimation = (speed) => {
  if (speed > 0) return "bounce 1s infinite";
  return "none";
};
