import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import elockRoutes from "./routes/elock.js";
import elockDetail from "./routes/elockDetails.js";
import authRoutes from "./routes/auth.js";
import verifyToken from "./middlewares/jwtAuth.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:3005",
      "http://localhost:5173",
      "http://localhost:3001",
      "http://localhost:9001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://3.108.244.38:9005",
      "http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com",
      "http://15.207.11.214:5004",
      "http://elock-tracking.s3-website.ap-south-1.amazonaws.com",
      "http://icloud.assetscontrols.com:8092/OpenApi/LBS",
      "http://eximdev.s3-website.ap-south-1.amazonaws.com",
      "http://devtransport.s3-website.ap-south-1.amazonaws.com/",
      process.env.CLIENT_URL,
      process.env.ADDITIONAL_CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  helmet({
    // Allow HTTP for development environment
    contentSecurityPolicy: process.env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3005",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://localhost:9001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://3.108.244.38:9005",
        "http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com",
        "http://15.207.11.214:5004",
        "http://elock-tracking.s3-website.ap-south-1.amazonaws.com",
        "http://icloud.assetscontrols.com:8092",
        "http://eximdev.s3-website.ap-south-1.amazonaws.com",
        "http://devtransport.s3-website.ap-south-1.amazonaws.com",
        process.env.CLIENT_URL,
        process.env.ADDITIONAL_CLIENT_URL,
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Check if origin matches any pattern (for subdomains, etc.)
        const isAllowed = allowedOrigins.some(
          (allowedOrigin) => origin.startsWith(allowedOrigin.replace(/\/$/, "")) // Remove trailing slashes for comparison
        );

        if (isAllowed) {
          callback(null, true);
        } else {
          console.log("CORS blocked for origin:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/proxy/client-elock-assign", async (req, res) => {
  try {
    const { page, limit, ieCodeNo } = req.query;

    // Make request to external API
    const response = await axios.get(
      "http://3.108.244.38:9005/api/client-elock-assign",
      // "http://43.205.59.159:9005/api/client-elock-assign",
      {
        params: { page, limit, ieCodeNo },
        timeout: 10000, // 10 second timeout
        headers: {
          "User-Agent": "Express-Proxy-Server",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    // Forward the response
    res.json(response.data);
  } catch (error) {
    console.error("Proxy API Error:", error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({
        error: "External API Error",
        message: error.response.data?.message || error.message,
        status: error.response.status,
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: "Service Unavailable",
        message: "Unable to reach external API",
        details: error.message,
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
});

// Routes
app.use("/api/auth", authRoutes);
// Apply JWT verification middleware to elock routes
app.use("/api/elock", verifyToken, elockRoutes);
app.use("/api/elock-details",verifyToken, elockDetail);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "E-Lock Tracking Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      status: 404,
    },
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Socket.IO client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket.IO client disconnected:", socket.id);
  });
  // You can add more event handlers here
});

// Add support for '/elock' namespace
const elockNamespace = io.of("/elock");
elockNamespace.on("connection", (socket) => {
  console.log("Elock namespace client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Elock namespace client disconnected:", socket.id);
  });
  // Add custom event handlers for /elock namespace here
});

// Fixed unlock URL to use icloud.assetscontrols.com
// Updated unlock functionality to use correct iCloud API
// Updated unlock to follow React pattern: AssetID -> FGUID -> Unlock
// Added timeouts to prevent ECONNRESET errors

export default app;
