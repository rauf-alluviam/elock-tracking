import express from "express";
import axios from "axios";
import elockApiService from "../services/elockApi.js";

const router = express.Router();

/**
 * GET /assignments
 * Get E-Lock assignments with complete data mapping
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100)
 * - search: Search term
 * - status: Filter by status (ASSIGNED, UNASSIGNED, RETURNED)
 * - filterType: Filter type (consignor, consignee)
 * - ieCodeNo: IE Code Number filter
 */
router.get("/assignments", async (req, res) => {
  try {
    console.log("📨 Assignment request received with query:", req.query);

    // Pass query parameters to the service method
    const result = await elockApiService.getElockAssignments(req.query);

    // Set appropriate HTTP status based on result
    const statusCode = result.success ? 200 : 500;

    console.log(
      `✅ Assignment response sent with ${result.data.length} records`
    );
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error in assignments endpoint:", error.message);

    const errorResult = {
      success: false,
      error: error.message,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100,
        totalCount: 0,
        totalPages: 1,
        currentPage: parseInt(req.query.page) || 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      filters: {
        status: req.query.status || "",
        filterType: req.query.filterType || "",
        ieCodeNo: req.query.ieCodeNo || "",
        search: req.query.search || "",
      },
      summary: {
        totalAssignments: 0,
        assignedCount: 0,
        unassignedCount: 0,
        returnedCount: 0,
      },
      message: "Failed to fetch assignments",
    };

    res.status(500).json(errorResult);
  }
});

/**
 * GET /assignments/:id
 * Get detailed assignment information by ID
 */
router.get("/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📨 Assignment detail request for ID:", id);

    const result = await elockApiService.getAssignmentById(id);

    const statusCode = result.success ? 200 : 404;

    console.log(`✅ Assignment detail response sent for ID: ${id}`);
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error in assignment detail endpoint:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch assignment details",
      assignmentId: req.params.id,
    });
  }
});

/**
 * GET /assignments/summary
 * Get assignment summary statistics
 */
router.get("/assignments/summary", async (req, res) => {
  try {
    console.log("📨 Assignment summary request received");

    // Get all assignments to calculate summary
    const result = await elockApiService.getElockAssignments({ limit: 1000 });

    if (result.success) {
      const summaryResult = {
        success: true,
        data: result.summary,
        message: "Assignment summary retrieved successfully",
      };

      console.log("✅ Assignment summary response sent");
      res.json(summaryResult);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: "Failed to fetch assignment summary",
      });
    }
  } catch (error) {
    console.error("❌ Error in assignment summary endpoint:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch assignment summary",
    });
  }
});

/**
 * GET /location/:assetId
 * Get asset location using iCloud Assets Controls LBS API
 */
router.get("/location/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    console.log("📨 Location request for asset:", assetId);

    const result = await elockApiService.getAssetLocation(assetId);

    const statusCode = result.success ? 200 : 500;

    console.log(`✅ Location response sent for asset: ${assetId}`);
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error in location endpoint:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      assetId: req.params.assetId,
      message: "Failed to fetch asset location",
    });
  }
});

/**
 * POST /unlock/:assetId
 * Unlock E-Lock device using iCloud Assets Controls API
 */
router.post("/unlock/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    console.log("📨 Unlock request for asset:", assetId);

    const result = await elockApiService.unlockDevice(assetId);

    const statusCode = result.success ? 200 : 500;

    console.log(`✅ Unlock response sent for asset: ${assetId}`);
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error in unlock endpoint:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      assetId: req.params.assetId,
      message: "Failed to unlock device",
    });
  }
});

/**
 * GET /status
 * Check service status
 */
router.get("/status", async (req, res) => {
  try {
    console.log("📨 Service status check request");

    const result = await elockApiService.checkServiceStatus();

    const statusCode = result.success ? 200 : 500;

    console.log("✅ Service status response sent");
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error in status endpoint:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to check service status",
    });
  }
});

/**
 * GET /assignments/export
 * Export assignments data (optional - for future use)
 */
router.get("/assignments/export", async (req, res) => {
  try {
    console.log("📨 Export request received with query:", req.query);

    // Get all assignments based on filters
    const result = await elockApiService.getElockAssignments({
      ...req.query,
      limit: 10000, // Get all records for export
    });

    if (result.success) {
      // Set headers for file download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=elock_assignments.json"
      );

      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: result.data.length,
        filters: result.filters,
        data: result.data,
      };

      console.log(`✅ Export response sent with ${result.data.length} records`);
      res.json(exportData);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: "Failed to export assignments",
      });
    }
  } catch (error) {
    console.error("❌ Error in export endpoint:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to export assignments",
    });
  }
});

/**
 * GET /assign-limits
 * Proxy request to third-party limits API
 */
router.get("/assign-limits", async (req, res) => {
  console.log("DEBUG: /assign-limits route hit! Query:", req.query);
  try {
    const { ieCodeNo, type } = req.query;
    console.log(
      `📨 Proxying assignment limits request for IE: ${ieCodeNo}, Type: ${type}`
    );

    const response = await axios.get(
      "http://3.108.244.38:9005/api/client-elock-assign-limits",
      {
        params: { ieCodeNo, type },
      }
    );

    console.log(`✅ Limits response received for IE: ${ieCodeNo}`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error proxying limits:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch assignment limits from third-party service",
    });
  }
});

/**
 * Middleware for logging all requests
 */
router.use((req, res, next) => {
  console.log(`📋 E-Lock API Request: ${req.method} ${req.originalUrl}`);
  next();
});

export default router;
