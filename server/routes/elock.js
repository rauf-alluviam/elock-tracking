import express from 'express';
import elockApiService from '../services/elockApi.js';

const router = express.Router();

/**
 * GET /api/elock/assignments
 * Get E-Lock assignments with optimized filtering
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100)
 * - search: Search term (optional)
 * - status: RETURNED, ASSIGNED, UNASSIGNED (optional)
 * - filterType: consignor, consignee (optional)
 * - ieCodeNo: IE Code from SSO (optional)
 */
router.get('/assignments', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      search = '', 
      status = '', 
      filterType = '', 
      ieCodeNo = '' 
    } = req.query;

    // Get assignments with all filters
    const result = await elockApiService.getElockAssignments(
      parseInt(page),
      parseInt(limit),
      search,
      ieCodeNo,
      filterType,
      status
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          currentPage: result.currentPage
        },
        filters: result.filters,
        message: `Found ${Array.isArray(result.data) ? result.data.length : 0} assignments`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch assignments',
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: 0,
          totalPages: 1,
          currentPage: parseInt(page)
        },
        filters: result.filters
      });
    }
  } catch (error) {
    console.error('❌ Error in assignments endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 100,
        totalCount: 0,
        totalPages: 1,
        currentPage: parseInt(page) || 1
      }
    });
  }
});

/**
 * POST /api/elock/location
 * Get asset location by asset ID
 */
router.post('/location', async (req, res) => {
  try {
    const { assetId } = req.body;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: 'Asset ID is required'
      });
    }

    const result = await elockApiService.getAssetLocation(assetId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        assetId: result.assetId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        assetId: result.assetId
      });
    }
  } catch (error) {
    console.error('❌ Error fetching asset location:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/elock/unlock
 * Unlock E-Lock device
 */
router.post('/unlock', async (req, res) => {
  try {
    const { assetId } = req.body;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: 'Asset ID is required'
      });
    }

    const result = await elockApiService.unlockDevice(assetId);

    if (result.success) {
      res.json({
        success: true,
        data: result.response,
        message: result.message,
        assetId: result.assetId,
        assetGUID: result.assetGUID
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        assetId: result.assetId
      });
    }
  } catch (error) {
    console.error('❌ Error unlocking device:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/elock/status
 * Check API service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await elockApiService.checkServiceStatus();
    
    if (status.success) {
      res.json({
        success: true,
        message: status.message,
        tokenStatus: status.tokenID,
        userGUID: status.userGUID,
        thirdPartyAPI: status.thirdPartyAPI,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        error: status.message,
        details: status.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'API service status check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;