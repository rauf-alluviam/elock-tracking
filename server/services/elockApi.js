import axios from 'axios';

class ElockApiService {
  constructor() {
    // iCloud Assets Controls API configuration
    this.icloudBaseURL = 'http://icloud.assetscontrols.com:8092/OpenApi';
    this.fTokenID = null;
    this.fUserGUID = null;
    this.fTokenExpiry = null;
    
    // Third-party API configuration
    this.thirdPartyBaseURL = 'http://13.201.247.240:9005/api';
  }

  /**
   * Authenticate with iCloud Assets Controls API
   * Using dummy data based on the provided response format
   */
  async authenticateICloudAPI() {
    try {
      // Mock authentication response - replace with actual authentication
      const authResponse = {
        "Result": 200,
        "Message": "success",
        "FObject": [
          {
            "FUserName": "alluvium",
            "FUserGUID": "307b8d35-bde9-4221-af9c-ecf13bc5bbd2",
            "FTokenID": "e36d2589-9dc3-4302-be7d-dc239af1846c",
            "FExpireTime": "2026-04-30T00:00:00"
          }
        ]
      };

      if (authResponse.Result === 200 && authResponse.FObject && authResponse.FObject.length > 0) {
        const tokenData = authResponse.FObject[0];
        this.fTokenID = tokenData.FTokenID;
        this.fUserGUID = tokenData.FUserGUID;
        this.fTokenExpiry = new Date(tokenData.FExpireTime);
        
        console.log('✅ iCloud Assets Controls API authentication successful');
        return {
          tokenID: this.fTokenID,
          userGUID: this.fUserGUID
        };
      } else {
        throw new Error('iCloud API Authentication failed: Invalid response');
      }
    } catch (error) {
      console.error('❌ iCloud Assets Controls API authentication failed:', error.message);
      throw new Error(`iCloud API Authentication failed: ${error.message}`);
    }
  }

  /**
   * Ensure we have a valid iCloud API token
   */
  async ensureValidICloudToken() {
    if (!this.fTokenID || !this.fTokenExpiry || new Date() >= this.fTokenExpiry) {
      await this.authenticateICloudAPI();
    }
    return this.fTokenID;
  }

  /**
   * Get E-Lock assignments with optimized filtering
   * Applied optimized logic with support for:
   * 1. status: (RETURNED, ASSIGNED, UNASSIGNED)
   * 2. filterType: (consignor, consignee)
   * 3. ieCodeNo based sorting for crisp backend-processed data
   */
  async getElockAssignments () {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      status = '',
      filterType = '',
      ieCodeNo = ''
    } = req.query;

    console.log('🔍 Backend: Processing assignment request with params:', req.query);

    // Build query parameters for third-party API
    const params = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Add optional parameters only if provided
    if (search) params.search = search;
    if (status) params.status = status;
    if (ieCodeNo) params.ieCodeNo = ieCodeNo;
    if (filterType) params.filterType = filterType;

    console.log('📡 Backend: Calling third-party API with params:', params);

