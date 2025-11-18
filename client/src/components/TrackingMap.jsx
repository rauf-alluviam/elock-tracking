import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Card,
  CardContent,
  Divider,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
  Route as RouteIcon,
  LocalShipping,
  DirectionsBoat,
  Lock,
  Phone,
  Person,
  Numbers,
  ConfirmationNumber,
  DirectionsCar,
  LocationOn,
} from "@mui/icons-material";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import truckIcon from "../assets/images/truckLong.svg";

// Fix for default Leaflet markers
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// API Configuration
const TOKEN_ID = "e36d2589-9dc3-4302-be7d-dc239af1846c";
const ADMIN_API_URL = "http://icloud.assetscontrols.com:8092/OpenApi/Admin";
const LBS_API_URL = "http://icloud.assetscontrols.com:8092/OpenApi/LBS";

// Custom numbered marker icon with hover effect
const createNumberIcon = (number, isFirst = false, isLast = false) => {
  const color = isFirst ? "#4CAF50" : isLast ? "#F44336" : "white";
  return divIcon({
    className: "custom-number-marker",
    html: `<div class="marker-number" style="background-color: ${color}" title="${number}"></div>`,
    iconSize: [10, 10],
    iconAnchor: [10, 10], // Changed to [10, 10] to center the 20px icon
    popupAnchor: [0, -10], // Adjusted popup anchor to work with centered icon
  });
};

// Custom truck icon for active/ongoing journey
const createTruckIcon = () => {
  return divIcon({
    className: "custom-truck-marker",
    html: `<div class="truck-icon">
           <img src=${truckIcon} alt="truck" />
          </div>`,
    iconSize: [50, 50],
    iconAnchor: [15, 15], // Center the icon
    popupAnchor: [0, -15], // Adjusted popup anchor to work with centered icon
  });
};

