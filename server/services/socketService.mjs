import { Server } from "socket.io";
import logger from "../logger.js";

// Reduced logging - only show when needed
// console.log("🚀 [MODULE-LOAD] socketService.mjs loaded at " + new Date().toISOString());

let io = null;
const connectedClients = new Map();
const connectionHistory = new Map(); // Track connection patterns by IP
let connectionLogger = null; // Store the logging interval

// Socket.IO connection monitoring - reduced logging frequency
const startConnectionLogging = () => {
  if (connectionLogger) return; // Already running

  // Reduced verbosity - only log when there are connections
  connectionLogger = setInterval(() => {
    const activeConnections = Array.from(connectedClients.values());
    const totalConnections = activeConnections.length;

    if (totalConnections > 0) {
      console.log(`🔌 Socket.IO: ${totalConnections} active connection(s)`);
      // Removed detailed per-client logging for cleaner output
    } else {
      // Only log no connections occasionally (every 10th interval)
      if (Math.random() < 0.1) {
        console.log(`🔌 Socket.IO Status - No active connections`);
      }
    }
    // Log connection history summary (reduced frequency)
    const totalUniqueIPs = connectionHistory.size;
    if (totalUniqueIPs > 0 && Math.random() < 0.2) {
      console.log(`📊 Connection History - Unique IPs: ${totalUniqueIPs}`);
    }
  }, 30000); // Every 30 seconds
};

// Stop connection logging
const stopConnectionLogging = () => {
  if (connectionLogger) {
    clearInterval(connectionLogger);
    connectionLogger = null;
    console.log(`⏹️ Socket.IO connection logging stopped`);
  }
};

