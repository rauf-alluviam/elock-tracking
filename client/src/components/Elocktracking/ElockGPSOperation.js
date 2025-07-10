import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Stack,
  Box,
} from "@mui/material";

// Import custom components
import DialogHeader from "./components/DialogHeader";
import TabNavigation from "./components/TabNavigation";
import { LoadingState, ErrorState } from "./components/StateComponents";
import AssetInformation from "./components/AssetInformation";
import GPSLocationInformation from "./components/GPSLocationInformation";
import LockStatusSection from "./components/LockStatusSection";
import MapComponent from "./components/MapComponent";
import HistorySection from "./components/HistorySection";
import ActionButtons from "./components/ActionButtons";
import RealTimeTrackingSection from "./components/RealTimeTrackingSection";

// Import custom hooks
import { useElockData, useHistoryData } from "./hooks/useElockData";
import { useRealTimeTracking } from "./hooks/useRealTimeTracking";

// Import constants and utilities
import { advancedAnimations } from "./constants/animations";

const ElockGPSOperation = ({ isOpen, onClose, elockNo }) => {
  // Inject CSS for advanced animations
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = advancedAnimations;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // State for tabs
  const [currentTab, setCurrentTab] = useState(0);

  // Custom hooks
  const {
    loading,
    assetData,
    locationData,
    error,
    mapUrl,
    fetchAssetData,
    setError,
  } = useElockData(elockNo);

  const {
    historyData,
    historyLoading,
    timeRange,
    customStartTime,
    customEndTime,
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,
    setCustomStartTime,
    setCustomEndTime,
    handleTimeRangeChange,
    fetchHistoryData,
  } = useHistoryData(assetData);

  const {
    realTimeData,
    isRealTimeConnected,
    realTimeUpdates,
    setRealTimeUpdates,
    connectToRealTimeTracking,
    disconnectFromRealTimeTracking,
    setRealTimeData,
    error: realTimeError,
  } = useRealTimeTracking(elockNo);

  // Handle tab change with enhanced animations
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);

    if (newValue === 1) {
      // Real-time tab - connect and start animations
      connectToRealTimeTracking();

      // Add visual feedback for tab switch
      setTimeout(() => {
        const tabPanel = document.querySelector('[role="tabpanel"]');
        if (tabPanel) {
          tabPanel.classList.add("fade-in-up-animation");
        }
      }, 100);
    } else {
      // Disconnect when leaving real-time tab
      disconnectFromRealTimeTracking();
    }
  };

  // Handle custom time range operations
  const handleCustomStartTimeChange = (event) => {
    setCustomStartTime(event.target.value);
  };

  const handleCustomEndTimeChange = (event) => {
    setCustomEndTime(event.target.value);
  };

  const handleApplyCustomRange = () => {
    if (!customStartTime || !customEndTime) {
      setError("Please select both start and end date/time");
      return;
    }

    const startDate = new Date(customStartTime);
    const endDate = new Date(customEndTime);

    if (startDate >= endDate) {
      setError("Start time must be before end time");
      return;
    }

    if (endDate > new Date()) {
      setError("End time cannot be in the future");
      return;
    }

    // Check if the date range is reasonable (not more than 30 days)
    const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (diffInDays > 30) {
      setError("Date range cannot exceed 30 days");
      return;
    }

    setError(null);
    fetchHistoryData();
  };

  const handleResetCustomRange = () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    setCustomStartTime(twentyFourHoursAgo.toISOString().slice(0, 16));
    setCustomEndTime(now.toISOString().slice(0, 16));
    setError(null);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear real-time updates
  const clearRealTimeUpdates = () => {
    setRealTimeUpdates([]);
  };

  // Initialize data when dialog opens
  useEffect(() => {
    if (isOpen && elockNo) {
      fetchAssetData();
    } else if (!isOpen) {
      // Cleanup when dialog closes
      disconnectFromRealTimeTracking();
      setCurrentTab(0);
      setRealTimeUpdates([]);
    }
  }, [isOpen, elockNo, fetchAssetData, disconnectFromRealTimeTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.timeRangeTimeout) {
        clearTimeout(window.timeRangeTimeout);
      }
      disconnectFromRealTimeTracking();
    };
  }, [disconnectFromRealTimeTracking]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { maxHeight: "90vh" } }}
    >
      <DialogHeader
        elockNo={elockNo}
        isRealTimeConnected={isRealTimeConnected}
        onClose={onClose}
      />

      <DialogContent dividers>
        <LoadingState loading={loading} />
        <ErrorState error={error || realTimeError} />

        {assetData && locationData && (
          <Stack spacing={3}>
            {/* Enhanced Tabs with Animations */}
            <TabNavigation
              currentTab={currentTab}
              isRealTimeConnected={isRealTimeConnected}
              onTabChange={handleTabChange}
            />

            {/* Tab Content */}
            {currentTab === 0 && (
              <Box>
                {/* Static Information Tab */}
                <AssetInformation assetData={assetData} />
                
                <GPSLocationInformation locationData={locationData} />
                
                <LockStatusSection locationData={locationData} />
                
                <MapComponent
                  locationData={locationData}
                  assetData={assetData}
                  title="Current Location"
                />
                
                <HistorySection
                  historyData={historyData}
                  historyLoading={historyLoading}
                  timeRange={timeRange}
                  customStartTime={customStartTime}
                  customEndTime={customEndTime}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onTimeRangeChange={handleTimeRangeChange}
                  onCustomStartTimeChange={handleCustomStartTimeChange}
                  onCustomEndTimeChange={handleCustomEndTimeChange}
                  onApplyCustomRange={handleApplyCustomRange}
                  onResetCustomRange={handleResetCustomRange}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  onRefreshHistory={fetchHistoryData}
                  error={error}
                  setError={setError}
                />
                
                <ActionButtons
                  loading={loading}
                  historyLoading={historyLoading}
                  assetData={assetData}
                  mapUrl={mapUrl}
                  onRefreshData={fetchAssetData}
                  onRefreshHistory={fetchHistoryData}
                />
              </Box>
            )}

            {/* Real-Time Tracking Tab */}
            {currentTab === 1 && (
              <RealTimeTrackingSection
                isRealTimeConnected={isRealTimeConnected}
                realTimeData={realTimeData}
                realTimeUpdates={realTimeUpdates}
                locationData={locationData}
                assetData={assetData}
                connectToRealTimeTracking={connectToRealTimeTracking}
                disconnectFromRealTimeTracking={disconnectFromRealTimeTracking}
                clearRealTimeUpdates={clearRealTimeUpdates}
              />
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ElockGPSOperation;
