import express from 'express';
import elockApiService from '../services/elockApi.js';

const router = express.Router();

/**
 * GET /api/elock/assignments
 * Get E-Lock assignments and history data from third-party API
 */
router.get('/assignments', async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '', status = '', ieCodeNo = '' } = req.query;

    let result;
    if (ieCodeNo) {
      // Always use the new API with SSO filtering
      result = await elockApiService.getElockHistoryWithSsoFiltering(
        parseInt(page),
        parseInt(limit),
        search,
        ieCodeNo,
        '', // filterType: let backend try both consignor/consignee
        status
      );
    } else {
      // Fallback to old method if no ieCodeNo
      result = await elockApiService.getElockHistory(
        parseInt(page),
        parseInt(limit),
        search
      );
    }

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: result.totalCount,
          search
        },
        message: `Found ${Array.isArray(result.data) ? result.data.length : 0} containers`
      });
    } else {
      // Handle API errors gracefully
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch assignments',
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: 0,
          search
        }
      });
    }
  } catch (error) {
    console.error('❌ Error in assignments endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100,
        totalCount: 0,
        search: req.query.search || ''
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

    const location = await elockApiService.getAssetLocation(assetId);

    res.json({
      success: true,
      data: location,
      assetId
    });
  } catch (error) {
    console.error('Error fetching asset location:', error);
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

    res.json({
      success: true,
      data: result,
      message: 'Unlock command sent successfully',
      assetId
    });
  } catch (error) {
    console.error('Error unlocking device:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/elock/unlock-debug
 * Debug version of unlock with detailed logging
 */
router.post('/unlock-debug', async (req, res) => {
  try {
    console.log('🔍 Debug Unlock Request Received');
    console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📊 Request headers:', JSON.stringify(req.headers, null, 2));
    
    const { assetId } = req.body;

    if (!assetId) {
      console.log('❌ No assetId provided');
      return res.status(400).json({
        success: false,
        error: 'Asset ID is required'
      });
    }

    console.log(`🔓 Starting unlock process for asset: ${assetId}`);
    const result = await elockApiService.unlockDevice(assetId);
    console.log('✅ Unlock process completed successfully');

    res.json({
      success: true,
      data: result,
      message: 'Unlock command sent successfully',
      assetId,
      timestamp: new Date().toISOString(),
      debug: {
        requestReceived: true,
        assetIdProvided: !!assetId,
        resultReceived: !!result
      }
    });
  } catch (error) {
    console.error('❌ Debug unlock error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack
      }
    });
  }
});

/**
 * GET /api/elock/status
 * Check API service status (prioritizes iCloud API)
 */
router.get('/status', async (req, res) => {
  try {
    const status = await elockApiService.checkServiceStatus();
    
    if (status.success) {
      res.json({
        success: true,
        message: status.message,
        apiType: status.apiType,
        tokenStatus: status.tokenID || status.token,
        userGUID: status.userGUID,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        error: status.message,
        details: status.errors,
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

/**
 * GET /api/elock/test-third-party
 * Test connection to third-party API
 */
router.get('/test-third-party', async (req, res) => {
  try {
    console.log('🧪 Testing third-party API connection...');
    console.log('📡 API URL:', `${process.env.LOCAL_API_BASE_URL}/elock-assign&other-history`);
    
    const result = await elockApiService.getElockHistory(1, 5, '');
    
    res.json({
      success: true,
      message: 'Third-party API test completed',
      apiUrl: `${process.env.LOCAL_API_BASE_URL}/elock-assign&other-history`,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Third-party API test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      apiUrl: `${process.env.LOCAL_API_BASE_URL}/elock-assign&other-history`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/elock/locations/multiple
 * Get multiple asset locations by asset IDs
 */
router.post('/locations/multiple', async (req, res) => {
  try {
    const { assetIds } = req.body;

    if (!assetIds || (!Array.isArray(assetIds) && typeof assetIds !== 'string')) {
      return res.status(400).json({
        success: false,
        error: 'Asset IDs are required (array or comma-separated string)'
      });
    }

    const locations = await elockApiService.getMultipleAssetLocations(assetIds);

    res.json({
      success: true,
      data: locations,
      assetIds
    });
  } catch (error) {
    console.error('Error fetching multiple asset locations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/elock/device-location
 * Get device location by device ID (FType: 2)
 */
router.post('/device-location', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }

    const location = await elockApiService.getDeviceLocation(deviceId);

    res.json({
      success: true,
      data: location,
      deviceId
    });
  } catch (error) {
    console.error('Error fetching device location:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/elock/icloud-status
 * Check iCloud Assets Controls API status
 */
router.get('/icloud-status', async (req, res) => {
  try {
    // Try to authenticate to check if iCloud service is working
    await elockApiService.ensureValidICloudToken();
    
    res.json({
      success: true,
      message: 'iCloud Assets Controls API service is operational',
      tokenID: elockApiService.fTokenID ? 'Valid' : 'Invalid',
      userGUID: elockApiService.fUserGUID || 'Not set',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'iCloud Assets Controls API service is not available',
      details: error.message
    });
  }
});

/**
 * GET /api/elock/frontend-test
 * Simple endpoint to test frontend connectivity
 */
router.get('/frontend-test', (req, res) => {
  console.log('🌐 Frontend test request received');
  console.log('📊 Request headers:', JSON.stringify(req.headers, null, 2));
  
  res.json({
    success: true,
    message: 'Frontend connectivity test successful',
    server: {
      port: process.env.PORT || 5003,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    request: {
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
});

export default router;