export const initializeSocketIO = (httpServer) => {
  console.log("🔧 Initializing Socket.IO server...");
  // Reduced startup logging

  io = new Server(httpServer, {
    path: "/socket.io", // Use standard Socket.IO path
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:9005", // Allow self-origin
        "http://127.0.0.1:9005", // Allow self-origin
        "http://eximdev.s3-website.ap-south-1.amazonaws.com",
        "http://test-ssl-exim.s3-website.ap-south-1.amazonaws.com",
        "http://exim-transport.s3-website.ap-south-1.amazonaws.com",
        "http://eximdev.s3-website.ap-south-1.amazonaws.com/",
        "http://devtransport.s3-website.ap-south-1.amazonaws.com/",
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type"],
    },
    transports: ["polling", "websocket"], // Start with polling, allow upgrade to websocket
    allowEIO3: true,
    pingTimeout: 60000, // Increased for stability
    pingInterval: 25000, // Standard interval
    upgradeTimeout: 30000, // Time to wait for transport upgrade
    maxHttpBufferSize: 1e6, // 1MB buffer size
    connectTimeout: 45000, // Increased connection timeout
    serveClient: false, // Don't serve the client files
    allowUpgrades: true, // Allow transport upgrades
    cookie: false, // Disable cookies for better performance
  });

  // Reduced connection event logging

  // Simplified error handling
  io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO connection error:", err.message);
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id.substring(0, 8)}...`);

    const clientIP =
      socket.request.headers["x-forwarded-for"] ||
      socket.request.connection.remoteAddress ||
      "unknown";

    // Reduced client info logging
    // console.log(`📊 Client IP: ${clientIP}`);

    // Immediately join the client to default rooms
    socket.join("elock-tracking");
    socket.join("alarm-monitoring");

    // Track connection patterns to detect rapid reconnects
    const now = Date.now();
    if (!connectionHistory.has(clientIP)) {
      connectionHistory.set(clientIP, []);
    }
    const ipHistory = connectionHistory.get(clientIP);
    ipHistory.push(now);

    // Keep only last 10 connections and clean old ones (older than 1 minute)
    const recentConnections = ipHistory
      .filter((time) => now - time < 60000)
      .slice(-10);
    connectionHistory.set(clientIP, recentConnections);

    // Check for rapid reconnection pattern (more than 5 connections in last 30 seconds)
    const rapidConnections = recentConnections.filter(
      (time) => now - time < 30000
    );
    if (rapidConnections.length > 5) {
      console.log(
        `⚠️ Rapid reconnection detected from IP ${clientIP}: ${rapidConnections.length} connections in 30s`
      );
    }

    console.log(
      `✅ WebSocket client connected: ${socket.id} (IP: ${clientIP})`
    );
    logger.info(`Client connected: ${socket.id} from ${clientIP}`);

    // Add connection stability timeout
    const connectionStabilityTimeout = setTimeout(() => {
      console.log(`🔄 Connection stabilized for client: ${socket.id}`);
      // Mark connection as stable
      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.isStable = true;
        console.log(`✅ Connection marked as stable for client: ${socket.id}`);
      }
    }, 2000); // 2 second stability check

    connectedClients.set(socket.id, {
      socketId: socket.id,
      connectedAt: new Date(),
      rooms: new Set(["elock-tracking", "alarm-monitoring"]),
      isStable: false,
      stabilityTimeout: connectionStabilityTimeout,
      clientIP: clientIP,
    });

    // Join device-specific room for tracking
    socket.on("join-device-room", (deviceId) => {
      const roomName = `device_${deviceId}`;
      socket.join(roomName);

      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.add(roomName);
      }

      console.log(
        `🏠 [ROOM-JOIN] Client ${socket.id} joined device room: ${roomName}`
      );
      console.log(
        `📊 [ROOM-STATUS] Room ${roomName} now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } clients`
      );

      logger.info(`Client ${socket.id} joined room: ${roomName}`);
      socket.emit("joined-room", { room: roomName, deviceId });
    });

    // Leave device room
    socket.on("leave-device-room", (deviceId) => {
      const roomName = `device_${deviceId}`;
      socket.leave(roomName);

      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.delete(roomName);
      }

      console.log(
        `🚪 [ROOM-LEAVE] Client ${socket.id} left device room: ${roomName}`
      );
      console.log(
        `📊 [ROOM-STATUS] Room ${roomName} now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } clients`
      );

      logger.info(`Client ${socket.id} left room: ${roomName}`);
      socket.emit("left-room", { room: roomName, deviceId });
    });

    // Handle device tracking start/stop
    socket.on("start-tracking", (deviceId) => {
      const roomName = `device_${deviceId}`;
      socket.join(roomName);

      console.log(
        `🎯 [START-TRACKING] Started tracking device ${deviceId} for client ${socket.id}`
      );
      console.log(
        `📊 [TRACKING-STATUS] Device ${deviceId} room now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } trackers`
      );

      logger.info(
        `Started tracking device ${deviceId} for client ${socket.id}`
      );
      socket.emit("tracking-started", { deviceId });
    });

    socket.on("startTracking", (data) => {
      const deviceId = data.deviceId;
      const roomName = `device_${deviceId}`;
      socket.join(roomName);

      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.add(roomName);
      }

      console.log(
        `🎯 [START-TRACKING] Started tracking device ${deviceId} for client ${socket.id} (compatibility event)`
      );
      console.log(
        `📊 [TRACKING-STATUS] Device ${deviceId} room now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } trackers`
      );

      // Start actual device tracking in the ELock API service
      (async () => {
        try {
          console.log(
            `🔄 [ELOCK-SERVICE] Starting ELock API tracking for device: ${deviceId}`
          );
          const { default: elockApiService } = await import(
            "./elockApiService.mjs"
          );
          await elockApiService.startTracking(deviceId);
          console.log(
            `✅ [ELOCK-SERVICE] ELock API tracking started for device: ${deviceId}`
          );
        } catch (error) {
          console.error(
            `❌ [ELOCK-SERVICE] Failed to start ELock API tracking for ${deviceId}:`,
            error.message
          );
        }
      })();

      logger.info(
        `Started tracking device ${deviceId} for client ${socket.id}`
      );
      socket.emit("tracking-started", { deviceId });
    });

    socket.on("stop-tracking", (deviceId) => {
      const roomName = `device_${deviceId}`;
      socket.leave(roomName);

      console.log(
        `⏹️ [STOP-TRACKING] Stopped tracking device ${deviceId} for client ${socket.id}`
      );
      console.log(
        `📊 [TRACKING-STATUS] Device ${deviceId} room now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } trackers`
      );

      logger.info(
        `Stopped tracking device ${deviceId} for client ${socket.id}`
      );
      socket.emit("tracking-stopped", { deviceId });
    });

    socket.on("stopTracking", (data) => {
      const deviceId = data.deviceId;
      const roomName = `device_${deviceId}`;
      socket.leave(roomName);

      console.log(
        `⏹️ [STOP-TRACKING] Stopped tracking device ${deviceId} for client ${socket.id} (compatibility event)`
      );
      console.log(
        `📊 [TRACKING-STATUS] Device ${deviceId} room now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } trackers`
      );

      logger.info(
        `Stopped tracking device ${deviceId} for client ${socket.id}`
      );
      socket.emit("tracking-stopped", { deviceId });
    });

    // MQTT ELock Integration - Real-time position tracking
    socket.on("join-elock-tracking", () => {
      socket.join("elock-tracking");
      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.add("elock-tracking");
      }
      logger.info(`Client ${socket.id} joined ELock tracking room`);
      socket.emit("joined-room", { room: "elock-tracking" });
    });

    socket.on("leave-elock-tracking", () => {
      socket.leave("elock-tracking");
      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.delete("elock-tracking");
      }
      logger.info(`Client ${socket.id} left ELock tracking room`);
      socket.emit("left-room", { room: "elock-tracking" });
    });

    // Join alarm monitoring
    socket.on("join-alarm-monitoring", () => {
      socket.join("alarm-monitoring");
      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.add("alarm-monitoring");
      }
      logger.info(`Client ${socket.id} joined alarm monitoring room`);
      socket.emit("joined-room", { room: "alarm-monitoring" });
    });

    socket.on("leave-alarm-monitoring", () => {
      socket.leave("alarm-monitoring");
      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.rooms.delete("alarm-monitoring");
      }
      logger.info(`Client ${socket.id} left alarm monitoring room`);
      socket.emit("left-room", { room: "alarm-monitoring" });
    });

    // Get device status from MQTT cache
    socket.on("get-device-status", async (deviceId) => {
      try {
        const { default: mqttService } = await import("./mqttService.mjs");
        const deviceData = mqttService.getDeviceData(deviceId);
        socket.emit("device-status", deviceData);
      } catch (error) {
        logger.error("Error getting device status:", error);
        socket.emit("device-status", null);
      }
    });

    // Get all devices from MQTT cache
    socket.on("get-all-devices", async () => {
      try {
        const { default: mqttService } = await import("./mqttService.mjs");
        const allDevices = mqttService.getAllDevices();
        socket.emit("all-devices", allDevices);
      } catch (error) {
        logger.error("Error getting all devices:", error);
        socket.emit("all-devices", []);
      }
    });

    // Get MQTT connection status
    socket.on("get-mqtt-status", async () => {
      try {
        const { default: mqttService } = await import("./mqttService.mjs");
        const status = {
          connected: mqttService.isClientConnected(),
          timestamp: new Date(),
        };
        socket.emit("mqtt-status", status);
      } catch (error) {
        logger.error("Error getting MQTT status:", error);
        socket.emit("mqtt-status", {
          connected: false,
          error: error.message,
        });
      }
    });

    // Send device command via MQTT
    socket.on("send-device-command", async (data) => {
      try {
        const { deviceId, command, commandData = {} } = data;

        if (!deviceId || !command) {
          socket.emit("command-error", {
            error: "Device ID and command are required",
          });
          return;
        }

        const { default: mqttService } = await import("./mqttService.mjs");
        const topic = `command/${deviceId}/${command}`;
        const message = {
          deviceId,
          command,
          data: commandData,
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          sourceSocket: socket.id,
        };

        mqttService.publish(topic, message);
        socket.emit("command-sent", {
          deviceId,
          command,
          requestId: message.requestId,
        });

        logger.info(`Command sent to device ${deviceId}: ${command}`);
      } catch (error) {
        logger.error("Error sending device command:", error);
        socket.emit("command-error", { error: error.message });
      }
    });

    // Ping/Pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });

    // Handle client disconnect
    socket.on("disconnect", async (reason) => {
      const clientInfo = connectedClients.get(socket.id);
      const connectionDuration = clientInfo
        ? Date.now() - clientInfo.connectedAt.getTime()
        : 0;

      console.log(
        `❌ WebSocket client disconnected: ${socket.id}, reason: ${reason}, duration: ${connectionDuration}ms`
      );
      logger.info(
        `Client disconnected: ${socket.id}, reason: ${reason}, duration: ${connectionDuration}ms`
      );

      // Clear stability timeout if it exists
      if (clientInfo && clientInfo.stabilityTimeout) {
        clearTimeout(clientInfo.stabilityTimeout);
      }

      // Only cleanup for this specific client - don't stop global services
      if (clientInfo) {
        // Leave all rooms this client was in
        if (clientInfo.rooms && clientInfo.rooms.size > 0) {
          console.log(
            `🚪 [CLIENT-CLEANUP] Removing client ${socket.id} from ${clientInfo.rooms.size} rooms`
          );
          clientInfo.rooms.forEach((roomName) => {
            socket.leave(roomName);
            console.log(
              `🚪 [CLIENT-CLEANUP] Client ${socket.id} left room: ${roomName}`
            );
          });
        }

        // Handle GPS cleanup for this specific client only
        if (clientInfo.subscribedElock && connectionDuration > 2000) {
          try {
            const { default: realTimeTrackingService } = await import(
              "../services/realTimeTrackingService.mjs"
            );
            realTimeTrackingService.removeClient(
              clientInfo.subscribedElock,
              socket.id
            );
            console.log(
              `⏹️ [CLIENT-CLEANUP] Removed GPS client for E-lock: ${clientInfo.subscribedElock} (client ${socket.id} disconnected after ${connectionDuration}ms)`
            );
          } catch (error) {
            console.error(
              `❌ [CLIENT-CLEANUP] Failed to remove GPS client on disconnect:`,
              error
            );
          }
        } else if (clientInfo.subscribedElock) {
          console.log(
            `⚡ [CLIENT-CLEANUP] Ignoring GPS cleanup for short-lived connection: ${socket.id} (duration: ${connectionDuration}ms)`
          );
        }
      }

      // Remove this client from connected clients map
      connectedClients.delete(socket.id);

      console.log(
        `🧹 [CLIENT-CLEANUP] Client ${socket.id} cleanup completed. Remaining clients: ${connectedClients.size}`
      );
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  // Start connection monitoring (reduced frequency)
  startConnectionLogging();

  // Removed demo broadcast
  // setTimeout(() => {
  //   if (io) {
  //     console.log("🧪 [DEMO] Running test broadcast to demonstrate live data logging...");
  //     // testLiveDataBroadcast();
  //   }
  // }, 15000);

  logger.info(
    "Socket.IO server initialized with live data broadcasting enabled"
  );
  return io;
};

export const cleanupSocketIO = async () => {
  console.log(
    "🧹 [GLOBAL-CLEANUP] Starting Socket.IO server shutdown process..."
  );

  stopConnectionLogging();

  // Only stop all services when shutting down the entire server
  // NOT when individual clients disconnect
  try {
    console.log("🛑 [GLOBAL-CLEANUP] Stopping ELock API service...");
    const { default: elockApiService } = await import("./elockApiService.mjs");
    if (
      elockApiService &&
      typeof elockApiService.stopAllTracking === "function"
    ) {
      elockApiService.stopAllTracking();
      console.log("✅ [GLOBAL-CLEANUP] ELock API tracking stopped");
    }
    if (elockApiService && typeof elockApiService.destroy === "function") {
      elockApiService.destroy();
      console.log("✅ [GLOBAL-CLEANUP] ELock API service destroyed");
    }
  } catch (error) {
    console.warn(
      "⚠️ [GLOBAL-CLEANUP] Failed to stop ELock API service:",
      error.message
    );
  }

  // Cleanup MQTT subscriptions only on server shutdown
  try {
    console.log("🛑 [GLOBAL-CLEANUP] Stopping MQTT service...");
    const { default: mqttService } = await import("./mqttService.mjs");
    if (mqttService && typeof mqttService.cleanup === "function") {
      mqttService.cleanup();
      console.log(
        "✅ [GLOBAL-CLEANUP] MQTT service cleaned up and disconnected"
      );
    } else if (mqttService && typeof mqttService.disconnect === "function") {
      mqttService.disconnect();
      console.log("✅ [GLOBAL-CLEANUP] MQTT service disconnected");
    }
  } catch (error) {
    console.warn(
      "⚠️ [GLOBAL-CLEANUP] Failed to stop MQTT service:",
      error.message
    );
  }

  // Clear all connected clients
  console.log(
    `🧹 [GLOBAL-CLEANUP] Clearing ${connectedClients.size} connected clients...`
  );
  for (const [socketId, clientInfo] of connectedClients.entries()) {
    if (clientInfo.stabilityTimeout) {
      clearTimeout(clientInfo.stabilityTimeout);
    }
  }
  connectedClients.clear();

  // Clear connection history
  connectionHistory.clear();

  if (io) {
    console.log("🔌 [GLOBAL-CLEANUP] Closing Socket.IO server...");
    io.close();
    io = null; // Set to null to prevent further use
    console.log(`🔌 Socket.IO server closed and cleaned up`);
  }

  console.log(
    "✅ [GLOBAL-CLEANUP] Socket.IO server shutdown completed - All services stopped"
  );
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initializeSocketIO first."
    );
  }
  return io;
};

// Emit GPS update to subscribed clients
export const emitGPSUpdate = (elockNo, gpsData) => {
  if (!io) {
    logger.warn("Socket.IO not initialized, cannot emit GPS update");
    return;
  }

  const roomName = `gps_${elockNo}`;
  const updateData = {
    elockNo,
    latitude: gpsData.latitude,
    longitude: gpsData.longitude,
    speed: gpsData.speed || 0,
    battery: gpsData.battery || 100,
    distance: gpsData.distance || 0,
    direction: gpsData.direction || 0,
    accuracy: gpsData.accuracy || 0,
    timestamp: gpsData.timestamp || new Date().toISOString(),
    status: gpsData.status || "moving",
  };

  console.log(
    `📍 Emitting GPS update for E-lock ${elockNo} to room ${roomName}:`,
    updateData
  );
  io.to(roomName).emit("gps_update", updateData);
  logger.info(`Emitted GPS update for E-lock ${elockNo}`, updateData);
};

// Emit to specific device room
export const emitToDeviceRoom = (deviceId, event, data) => {
  if (!io) {
    logger.warn("Socket.IO not initialized, cannot emit event");
    return;
  }

  const roomName = `device_${deviceId}`;
  io.to(roomName).emit(event, data);
  logger.debug(`Emitted ${event} to room ${roomName}:`, data);
};

// Emit to all connected clients
export const emitToAll = (event, data) => {
  if (!io) {
    logger.warn("Socket.IO not initialized, cannot emit event");
    return;
  }

  io.emit(event, data);
  logger.debug(`Emitted ${event} to all clients:`, data);
};

// MQTT Integration - Emit position updates to ELock tracking room
export const emitPositionUpdate = (deviceId, positionData) => {
  console.log(`🔔 [DEBUG] emitPositionUpdate called for device: ${deviceId}`);

  // **ENHANCED DEBUG** - Check if this is device 8294630164
  if (deviceId === "8294630164") {
    console.log(`🎯 [TARGET-DEVICE] LIVE DATA FOR DEVICE 8294630164 DETECTED!`);
    console.log(
      `🎯 [TARGET-DEVICE] Position data:`,
      JSON.stringify(positionData, null, 2)
    );
    console.log(`🎯 [TARGET-DEVICE] Socket.IO initialized:`, !!io);
    console.log(
      `🎯 [TARGET-DEVICE] Connected clients:`,
      io ? io.engine.clientsCount : 0
    );
  }

  if (!io) {
    console.warn(
      "⚠️ [EMIT-POSITION] Socket.IO not initialized, cannot emit position update"
    );
    logger.warn("Socket.IO not initialized, cannot emit position update");
    return;
  }

  if (!positionData) {
    console.warn("⚠️ [EMIT-POSITION] positionData is undefined!");
    if (deviceId === "8294630164") {
      console.log(
        `🎯 [TARGET-DEVICE] ERROR: No position data for device 8294630164!`
      );
    }
    return;
  }

  // Enhanced console log showing all real-time data being broadcast
  console.log("📡 [LIVE-BROADCAST] Broadcasting real-time data live:", {
    deviceId: deviceId,
    timestamp: positionData.timestamp,
    position: {
      latitude: positionData.latitude,
      longitude: positionData.longitude,
      speed: positionData.speed || 0,
    },
    battery: `${positionData.battery || 0}%`,
    lockStatus: positionData.lockStatus || "unknown",
    alarms: positionData.alarm || "none",
    online: positionData.online ? "ONLINE" : "OFFLINE",
    connectedClients: io.engine.clientsCount,
  });

  console.log("📡 [EMIT-POSITION] Broadcasting position update...", {
    deviceId: deviceId,
    timestamp: positionData.timestamp,
    location: {
      lat: positionData.latitude,
      lng: positionData.longitude,
      speed: positionData.speed,
    },
    battery: positionData.battery,
    online: positionData.online,
    connectedClients: io.engine.clientsCount,
  });

  // Emit to device-specific room
  const deviceRoom = `device_${deviceId}`;
  console.log(`📤 [ROOM-EMIT] Emitting to device room: ${deviceRoom}`);

  // **ENHANCED DEBUG** - Check room occupancy for device 8294630164
  if (deviceId === "8294630164") {
    const roomSize = io.sockets.adapter.rooms.get(deviceRoom)?.size || 0;
    console.log(
      `🎯 [TARGET-DEVICE] Room ${deviceRoom} has ${roomSize} clients listening`
    );
    console.log(`🎯 [TARGET-DEVICE] Broadcasting position update NOW!`);
  }

  io.to(deviceRoom).emit("position-update", positionData);

  // Emit to general ELock tracking room
  console.log(`📤 [ROOM-EMIT] Emitting to elock-tracking room`);
  io.to("elock-tracking").emit("device-position", positionData);

  // Also emit as positionUpdate for compatibility
  console.log(`📤 [ROOM-EMIT] Emitting positionUpdate event for compatibility`);
  io.to(deviceRoom).emit("positionUpdate", positionData);
  io.to("elock-tracking").emit("positionUpdate", positionData);

  console.log(
    `✅ [EMIT-SUCCESS] Position update broadcasted for device ${deviceId} to ${io.engine.clientsCount} clients`
  );

  logger.info(
    `📡 Emitted position update for device ${deviceId} to ${io.engine.clientsCount} clients`
  );
};

// MQTT Integration - Emit alarm to monitoring room
export const emitAlarm = (deviceId, alarmData) => {
  if (!io) {
    logger.warn("Socket.IO not initialized, cannot emit alarm");
    return;
  }

  // Emit to device-specific room
  const deviceRoom = `device_${deviceId}`;
  io.to(deviceRoom).emit("alarm", alarmData);

  // Emit to alarm monitoring room
  io.to("alarm-monitoring").emit("device-alarm", alarmData);

  logger.warn(`Emitted alarm for device ${deviceId}: ${alarmData.alarmType}`);
};

// MQTT Integration - Emit status update
export const emitStatusUpdate = (deviceId, statusData) => {
  console.log(`🔔 [DEBUG] emitStatusUpdate called for device: ${deviceId}`);

  // **ENHANCED DEBUG** - Check if this is device 8294630164
  if (deviceId === "8294630164") {
    console.log(
      `🎯 [TARGET-DEVICE] LIVE STATUS FOR DEVICE 8294630164 DETECTED!`
    );
    console.log(
      `🎯 [TARGET-DEVICE] Status data:`,
      JSON.stringify(statusData, null, 2)
    );
    console.log(`🎯 [TARGET-DEVICE] Socket.IO initialized:`, !!io);
    console.log(
      `🎯 [TARGET-DEVICE] Connected clients:`,
      io ? io.engine.clientsCount : 0
    );
  }

  if (!io) {
    console.warn(
      "⚠️ [EMIT-STATUS] Socket.IO not initialized, cannot emit status update"
    );
    logger.warn("Socket.IO not initialized, cannot emit status update");
    return;
  }

  if (!statusData) {
    console.warn("⚠️ [EMIT-STATUS] statusData is undefined!");
    if (deviceId === "8294630164") {
      console.log(
        `🎯 [TARGET-DEVICE] ERROR: No status data for device 8294630164!`
      );
    }
    return;
  }

  console.log("📊 [EMIT-STATUS] Broadcasting status update...", {
    deviceId: deviceId,
    timestamp: statusData.timestamp,
    battery: statusData.battery,
    online: statusData.online,
    lockStatus: statusData.lockStatus,
    alarm: statusData.alarm,
    signals: statusData.signals,
    connectedClients: io.engine.clientsCount,
  });

  // Emit to device-specific room
  const deviceRoom = `device_${deviceId}`;
  console.log(`📤 [ROOM-EMIT] Emitting status to device room: ${deviceRoom}`);

  // **ENHANCED DEBUG** - Check room occupancy for device 8294630164
  if (deviceId === "8294630164") {
    const roomSize = io.sockets.adapter.rooms.get(deviceRoom)?.size || 0;
    console.log(
      `🎯 [TARGET-DEVICE] Room ${deviceRoom} has ${roomSize} clients listening`
    );
    console.log(`🎯 [TARGET-DEVICE] Broadcasting status update NOW!`);
  }

  io.to(deviceRoom).emit("status-update", statusData);

  // Emit to general ELock tracking room
  console.log(`📤 [ROOM-EMIT] Emitting status to elock-tracking room`);
  io.to("elock-tracking").emit("device-status", statusData);

  // Also emit as statusUpdate for compatibility
  console.log(`📤 [ROOM-EMIT] Emitting statusUpdate event for compatibility`);
  io.to(deviceRoom).emit("statusUpdate", statusData);
  io.to("elock-tracking").emit("statusUpdate", statusData);

  console.log(
    `✅ [EMIT-SUCCESS] Status update broadcasted for device ${deviceId}`
  );

  logger.debug(`Emitted status update for device ${deviceId}`);
};

// Emit to specific room
export const emitToRoom = (room, event, data) => {
  if (!io) {
    logger.warn("Socket.IO not initialized, cannot emit to room");
    return;
  }

  io.to(room).emit(event, data);
  logger.debug(`Emitted ${event} to room ${room}`);
};

// Get connection stats
export const getConnectionStats = () => {
  return {
    totalConnections: connectedClients.size,
    clients: Array.from(connectedClients.values()).map((client) => ({
      socketId: client.socketId,
      connectedAt: client.connectedAt,
      roomCount: client.rooms.size,
      rooms: Array.from(client.rooms),
    })),
  };
};

// // Test function to simulate live data broadcast (for testing purposes)
// export const testLiveDataBroadcast = () => {
//   console.log("🧪 [TEST] Simulating live data broadcast...");

//   // Simulate position data
//   const testPositionData = {
//     deviceId: "TEST_DEVICE_001",
//     timestamp: new Date().toISOString(),
//     latitude: 12.9716,
//     longitude: 77.5946,
//     speed: 45,
//     battery: 78,
//     lockStatus: "locked",
//     alarm: "none",
//     online: true,
//   };

//   emitPositionUpdate("TEST_DEVICE_001", testPositionData);

//   // Simulate status data
//   const testStatusData = {
//     deviceId: "TEST_DEVICE_001",
//     timestamp: new Date().toISOString(),
//     battery: 78,
//     online: true,
//     lockStatus: "locked",
//     alarm: "none",
//     signals: { gps: 4, gsm: 3 },
//   };

//   emitStatusUpdate("TEST_DEVICE_001", testStatusData);

//   console.log("🧪 [TEST] Test broadcast completed");
// };

export default {
  initializeSocketIO,
  cleanupSocketIO,
  getSocketIO,
  emitToDeviceRoom,
  emitToAll,
  emitGPSUpdate,
  emitPositionUpdate,
  emitAlarm,
  emitStatusUpdate,
  emitToRoom,
  getConnectionStats,
  startConnectionLogging,
  stopConnectionLogging,
  // testLiveDataBroadcast,
};
