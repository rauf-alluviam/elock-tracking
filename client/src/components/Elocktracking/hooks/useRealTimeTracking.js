import { useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { API_CONFIG, SOCKET_CONFIG } from "../constants/config";

export const useRealTimeTracking = (elockNo) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  const connectToRealTimeTracking = useCallback(() => {
    if (socketRef.current || !elockNo) {
      console.log("🚫 Connection skipped:", {
        socketExists: !!socketRef.current,
        elockNo: elockNo,
        reason: !elockNo ? "No elock number" : "Socket already exists",
      });
      return;
    }

    console.log(`🔌 [ELOCK-GPS] Initiating real-time tracking connection...`, {
      device: elockNo,
      serverUrl: API_CONFIG.SERVER_URL,
      timestamp: new Date().toISOString(),
    });

    const newSocket = io(API_CONFIG.SERVER_URL, SOCKET_CONFIG);

    socketRef.current = newSocket;
    console.log(
      `📡 [SOCKET] Socket.IO instance created for device ${elockNo}`,
      {
        socketId: newSocket.id,
        connected: newSocket.connected,
        transport: newSocket.io.engine?.transport?.name,
      }
    );

    newSocket.on("connect", () => {
      console.log("✅ [CONNECTION] WebSocket connected successfully!", {
        socketId: newSocket.id,
        device: elockNo,
        transport: newSocket.io.engine?.transport?.name,
        timestamp: new Date().toISOString(),
        uptime: 0,
      });
      setIsRealTimeConnected(true);

      // Start tracking this device
      console.log(`🎯 [TRACKING] Starting device tracking for ${elockNo}`);
      newSocket.emit("startTracking", { deviceId: elockNo });

      // Also emit other tracking events
      newSocket.emit("join-elock-tracking");
      newSocket.emit("join-device-room", elockNo);

      console.log(`📤 [EMIT] Sent tracking events:`, {
        startTracking: { deviceId: elockNo },
        joinElockTracking: true,
        joinDeviceRoom: elockNo,
      });
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ [CONNECTION-ERROR] Socket.IO connection failed:", {
        error: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
        timestamp: new Date().toISOString(),
        serverUrl: API_CONFIG.SERVER_URL,
      });
      setError(`Connection failed: ${error.message}`);
    });

    newSocket.on("disconnect", (reason, details) => {
      console.log("❌ [DISCONNECT] WebSocket disconnected:", {
        reason: reason,
        details: details,
        timestamp: new Date().toISOString(),
      });
      setIsRealTimeConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 [RECONNECT] Reconnected after attempts:", attemptNumber);
      setIsRealTimeConnected(true);
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(
        "🔄 [RECONNECT-ATTEMPT] Attempting to reconnect:",
        attemptNumber
      );
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("❌ [RECONNECT-ERROR] Reconnection failed:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error(
        "❌ [RECONNECT-FAILED] Failed to reconnect after all attempts"
      );
      setError("Failed to reconnect to server");
    });

    // Generic handler function for all real-time updates
    const handleRealTimeUpdate = (data, eventType) => {
      if (data.deviceId === elockNo) {
        const updateTime = new Date().toLocaleString();
        const newUpdate = {
          ...data,
          timestamp: updateTime,
          type: eventType,
          rawData: JSON.stringify(data, null, 2),
        };

        setRealTimeData(newUpdate);
        setRealTimeUpdates((prev) => [newUpdate, ...prev.slice(0, 49)]);
      }
    };

    // Handle all socket event types
    ["positionUpdate", "statusUpdate", "alarm", "device-position", "device-status", "status-update"].forEach(eventType => {
      newSocket.on(eventType, (data) => {
        console.log(`📍 ${eventType}:`, data);
        handleRealTimeUpdate(data, eventType);
      });
    });

    newSocket.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
      setError(`Real-time tracking error: ${error.message}`);
    });
  }, [elockNo]);

  const disconnectFromRealTimeTracking = useCallback(() => {
    if (socketRef.current) {
      console.log("Disconnecting from real-time tracking");
      socketRef.current.emit("stopTracking", { deviceId: elockNo });
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsRealTimeConnected(false);
      setRealTimeData(null);
    }
  }, [elockNo]);

  return {
    realTimeData,
    isRealTimeConnected,
    realTimeUpdates,
    setRealTimeUpdates,
    connectToRealTimeTracking,
    disconnectFromRealTimeTracking,
    setRealTimeData,
    error: error,
  };
};