    // Call the third-party API
    const response = await axios.get(`${THIRD_PARTY_API_URL}/client-elock-assign`, {
      params,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Backend: Third-party API response received');

    // Transform the response to match your expected format
    if (response.data && response.data.jobs) {
      const transformedData = response.data.jobs.map(item => ({
        // Core fields for dashboard
        container_no: item.container_number || 'N/A',
        container_details: `TR: ${item.tr_no || 'N/A'} | Vehicle: ${item.vehicle_no || 'N/A'} | Driver: ${item.driver_name || 'N/A'}`,
        total_weight: item.gross_weight || item.net_weight || 'N/A',
        consignor_name: item.consignor?.name || 'N/A',
        consignee_name: item.consignee?.name || 'N/A',
        seal_no: item.seal_no || 'N/A',
        pickup_location_address: item.goods_pickup ? 
          `${item.goods_pickup.name}, ${item.goods_pickup.city}, ${item.goods_pickup.state} - ${item.goods_pickup.postal_code}` : 'N/A',
        delivery_location_address: item.goods_delivery ? 
          `${item.goods_delivery.name}, ${item.goods_delivery.city}, ${item.goods_delivery.state} - ${item.goods_delivery.postal_code}` : 'N/A',
        
        // E-Lock specific fields
        f_asset_id: item.elock_no,
        elock_status: item.elock_assign_status,
        elock_no: item.elock_no,
        
        // Additional fields
        driver_name: item.driver_name,
        driver_phone: item.driver_phone,
        vehicle_no: item.vehicle_no,
        tr_no: item.tr_no,
        
        // Original ID for reference
        _id: item._id,
        
        // Location placeholder (will be populated by location API)
        location: null,
        
        // Add consignor/consignee details for filtering
        consignor: item.consignor,
        consignee: item.consignee
      }));

      const result = {
        success: true,
        data: transformedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: response.data.totalJobs || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || parseInt(page)
        },
        filters: {
          status,
          filterType,
          ieCodeNo,
          search
        },
        message: `Found ${transformedData.length} assignments`
      };

      console.log('✅ Backend: Sending transformed response');
      return res.json(result);
    }

    // If no jobs found
    const emptyResult = {
      success: true,
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: 0,
        totalPages: 1,
        currentPage: parseInt(page)
      },
      filters: {
        status,
        filterType,
        ieCodeNo,
        search
      },
      message: 'No assignments found'
    };

    console.log('ℹ️ Backend: No assignments found');
    return res.json(emptyResult);

  } catch (error) {
    console.error('❌ Backend: Error in getElockAssignments:', error.message);
    
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

    return res.status(500).json(errorResult);
  }
}


  /**
   * Get asset location using iCloud Assets Controls LBS API
   */
  async getAssetLocation(assetId) {
    try {
      await this.ensureValidICloudToken();

      const response = await axios.post(`${this.icloudBaseURL}/LBS`, {
        FTokenID: this.fTokenID,
        FAction: "QueryLBSMonitorListByFGUIDs",
        FGUIDs: assetId,
        FType: 1 // 1 for assets
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Successfully retrieved asset location');
      return {
        success: true,
        data: response.data,
        assetId
      };
    } catch (error) {
      console.error('❌ Failed to get asset location:', error.message);
      return {
        success: false,
        error: error.message,
        assetId
      };
    }
  }

  /**
   * Unlock E-Lock device using iCloud Assets Controls API
   */
  async unlockDevice(assetId) {
    try {
      await this.ensureValidICloudToken();

      // Step 1: Get asset data to retrieve FGUID
      const adminURL = `${this.icloudBaseURL}/Admin`;
      const assetResponse = await axios.post(adminURL, {
        FAction: 'QueryAdminAssetByAssetId',
        FTokenID: this.fTokenID,
        FAssetID: assetId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (!assetResponse.data.FObject || assetResponse.data.FObject.length === 0) {
        throw new Error('Asset not found in system');
      }

      const assetData = assetResponse.data.FObject[0];
      
      // Step 2: Send unlock command using FGUID
      const unlockURL = `${this.icloudBaseURL}/Instruction`;
      const unlockResponse = await axios.post(unlockURL, {
        FTokenID: this.fTokenID,
        FAction: 'OpenLockControl',
        FAssetGUID: assetData.FGUID
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Unlock command sent successfully');
      
      return {
        success: unlockResponse.data.Result === 200,
        response: unlockResponse.data,
        assetId,
        assetGUID: assetData.FGUID,
        message: unlockResponse.data.Result === 200 ? 'Unlock instruction sent successfully!' : unlockResponse.data.Message
      };
    } catch (error) {
      console.error('❌ Failed to unlock device:', error.message);
      return {
        success: false,
        error: error.message,
        assetId
      };
    }
  }

  /**
   * Check service status
   */
  async checkServiceStatus() {
    try {
      await this.ensureValidICloudToken();
      
      return {
        success: true,
        message: 'iCloud Assets Controls API service is operational',
        tokenID: this.fTokenID ? 'Valid' : 'Invalid',
        userGUID: this.fUserGUID || 'Not set',
        thirdPartyAPI: this.thirdPartyBaseURL
      };
    } catch (error) {
      return {
        success: false,
        message: 'Service unavailable',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const elockApiService = new ElockApiService();

export default elockApiService;