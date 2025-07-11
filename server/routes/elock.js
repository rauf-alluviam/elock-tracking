// Example route handler (routes/elock.js)
import express from 'express';
import elockApiService from '../services/elockApi.js';

const router = express.Router();

// Get E-Lock assignments endpoint
router.get('/assignments', async (req, res) => {
  try {
    // Pass query parameters to the service method
    const result = await elockApiService.getElockAssignments(req.query);
    
    // Return the result from the service
    res.json(result);
  } catch (error) {
    console.error('❌ Error in assignments endpoint:', error.message);
    
    const errorResult = {
      success: false,
      error: error.message,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100,
        totalCount: 0,
        totalPages: 1,
        currentPage: parseInt(req.query.page) || 1
      },
      filters: {
        status: req.query.status || '',
        filterType: req.query.filterType || '',
        ieCodeNo: req.query.ieCodeNo || '',
        search: req.query.search || ''
      },
      message: 'Failed to fetch assignments'
    };

    res.status(500).json(errorResult);
  }
});

// Get asset location endpoint
router.get('/location/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await elockApiService.getAssetLocation(assetId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      assetId: req.params.assetId
    });
  }
});

// Unlock device endpoint
router.post('/unlock/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await elockApiService.unlockDevice(assetId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      assetId: req.params.assetId
    });
  }
});

// Service status endpoint
router.get('/status', async (req, res) => {
  try {
    const result = await elockApiService.checkServiceStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;