// Custom destination icon for completed journey
const createDestinationIcon = () => {
  return divIcon({
    className: "custom-destination-marker",
    html: `<div class="destination-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#F44336">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15], // Center the icon
    popupAnchor: [0, -15], // Adjusted popup anchor to work with centered icon
  });
};

// Auto-adjust map bounds to fit all markers
const MapBounds = ({ positions, onBoundsSet }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = positions.map((pos) => [pos.Lat, pos.Lon]);
      map.fitBounds(bounds, { padding: [50, 50] });

      // Notify parent component when bounds are set
      if (onBoundsSet) {
        // Use a timeout to ensure the map has finished rendering
        setTimeout(() => {
          onBoundsSet();
        }, 1000);
      }
    }
  }, [map, positions, onBoundsSet]);
  return null;
};

// Component to update map center when new data arrives, but only if user hasn't interacted with the map
const MapCenterUpdater = ({ center }) => {
  console.log("center", center);
  const map = useMap();
  const [userInteracted, setUserInteracted] = useState(false);
  const userInteractedRef = useRef(false); // Use ref to persist across re-renders

  useEffect(() => {
    // Add event listeners to detect user interaction
    const handleUserInteraction = () => {
      setUserInteracted(true);
      userInteractedRef.current = true; // Also update the ref
    };

    map.on("dragstart", handleUserInteraction);
    map.on("zoomstart", handleUserInteraction);

    // Clean up event listeners
    return () => {
      map.off("dragstart", handleUserInteraction);
      map.off("zoomstart", handleUserInteraction);
    };
  }, [map]);

  useEffect(() => {
    // Only update center if user hasn't interacted with the map
    // Check both state and ref to ensure consistency
    if (
      center &&
      center.length === 2 &&
      !userInteracted &&
      !userInteractedRef.current
    ) {
      map.panTo(center);
    }
  }, [map, center, userInteracted]);

  // Reset user interaction flag ONLY when elockNo changes (new tracking session)
  // This effect should be managed by the parent component
  return null;
};

const TrackingMap = ({
  isOpen,
  onClose,
  elockNo,
  containerId,
  containerData,
  source,
}) => {
  console.log("containerData", containerData);
  console.log("Elock No", elockNo);
  console.log("source", source);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showPath, setShowPath] = useState(true);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false); // Separate loading state for history
  const [currentLoading, setCurrentLoading] = useState(false); // Separate loading state for current status
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [assetInfo, setAssetInfo] = useState(null);
  const [currentInfo, setCurrentInfo] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true); // Auto-enabled by default
  const [refreshInterval, setRefreshInterval] = useState(30); // 30 seconds default
  const [lastUpdate, setLastUpdate] = useState(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);

  console.log("asset info", assetInfo);
  console.log("current info", currentInfo);

  // New states for assignment tracking
  const [assignHistory, setAssignHistory] = useState([]);
  const [assignmentStartTime, setAssignmentStartTime] = useState(null);
  const [assignmentEndTime, setAssignmentEndTime] = useState(null);
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);

  // New states for lock periods
  const [lockPeriods, setLockPeriods] = useState([]);
  // console.log('lockPeriods', lockPeriods)
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  // New state for hover tracking
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState(null);

  // New state for map visualization loading
  const [mapVisualizationLoading, setMapVisualizationLoading] = useState(false);

  // New state to track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refs to store GUID and interval
  const guidRef = useRef(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const mapRef = useRef(null);
  const mapKeyRef = useRef(0); // Used to force re-render of map when needed

  // Reset GUID when elockNo changes
  useEffect(() => {
    guidRef.current = null;
    setIsInitialLoad(true); // Reset initial load flag when elockNo changes
    mapKeyRef.current += 1; // Increment to force map re-render with new key
  }, [elockNo]);

  // Function to format duration in a human-readable way
  const formatDuration = (startTime, endTime) => {
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    } else {
      return `${diffMins}m`;
    }
  };

  // Function to extract lock periods from tracking data
  const extractLockPeriods = useCallback(
    (data) => {
      if (!data || data.length === 0) return [];

      const periods = [];
      let lockStartTime = null;
      let lockStartIndex = null;

      // Sort data by GPS time
      const sortedData = [...data].sort(
        (a, b) => new Date(a.GT) - new Date(b.GT)
      );

      for (let i = 0; i < sortedData.length; i++) {
        const point = sortedData[i];
        const pointTime = new Date(point.GT);
        const lockState = point.LR; // 0: Lock, 1: Unlock

        // If the lock state is 0 (locked) and we don't have a lock start time, start tracking
        if (lockState === 0 && lockStartTime === null) {
          lockStartTime = pointTime;
          lockStartIndex = i;
          continue;
        }

        // If the lock state is 1 (unlocked) and we have a lock start time, complete the period
        if (lockState === 1 && lockStartTime !== null) {
          const endTime = pointTime;
          const duration = formatDuration(lockStartTime, endTime);

          periods.push({
            id: periods.length,
            type: "completed",
            startTime: lockStartTime,
            endTime: endTime,
            startIndex: lockStartIndex,
            endIndex: i - 1,
            duration: duration,
            durationMs: endTime - lockStartTime,
          });

          // Reset lock start time
          lockStartTime = null;
          lockStartIndex = null;
        }
      }

      // Handle the case where the last point is still locked
      if (lockStartTime !== null) {
        const endTime = isJourneyComplete
          ? new Date(sortedData[sortedData.length - 1].GT)
          : new Date(); // Current time if journey is ongoing

        const duration = formatDuration(lockStartTime, endTime);

        periods.push({
          id: periods.length,
          type: "ongoing",
          startTime: lockStartTime,
          endTime: endTime,
          startIndex: lockStartIndex,
          endIndex: sortedData.length - 1,
          duration: duration,
          durationMs: endTime - lockStartTime,
        });
      }

      return periods;
    },
    [isJourneyComplete]
  );

  // Extract assignment times from history
  const extractAssignmentTimes = useCallback((history) => {
    if (!history || history.length === 0)
      return { startTime: null, endTime: null, isComplete: false };

    // Sort history by timestamp in descending order to find the latest "UNASSIGNED to ASSIGNED"
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Find the last "UNASSIGNED to ASSIGNED" entry
    const lastAssignedEntry = sortedHistory.find(
      (entry) => entry.change === "UNASSIGNED to ASSIGNED"
    );

    if (!lastAssignedEntry)
      return { startTime: null, endTime: null, isComplete: false };

    const startTime = new Date(lastAssignedEntry.timestamp);

    // Find the first "ASSIGNED to RETURNED" entry after the start time
    const returnedEntry = history.find(
      (entry) =>
        entry.change === "ASSIGNED to RETURNED" &&
        new Date(entry.timestamp) > startTime
    );

    const endTime = returnedEntry ? new Date(returnedEntry.timestamp) : null;
    const isComplete = !!endTime;

    return { startTime, endTime, isComplete };
  }, []);

  // Fetch asset information
  const fetchAssetInfo = useCallback(async () => {
    try {
      const response = await fetch(ADMIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FAction: "QueryAdminAssetByAssetId",
          FTokenID: TOKEN_ID,
          FAssetID: elockNo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Asset request failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.Result === 200 && result.FObject?.length > 0) {
        setAssetInfo(result.FObject[0]);
        const guid = result.FObject[0].FGUID;
        guidRef.current = guid;
        return guid;
      } else {
        throw new Error("No asset data found");
      }
    } catch (err) {
      console.error("Fetch asset error:", err);
      throw err;
    }
  }, [elockNo]);

  // Fetch historical tracking data
  const fetchHistoryData = useCallback(
    async (guid) => {
      setHistoryLoading(true); // Set history loading to true
      try {
        // Use assignment times instead of time range
        const startTime = assignmentStartTime;
        const endTime = assignmentEndTime || new Date(); // Use current time if journey is ongoing

        console.log(
          `🔄 Fetching history for GUID: ${guid}, Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`
        );

        // const st= new Date('2025-11-10T07:00:00.000Z')

        const response = await fetch(LBS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FAction: "QueryLBSTrackListByFGUID",
            FTokenID: TOKEN_ID,
            FGUID: guid,
            FType: 2,
            FAssetTypeID: 3701,
            FStartTime: startTime.toISOString(),
            FEndTime: endTime.toISOString(),
            FLanguage: 0,
            FDateType: 1, // Query by receiving time
          }),
        });

        if (!response.ok) {
          throw new Error(`History request failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(
          `✅ History fetched: ${result.FObject?.length || 0} points`
        );

        if (result.Result === 200 && result.FObject) {
          // Instead of replacing all data, merge new data with existing
          setHistoryData((prevData) => {
            // If we have existing data, find the newest point in the old data
            if (prevData.length > 0) {
              const sortedOldData = [...prevData].sort(
                (a, b) => new Date(a.GT) - new Date(b.GT)
              );
              const lastOldPointTime = new Date(
                sortedOldData[sortedOldData.length - 1].GT
              );

              // Filter new data to only include points newer than our last point
              const newPoints = result.FObject.filter(
                (point) => new Date(point.GT) > lastOldPointTime
              );

              console.log(
                `📍 Adding ${newPoints.length} new points to existing ${prevData.length} points`
              );

              // Return the merged data
              return [...prevData, ...newPoints];
            } else {
              // If we don't have existing data, use all the new data
              return result.FObject;
            }
          });

          setLastUpdate(new Date());
          setError(null);
        } else {
          setHistoryData([]);
        }
      } catch (err) {
        console.error("❌ Fetch history error:", err);
        setError(`Failed to fetch history: ${err.message}`);
      } finally {
        setHistoryLoading(false); // Set history loading to false
      }
    },
    [assignmentStartTime, assignmentEndTime, elockNo]
  );

  // Fetch current status
  async function fetchCurrentStatus(guid) {
    setCurrentLoading(true); // Set current loading to true
    console.log(`\n--- Step 2: Fetching Current Status for GUID: ${guid} ---`);
    try {
      const response = await fetch(LBS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FAction: "QueryLBSMonitorListByFGUIDs", // Action for CURRENT STATUS
          FTokenID: TOKEN_ID,
          FGUIDs: guid, // Note: the key is FGUIDs (plural)
          FType: 2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Status request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Current Status API Response Received:");
      setCurrentInfo(result.FObject[0]); // Console the full status response as requested
    } catch (err) {
      console.error("❌ Error fetching current status:", err);
    } finally {
      setCurrentLoading(false); // Set current loading to false
    }
  }

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use stored GUID or fetch it
      let guid = guidRef.current;

      if (!guid) {
        guid = await fetchAssetInfo();
      }

      if (guid) {
        guidRef.current = guid;
        // Fetch both history and current status in parallel
        await Promise.all([fetchHistoryData(guid), fetchCurrentStatus(guid)]);
      }
    } catch (err) {
      setError(err.message || "Failed to load tracking data");
    } finally {
      setLoading(false);
      if (isInitialLoad) {
        setIsInitialLoad(false); // Mark initial load as complete
      }
    }
  }, [fetchAssetInfo, fetchHistoryData, isInitialLoad]);

  // Initial load when dialog opens
  useEffect(() => {
    if (isOpen && elockNo) {
      console.log(`📍 TrackingMap opened for E-lock: ${elockNo}`);
      // Reset history data when opening with a new elock
      setHistoryData([]);
      setCurrentInfo(null); // Also reset current info
      loadData();
    }

    // Cleanup on dialog close
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isOpen, elockNo, loadData]);

  // Extract lock periods when history data changes
  useEffect(() => {
    if (historyData.length > 0) {
      const periods = extractLockPeriods(historyData);
      setLockPeriods(periods);

      // If no period is selected, select the first one
      if (!selectedPeriod && periods.length > 0) {
        setSelectedPeriod(periods[0].id);
      }
    }
  }, [historyData, extractLockPeriods, selectedPeriod]);

  // Filter data based on selected period
  useEffect(() => {
    if (selectedPeriod !== null && lockPeriods.length > 0) {
      const period = lockPeriods.find((p) => p.id === selectedPeriod);
      if (period) {
        const sortedData = [...historyData].sort(
          (a, b) => new Date(a.GT) - new Date(b.GT)
        );
        const filtered = sortedData.slice(
          period.startIndex,
          period.endIndex + 1
        );
        setFilteredData(filtered);
      }
    } else {
      // If no period is selected, show all data
      setFilteredData(
        [...historyData].sort((a, b) => new Date(a.GT) - new Date(b.GT))
      );
    }
  }, [selectedPeriod, lockPeriods, historyData]);

  // Auto-refresh functionality with countdown
  useEffect(() => {
    // Clear existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only auto-refresh if journey is ongoing and we have a GUID
    if (!isOpen || !autoRefresh || !guidRef.current || isJourneyComplete) {
      console.log(`⏸️ Auto-refresh paused:`, {
        isOpen,
        autoRefresh,
        hasGuid: !!guidRef.current,
        isJourneyComplete,
      });
      return;
    }

    // Check if the selected period is ongoing
    const isOngoingPeriod =
      selectedPeriod !== null &&
      lockPeriods.find((p) => p.id === selectedPeriod)?.type === "ongoing";

    // Only auto-refresh if the selected period is ongoing or no period is selected
    if (selectedPeriod !== null && !isOngoingPeriod) {
      console.log(`⏸️ Auto-refresh paused for completed period`);
      return;
    }

    console.log(`🔁 Auto-refresh enabled: Every ${refreshInterval} seconds`);

    // Set up the main refresh interval
    intervalRef.current = setInterval(() => {
      console.log(
        `🔄 Auto-refresh triggered at ${new Date().toLocaleTimeString()}`
      );
      if (guidRef.current) {
        // Fetch both history and current status in parallel
        Promise.all([
          fetchHistoryData(guidRef.current),
          fetchCurrentStatus(guidRef.current),
        ]);
      }
      setNextRefreshIn(refreshInterval); // Reset countdown
    }, refreshInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isOpen,
    autoRefresh,
    refreshInterval,
    fetchHistoryData,
    isJourneyComplete,
    guidRef.current,
    selectedPeriod,
    lockPeriods,
  ]);

  // Countdown timer - separate from auto-refresh
  useEffect(() => {
    // Clear existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // Only start countdown if dialog is open and auto-refresh is enabled
    if (!isOpen || !autoRefresh || isJourneyComplete) {
      return;
    }

    // Check if the selected period is ongoing
    const isOngoingPeriod =
      selectedPeriod !== null &&
      lockPeriods.find((p) => p.id === selectedPeriod)?.type === "ongoing";

    // Only show countdown if the selected period is ongoing or no period is selected
    if (selectedPeriod !== null && !isOngoingPeriod) {
      return;
    }

    // Reset countdown
    setNextRefreshIn(refreshInterval);

    // Set up countdown timer (updates every second)
    countdownRef.current = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [
    isOpen,
    autoRefresh,
    refreshInterval,
    isJourneyComplete,
    selectedPeriod,
    lockPeriods,
  ]);

  // Fetch assign history and extract times
  useEffect(() => {
    const fetchAssignHistory = async () => {
      try {
        // Determine which API endpoint to use based on source
        const apiUrl =
          source === "containers"
            ? `http://43.205.59.159:9005/api/elock-status-history/${containerId}`
            : `http://43.205.59.159:9005/api/elock-status-history-others/${containerId}`;

        const response = await axios.get(apiUrl);
        console.log("📦 API Response:", response.data);
        const history = response.data.data.history;
        setAssignHistory(history);

        // Extract assignment times
        const { startTime, endTime, isComplete } =
          extractAssignmentTimes(history);
        setAssignmentStartTime(startTime);
        setAssignmentEndTime(endTime);
        setIsJourneyComplete(isComplete);

        // If we have new times, reload the data
        if (startTime && guidRef.current) {
          await Promise.all([
            fetchHistoryData(guidRef.current),
            fetchCurrentStatus(guidRef.current),
          ]);
        }
      } catch (error) {
        console.error("❌ Error fetching history:", error);
      }
    };

    if (isOpen) {
      fetchAssignHistory();
    }
  }, [isOpen, extractAssignmentTimes, source, containerId]);

  // Sort data by GPS time
  const sortedData = useMemo(() => {
    return filteredData.length > 0
      ? filteredData
      : [...historyData].sort((a, b) => new Date(a.GT) - new Date(b.GT));
  }, [historyData, filteredData]);

  // Create path positions for polyline
  const pathPositions = useMemo(
    () => sortedData.map((point) => [point.Lat, point.Lon]),
    [sortedData]
  );

  const handleMarkerClick = (index) => {
    setSelectedPoint(sortedData[index]);
  };

  // Handle mouse over on marker
  const handleMarkerMouseOver = (index) => {
    setHoveredMarkerIndex(index);
    setSelectedPoint(sortedData[index]);
  };

  // Handle mouse out from marker
  const handleMarkerMouseOut = () => {
    setHoveredMarkerIndex(null);
    // Don't clear selectedPoint on mouse out to keep the details panel open
  };

  // const formatTime = (timestamp) => {
  //   console.log('timestamp', timestamp)
  //   const date = new Date(timestamp);
  //   return date.toLocaleString();
  // };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);

    // Use 'en-GB' locale to get DD/MM/YYYY format and add time options
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format
    };

    // IMPORTANT: Use toLocaleString, not toLocaleDateString
    return date.toLocaleString("en-GB", options);
  };

  const getBatteryColor = (level) => {
    if (level > 60) return "#4CAF50";
    if (level > 30) return "#FFC107";
    return "#F44336";
  };

  const getLockStatus = (status) => (status === 1 ? "Unlocked" : "Locked");

  const getLocationTypeLabel = (type) => {
    return type === 1 ? "GPS" : type === 2 ? "LBS" : "Unknown";
  };

  const handleRefresh = () => {
    console.log(`🔄 Manual refresh triggered`);
    setLoading(true); // Ensure loading is set to true for manual refresh
    loadData();
    setNextRefreshIn(refreshInterval); // Reset countdown
  };

  const toggleAutoRefresh = () => {
    const newState = !autoRefresh;
    setAutoRefresh(newState);
    console.log(
      `${newState ? "▶️" : "⏸️"} Auto-refresh ${
        newState ? "enabled" : "disabled"
      }`
    );

    if (newState) {
      setNextRefreshIn(refreshInterval);
    }
  };

  const handleRefreshIntervalChange = (e) => {
    const newInterval = e.target.value;
    setRefreshInterval(newInterval);
    setNextRefreshIn(newInterval);
    console.log(`⏱️ Refresh interval changed to ${newInterval} seconds`);
  };

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  // Update ongoing lock period duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (lockPeriods.length > 0) {
        const ongoingPeriod = lockPeriods.find((p) => p.type === "ongoing");
        if (ongoingPeriod) {
          const updatedPeriods = lockPeriods.map((p) => {
            if (p.id === ongoingPeriod.id) {
              const newEndTime = new Date();
              return {
                ...p,
                endTime: newEndTime,
                duration: formatDuration(p.startTime, newEndTime),
                durationMs: newEndTime - p.startTime,
              };
            }
            return p;
          });
          setLockPeriods(updatedPeriods);
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lockPeriods]);

  // Helper function to get the E-lock number based on the data structure
  const getElockNumber = () => {
    if (source === "containers") {
      return containerData?.elock_no || "N/A";
    } else {
      // For "others", elock_no is an object with FAssetID property
      return containerData?.elock_no?.FAssetID || "N/A";
    }
  };

  // Callback for when map bounds are set
  const handleBoundsSet = useCallback(() => {
    // Only set mapVisualizationLoading to false for the initial load
    if (isInitialLoad) {
      setMapVisualizationLoading(false);
    }
  }, [isInitialLoad]);

  // Set map visualization loading when data changes
  useEffect(() => {
    // Only show map visualization loading for the initial load
    if (sortedData.length > 0 && isInitialLoad) {
      setMapVisualizationLoading(true);
    }
  }, [sortedData, isInitialLoad]);

  // Determine what to show based on loading states
  const showLoading = loading || historyLoading || currentLoading;
  const hasData = sortedData.length > 0 || currentInfo;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "95vh",
          height: "95vh",
          minWidth: "95vw",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          bgcolor: "primary.light",
          color: "primary.contrastText",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            📍 Elock Tracking History —{" "}
            <Typography component="span" sx={{ fontWeight: 500 }}>
              E-lock No: {getElockNumber()}
            </Typography>
          </Typography>

          {/* Route Info */}
          {containerData && (
            <Chip
              label={`Route: ${
                containerData.goods_pickup?.name || "Unknown"
              } → ${containerData.goods_delivery?.name || "Unknown"}`}
              size="small"
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 500,
              }}
            />
          )}

          {/* Last Update */}
          {lastUpdate && (
            <Chip
              label={`Updated: ${lastUpdate.toLocaleTimeString()}`}
              size="small"
              sx={{
                bgcolor: "success.light",
                color: "success.contrastText",
                fontWeight: 500,
              }}
            />
          )}

          {/* Auto Refresh Timer */}
          {autoRefresh && !isJourneyComplete && (
            <Chip
              icon={<RefreshIcon fontSize="small" />}
              label={`Next refresh: ${nextRefreshIn}s`}
              size="small"
              sx={{
                bgcolor: "info.light",
                color: "info.contrastText",
                fontWeight: 500,
              }}
            />
          )}

          {/* Close Button */}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: "inherit",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.15)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}
      >
        {/* Controls Bar */}
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            {/* Assignment Status instead of Time Range */}
            <Chip
              label={
                isJourneyComplete ? "Journey Complete" : "Journey in Progress"
              }
              color={isJourneyComplete ? "success" : "warning"}
              variant="outlined"
            />

            {assignmentStartTime && (
              <Chip
                label={`Start: ${formatTime(assignmentStartTime)}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {assignmentEndTime && (
              <Chip
                label={`End: ${formatTime(assignmentEndTime)}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}

            {/* Lock Period Selector */}
            {lockPeriods.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Lock Period</InputLabel>
                <Select
                  value={selectedPeriod || ""}
                  label="Lock Period"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="">All Periods</MenuItem>
                  {lockPeriods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      🔒 {period.duration}
                      {period.type === "ongoing" && " (ongoing)"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={toggleAutoRefresh}
                  color="success"
                  disabled={isJourneyComplete}
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {autoRefresh ? (
                    <PlayArrowIcon fontSize="small" />
                  ) : (
                    <PauseIcon fontSize="small" />
                  )}
                  <Typography variant="body2">Auto Refresh</Typography>
                </Stack>
              }
            />

            <Button
              variant="contained"
              size="small"
              startIcon={
                showLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={handleRefresh}
              disabled={showLoading}
            >
              Refresh Now
            </Button>

            <FormControlLabel
              control={
                <Switch
                  checked={showPath}
                  onChange={() => setShowPath(!showPath)}
                  color="primary"
                />
              }
              label="Show Path"
            />

            <Chip
              label={`${sortedData.length} Points`}
              color="info"
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State - Show loader when data is being fetched */}
        {showLoading && !hasData && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
              p: 4,
            }}
          >
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>
                {currentLoading && !historyLoading
                  ? "Loading current status..."
                  : historyLoading && !currentLoading
                  ? "Loading tracking history..."
                  : "Loading tracking data..."}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* No Data State - Only show when loading is complete and there's no data */}
        {!showLoading && !hasData && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No tracking data available for the selected assignment
            </Typography>
          </Box>
        )}

        {/* Main Content - Show when either history data or current info is available */}
        {hasData && (
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Floating Container Details Panel */}
            {containerData && (
              <Paper
                elevation={6}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "30rem",
                  height: "100%",
                  overflowY: "auto",
                  zIndex: 1000,
                  borderRadius: 3,
                  bgcolor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Sticky Header */}
                <Box
                  sx={{
                    position: "sticky",
                    top: 0,
                    bgcolor: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(6px)",
                    borderBottom: "1px solid #eee",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    📦 Container Details
                  </Typography>
                </Box>

                {/* Main Content */}
                <Box sx={{ p: 3 }}>
                  {/* Current Device Status Card */}
                  {currentInfo ? (
                    <Card
                      variant="outlined"
                      sx={{
                        mb: 3,
                        background: "linear-gradient(135deg, #f5f9ff, #eef2ff)",
                        border: "1px solid #dbe2f0",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            mb: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          🔋 Current Device Status
                        </Typography>

                        <Grid container spacing={2}>
                          {/* Online Status */}
                          <Grid item xs={6}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {currentInfo.FOnline === 1 ? (
                                <WifiIcon color="success" />
                              ) : (
                                <WifiOffIcon color="error" />
                              )}
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Online Status
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {currentInfo.FOnline === 1
                                    ? "Online"
                                    : "Offline"}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* Lock Status */}
                          <Grid item xs={6}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {currentInfo.FLockStatus === 1 ? (
                                <LockOpenIcon color="success" />
                              ) : currentInfo.FLockStatus === 0 ? (
                                <LockIcon color="error" />
                              ) : (
                                <LockIcon color="disabled" />
                              )}
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Lock Status
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {currentInfo.FLockStatus === 1
                                    ? "Unlocked"
                                    : currentInfo.FLockStatus === 0
                                    ? "Locked"
                                    : "Undefined"}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* Battery Level */}
                          <Grid item xs={6}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <BatteryChargingFullIcon
                                sx={{
                                  color: getBatteryColor(currentInfo.FBattery),
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Battery Level
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {currentInfo.FBattery}%
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* Cell Signal */}
                          <Grid item xs={6}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <SignalCellularAltIcon
                                sx={{
                                  color:
                                    currentInfo.FCellSignal > 10
                                      ? "#4CAF50"
                                      : currentInfo.FCellSignal > 5
                                      ? "#FFC107"
                                      : "#F44336",
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Cell Signal
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {currentInfo.FCellSignal}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* GPS Time */}
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <AccessTimeIcon color="primary" />
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  GPS Time (UTC)
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {formatTime(currentInfo.FGPSTime)}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* Receive Time */}
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <AccessTimeIcon color="secondary" />
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Data Receive Time (UTC)
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {formatTime(currentInfo.FRecvTime)}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ) : (
                    // Show loading state for current info if it's still loading
                    currentLoading && (
                      <Card
                        variant="outlined"
                        sx={{
                          mb: 3,
                          background:
                            "linear-gradient(135deg, #f5f9ff, #eef2ff)",
                          border: "1px solid #dbe2f0",
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "bold",
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            🔋 Current Device Status
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              p: 3,
                            }}
                          >
                            <Stack alignItems="center" spacing={2}>
                              <CircularProgress size={30} />
                              <Typography variant="body2">
                                Loading current status...
                              </Typography>
                            </Stack>
                          </Box>
                        </CardContent>
                      </Card>
                    )
                  )}

                  {/* Route Section */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      mb: 3,
                      background: "linear-gradient(135deg, #f5f9ff, #eef2ff)",
                      border: "1px solid #dbe2f0",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      justifyContent="center"
                    >
                      <RouteIcon color="primary" />
                      <Typography
                        sx={{
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                          color: "primary.main",
                        }}
                      >
                        Route
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: "1.3rem",
                        fontWeight: 600,
                        textAlign: "center",
                        color: "#333",
                      }}
                    >
                      {containerData.goods_pickup?.name || "Unknown"} ➜{" "}
                      {containerData.goods_delivery?.name || "Unknown"}
                    </Typography>
                  </Paper>

                  {/* Details Section */}
                  <Stack spacing={2.5}>
                    {[
                      {
                        label: "LR Number",
                        value: containerData.tr_no,
                        icon: <ConfirmationNumber color="primary" />,
                      },
                      {
                        label: "Consignee",
                        value: containerData.consignee?.name,
                        icon: <Person color="primary" />,
                      },
                      {
                        label: "Consignor",
                        value: containerData.consignor?.name,
                        icon: <Person color="primary" />,
                      },
                      {
                        label: "Container Number",
                        value: containerData.container_number,
                        icon: <DirectionsBoat color="primary" />,
                      },
                      {
                        label: "E-lock Number",
                        value: getElockNumber(),
                        icon: <Lock color="primary" />,
                      },
                    ].map((item, index) => (
                      <Box
                        key={index}
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: "#f1f5f9",
                            borderRadius: "0.8rem",
                            "&:hover": { bgcolor: "#e2e8f0" },
                          }}
                        >
                          {item.icon}
                        </IconButton>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: "bold", color: "#333" }}
                          >
                            {item.value || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    <Divider sx={{ my: 1 }} />

                    <Typography
                      variant="subtitle2"
                      sx={{
                        mt: 1,
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      Driver & Vehicle Details
                    </Typography>

                    {[
                      {
                        label: "Driver Name",
                        value: containerData.driver_name,
                        icon: <Person color="primary" />,
                      },
                      {
                        label: "Driver Phone",
                        value: containerData.driver_phone,
                        icon: <Phone color="primary" />,
                      },
                      {
                        label: "Vehicle Number",
                        value: containerData.vehicle_no,
                        icon: <DirectionsCar color="primary" />,
                      },
                    ].map((item, index) => (
                      <Box
                        key={index}
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: "#f1f5f9",
                            borderRadius: "0.8rem",
                            "&:hover": { bgcolor: "#e2e8f0" },
                          }}
                        >
                          {item.icon}
                        </IconButton>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: "bold", color: "#333" }}
                          >
                            {item.value || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            )}

            {/* Map Container */}
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                paddingLeft: "500px", // Width of your floating panel + some extra space
                paddingRight: "20px", // Optional: Add some padding on the right too
              }}
            >
              {sortedData.length > 0 ? (
                <MapContainer
                  key={mapKeyRef.current} // Add key to force re-render when elockNo changes
                  center={[
                    sortedData[sortedData.length - 1]?.Lat || 0,
                    sortedData[sortedData.length - 1]?.Lon || 0,
                  ]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  <MapBounds
                    positions={sortedData}
                    onBoundsSet={handleBoundsSet}
                  />

                  {/* Add this component to update the map center when new data arrives */}
                  <MapCenterUpdater
                    center={[
                      sortedData[sortedData.length - 1]?.Lat || 0,
                      sortedData[sortedData.length - 1]?.Lon || 0,
                    ]}
                  />

                  {/* Enhanced Polyline with blue color and dark blue border */}
                  {showPath && sortedData.length > 1 && (
                    <>
                      {/* Dark blue border (slightly wider) */}
                      <Polyline
                        positions={pathPositions}
                        color="#0D47A1" // Dark blue
                        weight={10} // Slightly wider for the border
                        opacity={0.8}
                        smoothFactor={1}
                      />
                      {/* Blue inner line */}
                      <Polyline
                        positions={pathPositions}
                        color="#2196F3" // Blue
                        weight={8} // Slightly narrower than the border
                        opacity={0.9}
                        smoothFactor={1}
                      />
                    </>
                  )}

                  {sortedData.map((point, index) => {
                    // Determine which icon to use for the last point
                    const isLastPoint = index === sortedData.length - 1;
                    let icon;

                    if (isLastPoint) {
                      // Use special icons for the last point based on journey status
                      icon = isJourneyComplete
                        ? createDestinationIcon()
                        : createTruckIcon();
                    } else {
                      // Use numbered icons for all other points
                      icon = createNumberIcon(
                        index + 1,
                        index === 0,
                        false // We handle the last point separately above
                      );
                    }

                    return (
                      <Marker
                        key={`${point.GT}-${index}`} // Use a more stable key
                        position={[point.Lat, point.Lon]}
                        icon={icon}
                        eventHandlers={{
                          click: () => handleMarkerClick(index),
                          mouseover: () => {
                            handleMarkerMouseOver(index);
                          },
                          mouseout: () => {
                            handleMarkerMouseOut();
                            setSelectedPoint(null);
                          },
                        }}
                        opacity={
                          hoveredMarkerIndex === index || isLastPoint ? 1 : 3
                        }
                      >
                        <Popup>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold", mb: 1 }}
                            >
                              Point {index + 1}{" "}
                              {index === 0
                                ? "(Start)"
                                : isLastPoint
                                ? isJourneyComplete
                                  ? "(Destination)"
                                  : "(Current Location)"
                                : ""}
                            </Typography>
                            <Stack spacing={0.5}>
                              <Typography variant="caption">
                                <strong>GPS Time:</strong>{" "}
                                {formatTime(point.GT)}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Receive Time:</strong>{" "}
                                {formatTime(point.RT)}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Position:</strong>{" "}
                                {point.Lat.toFixed(6)}, {point.Lon.toFixed(6)}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Speed:</strong> {point.Speed} km/h
                              </Typography>
                              <Typography variant="caption">
                                <strong>Direction:</strong> {point.Dir}°
                              </Typography>
                              <Typography variant="caption">
                                <strong>Mileage:</strong> {point.Mil} km
                              </Typography>
                              <Typography variant="caption">
                                <strong>Battery:</strong>{" "}
                                <span
                                  style={{ color: getBatteryColor(point.Bat) }}
                                >
                                  {point.Bat}%
                                </span>
                              </Typography>
                              <Typography variant="caption">
                                <strong>Lock:</strong> {getLockStatus(point.LR)}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Location Type:</strong>{" "}
                                <Chip
                                  label={getLocationTypeLabel(point.LType)}
                                  size="small"
                                  color={
                                    point.LType === 1 ? "success" : "warning"
                                  }
                                  sx={{ height: 16, fontSize: "0.7rem" }}
                                />
                              </Typography>
                              <Typography variant="caption">
                                <strong>GPS Signal:</strong> {point.GS}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Cell Signal:</strong> {point.CS}
                              </Typography>
                            </Stack>
                          </Box>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              ) : (
                // Show a placeholder when there's no history data but we have current info
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {historyLoading ? (
                    <>
                      <CircularProgress size={60} />
                      <Typography variant="h6">
                        Loading tracking history...
                      </Typography>
                    </>
                  ) : (
                    <>
                      {/* <LocationIcon sx={{ fontSize: 60, color: "text.secondary" }} /> */}
                      <Typography variant="h6" color="text.secondary">
                        No tracking history available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current device status is available in the panel on the
                        left
                      </Typography>
                    </>
                  )}
                </Box>
              )}

              {/* Map Visualization Loader - Only show for initial load */}
              {mapVisualizationLoading && isInitialLoad && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "rgba(255, 255, 255, 0.8)",
                    zIndex: 1000,
                  }}
                >
                  <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Visualizing tracking data...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please wait while we render all {sortedData.length}{" "}
                      tracking points
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Right Panel - Selected Point Details */}
            {selectedPoint && (
              <Box
                sx={{
                  width: 320,
                  bgcolor: "background.paper",
                  borderLeft: 1,
                  borderColor: "divider",
                  overflowY: "auto",
                }}
              >
                <IconButton
                  aria-label="close"
                  onClick={() => setSelectedPoint(null)}
                  sx={{
                    color: "inherit",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.15)",
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    📍 Point Details
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        GPS Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {formatTime(selectedPoint.GT)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Receive Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {formatTime(selectedPoint.RT)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Coordinates
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", fontFamily: "monospace" }}
                      >
                        {selectedPoint.Lat.toFixed(6)},{" "}
                        {selectedPoint.Lon.toFixed(6)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Speed
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedPoint.Speed} km/h
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Direction
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedPoint.Dir}°
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Mileage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedPoint.Mil} km
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Battery Level
                      </Typography>
                      <Chip
                        label={`${selectedPoint.Bat}%`}
                        size="small"
                        sx={{
                          bgcolor: getBatteryColor(selectedPoint.Bat),
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Lock Status
                      </Typography>
                      <Chip
                        label={getLockStatus(selectedPoint.LR)}
                        size="small"
                        color={selectedPoint.LR === 0 ? "error" : "success"}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Location Type
                      </Typography>
                      <Chip
                        label={getLocationTypeLabel(selectedPoint.LType)}
                        size="small"
                        color={
                          selectedPoint.LType === 1 ? "success" : "warning"
                        }
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        GPS Signal
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedPoint.GS}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cell Signal
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedPoint.CS}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Network Info
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                      >
                        MCC: {selectedPoint.MCC}
                        <br />
                        MNC: {selectedPoint.MNC}
                        <br />
                        LAC: {selectedPoint.LAC}
                        <br />
                        CID: {selectedPoint.CID}
                      </Typography>
                    </Box>

                    {selectedPoint.Temp1 > -1000 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Temperature
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {selectedPoint.Temp1}°C
                        </Typography>
                      </Box>
                    )}

                    {selectedPoint.Hum1 > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Humidity
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {selectedPoint.Hum1}%
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-number-marker {
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .marker-number {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .custom-number-marker:hover {
          transform: scale(1.2);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .custom-truck-marker,
        .custom-destination-marker {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-truck-marker:hover,
        .custom-destination-marker:hover {
          transform: scale(1.2);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }

        .truck-icon,
        .destination-icon {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </Dialog>
  );
};

export default TrackingMap;
