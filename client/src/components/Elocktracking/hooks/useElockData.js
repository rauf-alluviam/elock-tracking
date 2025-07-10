import { useState, useEffect, useCallback, useRef } from "react";
import { API_CONFIG } from "../constants/config";
import { getTimeRange } from "../utils/helpers";

export const useElockData = (elockNo) => {
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);
  const [mapUrl, setMapUrl] = useState("");

  const fetchAssetData = useCallback(async () => {
    if (!elockNo) {
      setError("No E-lock number provided");
      return;
    }

    setLoading(true);
    setError(null);
    setAssetData(null);
    setLocationData(null);

    try {
      // Fetch asset information
      const assetResponse = await fetch(API_CONFIG.ADMIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FAction: "QueryAdminAssetByAssetId",
          FTokenID: API_CONFIG.TOKEN_ID,
          FAssetID: elockNo,
        }),
      });

      if (!assetResponse.ok) {
        throw new Error(`Asset request failed: ${assetResponse.statusText}`);
      }

      const assetResult = await assetResponse.json();
      if (!assetResult.FObject?.length) {
        throw new Error("No asset data found");
      }

      const assetInfo = assetResult.FObject[0];
      setAssetData(assetInfo);

      // Fetch location information
      const locationResponse = await fetch(API_CONFIG.LBS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FAction: "QueryLBSMonitorListByFGUIDs",
          FTokenID: API_CONFIG.TOKEN_ID,
          FGUIDs: assetInfo.FGUID,
          FType: 2,
        }),
      });

      if (!locationResponse.ok) {
        throw new Error(
          `Location request failed: ${locationResponse.statusText}`
        );
      }

      const locationResult = await locationResponse.json();
      if (!locationResult.FObject?.length) {
        throw new Error("No location data found");
      }

      const locationInfo = locationResult.FObject[0];
      setLocationData(locationInfo);

      // Set Google Maps URL
      setMapUrl(
        `https://www.google.com/maps?q=${locationInfo.FLatitude},${locationInfo.FLongitude}`
      );
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch E-lock data");
    } finally {
      setLoading(false);
    }
  }, [elockNo]);

  return {
    loading,
    assetData,
    locationData,
    error,
    mapUrl,
    fetchAssetData,
    setError,
  };
};

export const useHistoryData = (assetData) => {
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("6h");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const historyFetchedRef = useRef(false);
  const timeRangeRef = useRef(timeRange);

  const fetchHistoryData = useCallback(async () => {
    if (!assetData?.FGUID) return;

    setHistoryLoading(true);
    try {
      const { start, end } = getTimeRange(
        timeRange,
        customStartTime,
        customEndTime
      );

      const response = await fetch(API_CONFIG.LBS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FTokenID: API_CONFIG.TOKEN_ID,
          FAction: "QueryLBSTrackListByFGUID",
          FGUID: assetData.FGUID,
          FType: 2,
          FAssetTypeID: 3701,
          FStartTime: start,
          FEndTime: end,
          FLanguage: 0,
          FDateType: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`History request failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.Result === 200 && result.FObject) {
        setHistoryData(result.FObject);
      } else {
        setHistoryData([]);
      }
      historyFetchedRef.current = true;
    } catch (err) {
      console.error("History fetch error:", err);
      // Note: setError should be passed from the parent component
    } finally {
      setHistoryLoading(false);
    }
  }, [assetData?.FGUID, timeRange, customStartTime, customEndTime]);

  // Only fetch history data when asset data is available for the first time
  useEffect(() => {
    if (assetData?.FGUID && !historyFetchedRef.current) {
      fetchHistoryData();
    }
  }, [assetData?.FGUID, fetchHistoryData]);

  const handleTimeRangeChange = (event) => {
    const newTimeRange = event.target.value;
    setTimeRange(newTimeRange);
    timeRangeRef.current = newTimeRange;

    // Clear any existing timeout
    if (window.timeRangeTimeout) {
      clearTimeout(window.timeRangeTimeout);
    }

    // If custom range is selected, set default values
    if (newTimeRange === "custom") {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!customStartTime) {
        setCustomStartTime(twentyFourHoursAgo.toISOString().slice(0, 16));
      }
      if (!customEndTime) {
        setCustomEndTime(now.toISOString().slice(0, 16));
      }
      return;
    }

    // Clear custom time values when switching away from custom
    if (customStartTime || customEndTime) {
      setCustomStartTime("");
      setCustomEndTime("");
    }

    // Debounce the API call by 500ms
    window.timeRangeTimeout = setTimeout(() => {
      if (assetData?.FGUID && timeRangeRef.current === newTimeRange) {
        fetchHistoryData();
      }
    }, 500);
  };

  return {
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
  };
};
