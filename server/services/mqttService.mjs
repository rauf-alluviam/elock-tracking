import mqtt from "mqtt";
import {
  emitPositionUpdate,
  emitAlarm,
  emitStatusUpdate,
} from "./socketService.mjs";
import logger from "../logger.js";

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.deviceCache = new Map(); // Cache for device data
    this.lastUpdateTime = new Map(); // Track last update times
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; // Reduced from 10 to 3
    this.isShuttingDown = false;
    this.connectionTimeout = null;
  }

  // Initialize MQTT connection
  connect() {
    if (this.isShuttingDown) {
      logger.info("MQTT service is shutting down, skipping connection attempt");
      return;
    }

    const mqttOptions = {
      username: process.env.MQTT_USER || "alluvium",
      password: process.env.MQTT_PASSWORD || "cc093134255d6a0d77e590f4e847b84f",
      clientId: `exim-server-${Math.random().toString(16).substr(2, 8)}`,
      keepalive: 60,
      reconnectPeriod: 0, // Disable auto-reconnect to prevent auth failure loops
      connectTimeout: 15000, // Reduced to 15 seconds
      clean: true,
    };

    const brokerUrl =
      process.env.MQTT_BROKER_URL || "mqtt://mqtt.assetscontrols.com:1883";

    try {
      this.client = mqtt.connect(brokerUrl, mqttOptions);
      this.setupEventHandlers();
      logger.info("MQTT client created, attempting connection...");

      // Set a timeout to prevent hanging connections
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected && this.client) {
          logger.warn("MQTT connection timeout - falling back to HTTP API");
          this.isShuttingDown = true;
          this.client.end(true);
        }
      }, 20000); // 20 second timeout
    } catch (error) {
      logger.error("Error creating MQTT client:", error);
    }
  }

  setupEventHandlers() {
    this.client.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      logger.info("✅ MQTT Connected to broker");

      // Subscribe to all device topics
      const topics = [
        "upload/+/+/location", // Position updates
        "upload/+/+/alarm", // Alarm notifications
        "upload/+/+/status", // Status updates
      ];

      topics.forEach((topic) => {
        this.client.subscribe(topic, (err) => {
          if (err) {
            logger.error(`Failed to subscribe to ${topic}:`, err);
          } else {
            logger.info(`📡 Subscribed to topic: ${topic}`);
          }
        });
      });
    });

    this.client.on("message", async (topic, message) => {
      try {
        await this.handleMessage(topic, message);
      } catch (error) {
        logger.error("Error handling MQTT message:", error);
      }
    });

    this.client.on("error", (error) => {
      this.isConnected = false;

      // Handle authorization errors specifically
      if (error.code === 5 || error.message.includes("Not authorized")) {
        logger.warn("MQTT authorization failed - falling back to HTTP API");
        this.isShuttingDown = true;
        this.client.end(true);
        return;
      }

      logger.error("MQTT connection error:", error);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      logger.warn("❌ MQTT connection closed");
    });

    this.client.on("disconnect", () => {
      this.isConnected = false;
      if (!this.isShuttingDown) {
        logger.warn("MQTT disconnected - using HTTP API fallback");
      }
    });
  }

  async handleMessage(topic, message) {
    try {
      // Check if Socket.IO service is available and has clients
      let hasActiveClients = false;
      try {
        const { getSocketIO } = await import("./socketService.mjs");
        const io = getSocketIO();
        hasActiveClients = io && io.engine.clientsCount > 0;
      } catch (error) {
        // Socket.IO service not available or no clients
        hasActiveClients = false;
      }

      // Skip processing if no active clients (prevents data logging when disconnected)
      if (!hasActiveClients) {
        return;
      }

      // **ENHANCED DEBUG** - Check for device 8294630164
      if (topic.includes("8294630164")) {
        console.log(
          `🎯 [MQTT-DEBUG] Message for target device 8294630164:`,
          message.toString().substring(0, 100)
        );
      }

      const data = JSON.parse(message.toString());
      const topicParts = topic.split("/");
      const topicType = topicParts[topicParts.length - 1]; // location, alarm, or status

      // Extract device ID from data (try different field names)
      const deviceId =
        data.assetId || data.assetsId || data.deviceId || data.imei;

      if (!deviceId) {
        logger.warn("No device ID found in MQTT message:", { topic, data });
        return;
      }

      // Rate limiting - only process updates every 4 seconds per device
      const now = Date.now();
      const lastUpdate = this.lastUpdateTime.get(deviceId) || 0;

      if (topicType === "location" && now - lastUpdate < 4000) {
        return; // Skip if less than 4 seconds since last update
      }

      this.lastUpdateTime.set(deviceId, now);

      switch (topicType) {
        case "location":
          this.handlePositionUpdate(deviceId, data);
          break;
        case "alarm":
          this.handleAlarm(deviceId, data);
          break;
        case "status":
          this.handleStatusUpdate(deviceId, data);
          break;
        default:
          logger.warn("Unknown topic type:", topicType);
      }
    } catch (error) {
      logger.error("Error parsing MQTT message:", error);
    }
  }

  handlePositionUpdate(deviceId, data) {
    try {
      // Validate required fields
      if (!data.latitude || !data.longitude) {
        logger.warn("Invalid position data - missing coordinates:", {
          deviceId,
          data,
        });
        return;
      }

      // Parse position data according to ELock format
      const positionData = {
        deviceId,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        speed: data.speed || 0,
        heading: data.heading || data.direction || 0,
        altitude: data.altitude || 0,
        accuracy: data.accuracy || 0,
        battery:
          data.battery !== undefined
            ? data.battery === 255
              ? "charging"
              : `${data.battery}%`
            : "unknown",
        satellites: data.satellites || 0,
        gpsTime: data.gpsTime ? new Date(data.gpsTime) : new Date(),
        serverTime: new Date(),
        status: "online",
        // Additional ELock specific data
        voltage: data.voltage || 0,
        temperature: data.temperature || 0,
        humidity: data.humidity || 0,
        signal: data.signal || 0,
      };

      // Cache the device data
  this.deviceCache.set(deviceId, positionData);

  // Emit to WebSocket clients using existing socketService functions
  emitPositionUpdate(deviceId, positionData);

  // Detailed logging for debugging
  logger.info(`📍 [DETAILED] Position update for device ${deviceId}:`);
  logger.info(`    Timestamp: ${positionData.timestamp || positionData.gpsTime || 'N/A'}`);
  logger.info(`    Full Payload:`, positionData);
    } catch (error) {
      logger.error("Error handling position update:", error);
    }
  }

  handleAlarm(deviceId, data) {
    try {
      const alarmData = {
        deviceId,
        alarmType: data.alarmType || data.type || "unknown",
        message: this.getAlarmMessage(data.alarmType || data.type),
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        timestamp: new Date(data.timestamp || data.gpsTime) || new Date(),
        severity: this.getAlarmSeverity(data.alarmType || data.type),
        rawData: data,
      };

      // Emit alarm to WebSocket clients using existing socketService functions
      emitAlarm(deviceId, alarmData);

      logger.warn(`🚨 Alarm for device ${deviceId}:`, {
        type: alarmData.alarmType,
        message: alarmData.message,
        severity: alarmData.severity,
      });
    } catch (error) {
      logger.error("Error handling alarm:", error);
    }
  }

  handleStatusUpdate(deviceId, data) {
    try {
      const statusData = {
        deviceId,
        status: data.status || "unknown",
        battery:
          data.battery !== undefined
            ? data.battery === 255
              ? "charging"
              : `${data.battery}%`
            : "unknown",
        signal: data.signal || 0,
        lastSeen: new Date(),
        rawData: data,
      };

      // Update device cache
      const existingData = this.deviceCache.get(deviceId) || {};
      this.deviceCache.set(deviceId, { ...existingData, ...statusData });

      // Emit to WebSocket clients using existing socketService functions
      emitStatusUpdate(deviceId, statusData);

      logger.info(`📊 Status update for device ${deviceId}:`, statusData);
    } catch (error) {
      logger.error("Error handling status update:", error);
    }
  }

  getAlarmMessage(alarmType) {
    const alarmMessages = {
      sos: "Emergency SOS Alert",
      panic: "Panic Button Pressed",
      tampering: "Device Tampering Detected",
      vibration: "Excessive Vibration Detected",
      movement: "Unexpected Movement Detected",
      low_battery: "Low Battery Warning",
      power_disconnect: "Power Disconnected",
      gps_lost: "GPS Signal Lost",
      geofence_exit: "Vehicle Left Geofence",
      geofence_enter: "Vehicle Entered Geofence",
      speed_violation: "Speed Limit Exceeded",
      harsh_braking: "Harsh Braking Detected",
      harsh_acceleration: "Harsh Acceleration Detected",
      sharp_turn: "Sharp Turn Detected",
      idle_timeout: "Extended Idle Time",
      engine_start: "Engine Started",
      engine_stop: "Engine Stopped",
      door_open: "Door Opened",
      door_close: "Door Closed",
      lock_open: "ELock Opened",
      lock_close: "ELock Closed",
      lock_tamper: "ELock Tampered",
    };

    return alarmMessages[alarmType] || `Unknown Alarm: ${alarmType}`;
  }

  getAlarmSeverity(alarmType) {
    const highSeverity = ["sos", "panic", "tampering", "lock_tamper"];
    const mediumSeverity = [
      "vibration",
      "movement",
      "power_disconnect",
      "geofence_exit",
      "speed_violation",
    ];

    if (highSeverity.includes(alarmType)) return "high";
    if (mediumSeverity.includes(alarmType)) return "medium";
    return "low";
  }

  // Get cached device data
  getDeviceData(deviceId) {
    return this.deviceCache.get(deviceId) || null;
  }

  // Get all cached devices
  getAllDevices() {
    return Array.from(this.deviceCache.entries()).map(([deviceId, data]) => ({
      deviceId,
      ...data,
    }));
  }

  // Check connection status
  isClientConnected() {
    return this.isConnected && this.client && this.client.connected;
  }

  // Disconnect MQTT client
  disconnect() {
    this.isShuttingDown = true;

    // Clear any pending timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.client) {
      this.client.end(true); // Force close
      this.isConnected = false;
      logger.info("MQTT client disconnected");
    }
  }

  // Publish message to MQTT (for sending commands to devices)
  publish(topic, message) {
    if (this.isClientConnected()) {
      this.client.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
          logger.error("Error publishing MQTT message:", err);
        } else {
          logger.info(`📤 Published to ${topic}:`, message);
        }
      });
    } else {
      logger.warn("Cannot publish: MQTT client not connected");
    }
  }

  // Cleanup method to unsubscribe from all topics
  cleanup() {
    console.log("🧹 [MQTT-CLEANUP] Starting MQTT cleanup...");

    this.isShuttingDown = true;

    // Unsubscribe from all topics
    if (this.client && this.isConnected) {
      console.log("🛑 [MQTT-CLEANUP] Unsubscribing from all topics...");

      const topics = [
        "upload/+/+/location",
        "upload/+/+/alarm",
        "upload/+/+/status",
      ];

      topics.forEach((topic) => {
        this.client.unsubscribe(topic, (err) => {
          if (err) {
            console.warn(
              `⚠️ [MQTT-CLEANUP] Failed to unsubscribe from ${topic}:`,
              err.message
            );
          } else {
            console.log(`✅ [MQTT-CLEANUP] Unsubscribed from: ${topic}`);
          }
        });
      });
    }

    // Clear cache and rate limiting
    this.deviceCache.clear();
    this.lastUpdateTime.clear();

    console.log("✅ [MQTT-CLEANUP] MQTT cleanup completed");

    // Then disconnect
    this.disconnect();
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;
