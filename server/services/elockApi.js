import axios from 'axios';

class ElockApiService {
  constructor() {
    this.baseURL = process.env.ELOCK_API_BASE_URL;
    this.username = process.env.ELOCK_USERNAME;
    this.password = process.env.ELOCK_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;    // iCloud Assets Controls API configuration
    this.icloudBaseURL = 'http://icloud.assetscontrols.com:8092/OpenApi';
    this.fTokenID = null;
    this.fUserGUID = null;
    this.fTokenExpiry = null;
  }  /**
   * Authenticate with the E-Lock API and get token (Legacy - Optional)
   */
  async authenticate() {
    try {
      // Skip legacy authentication if baseURL points to iCloud API
      if (this.baseURL && this.baseURL.includes('icloud.assetscontrols.com')) {
        console.log('ℹ️ Legacy E-Lock API authentication skipped - using iCloud API');
        return null;
      }

      if (!this.baseURL || !this.username || !this.password) {
        throw new Error('Legacy E-Lock API credentials not configured');
      }

      const response = await axios.post(`${this.baseURL}/login`, {
        FUserName: this.username,
        FPassword: this.password
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Set token expiry to 23 hours from now (assuming 24h validity)
        this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
        console.log('✅ Legacy E-Lock API authentication successful');
        return this.token;
      } else {
        throw new Error('Authentication failed: No token received');
      }
    } catch (error) {
      console.error('❌ Legacy E-Lock API authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Authenticate with iCloud Assets Controls API
   * This should be called after successful authentication to get FTokenID and FUserGUID
   */
  async authenticateICloudAPI() {
    try {
      // This method expects the authentication response from your main authentication
      // For now, using dummy data based on the provided response format
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
  }  /**
   * Ensure we have a valid token (Legacy API)
   */
  async ensureValidToken() {
    // Skip legacy token validation if using iCloud API
    if (this.baseURL && this.baseURL.includes('icloud.assetscontrols.com')) {
      return await this.ensureValidICloudToken();
    }

    if (!this.token || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.token;
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
   * Get E-Lock asset location (GPS coordinates) using iCloud Assets Controls LBS API
   */
  async getAssetLocation(assetId) {
    try {
      await this.ensureValidICloudToken();      const response = await axios.post(`${this.icloudBaseURL}/LBS`, {
        FTokenID: this.fTokenID,
        FAction: "QueryLBSMonitorListByFGUIDs",
        FGUIDs: assetId, // Single asset ID or comma-separated for multiple
        FType: 1 // 1 for assets, 2 for device
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15003 // 15 second timeout
      });

      console.log('✅ Successfully retrieved asset location from iCloud LBS API');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get asset location from iCloud LBS API:', error.message);
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }

  /**
   * Get multiple asset locations by FGUIDs
   */
  async getMultipleAssetLocations(assetIds) {
    try {
      await this.ensureValidICloudToken();

      // Join multiple asset IDs with comma
      const fguids = Array.isArray(assetIds) ? assetIds.join(',') : assetIds;

      const response = await axios.post(`${this.icloudBaseURL}/LBS`, {
        FTokenID: this.fTokenID,
        FAction: "QueryLBSMonitorListByFGUIDs",
        FGUIDs: fguids,
        FType: 1 // 1 for assets, 2 for device
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Successfully retrieved multiple asset locations from iCloud LBS API');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get multiple asset locations from iCloud LBS API:', error.message);
      throw new Error(`Failed to get locations: ${error.message}`);
    }
  }

  /**
   * Get device location (using FType: 2)
   */
  async getDeviceLocation(deviceId) {
    try {
      await this.ensureValidICloudToken();

      const response = await axios.post(`${this.icloudBaseURL}/LBS`, {
        FTokenID: this.fTokenID,
        FAction: "QueryLBSMonitorListByFGUIDs",
        FGUIDs: deviceId,
        FType: 2 // 2 for device
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Successfully retrieved device location from iCloud LBS API');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get device location from iCloud LBS API:', error.message);
      throw new Error(`Failed to get device location: ${error.message}`);
    }
  }  /**
   * Unlock E-Lock device using iCloud Assets Controls API
   * Follows the same flow as the React frontend: first get asset data, then unlock
   */
  async unlockDevice(assetId) {
    try {
      await this.ensureValidICloudToken();

      // Step 1: First, get the asset data to retrieve the FGUID (same as React code)
      const adminURL = 'http://icloud.assetscontrols.com:8092/OpenApi/Admin';
        const assetResponse = await axios.post(adminURL, {
        FAction: 'QueryAdminAssetByAssetId',
        FTokenID: this.fTokenID,
        FAssetID: assetId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15003 // 15 second timeout
      });

      if (!assetResponse.data.FObject || assetResponse.data.FObject.length === 0) {
        throw new Error('Asset not found in external system');
      }

      const assetData = assetResponse.data.FObject[0];
      
      // Step 2: Now send the unlock command using the FGUID (same as React code)
      const unlockURL = 'http://icloud.assetscontrols.com:8092/OpenApi/Instruction';
        const unlockResponse = await axios.post(unlockURL, {
        FTokenID: this.fTokenID,
        FAction: 'OpenLockControl',
        FAssetGUID: assetData.FGUID
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15003 // 15 second timeout
      });

      console.log('✅ Unlock command sent successfully via iCloud API');
      
      // Return response similar to React code structure
      return {
        success: unlockResponse.data.Result === 200,
        response: unlockResponse.data,
        assetId,
        assetGUID: assetData.FGUID,
        message: unlockResponse.data.Result === 200 ? 'Unlock instruction sent successfully!' : unlockResponse.data.Message
      };
    } catch (error) {
      console.error('❌ Failed to unlock device via iCloud API:', error.message);
      throw new Error(`Failed to unlock device: ${error.message}`);
    }
  }/**
   * Get E-Lock assignment and history data from third-party API
   */
  async getElockHistory(page = 1, limit = 100, search = '') {
    try {
      // Use the actual third-party API endpoint
      const url = `http://13.201.247.240:9005/api/elock-assign&other-history`;

      const response = await axios.get(url, {
        params: {
          page,
          limit,
          search
        },
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Successfully fetched E-Lock history data from third-party API');
      
      // Transform the response to match our expected format
      if (response.data && response.data.data) {
        const transformedData = response.data.data.map(item => ({
          // Required fields for dashboard
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
          location: null, // This field might come from GPS data separately
          
          // Additional useful fields
          f_asset_id: item.elock_no_details?.FAssetID || item.elock_no,
          elock_status: item.elock_assign_status,
          driver_name: item.driver_name,
          driver_phone: item.driver_phone,
          vehicle_no: item.vehicle_no,
          tr_no: item.tr_no,
          elock_no: item.elock_no,
          
          // Original ID for reference
          _id: item._id
        }));

        return {
          success: true,
          data: transformedData,
          totalCount: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || page,
          limit: limit
        };
      }

      return {
        success: true,
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: page,
        limit: limit
      };
    } catch (error) {
      console.error('❌ Failed to get E-Lock history from third-party API:', error.message);
      
      // Return a more detailed error response
      return {
        success: false,
        error: error.message,
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: page,
        limit: limit
      };
    }
  }

  /**
   * Get E-Lock assignment and history data from third-party API with SSO token filtering
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page 
   * @param {string} search - Search term
   * @param {string} ieCodeNo - IE Code Number from SSO token
   * @param {string} filterType - Filter type (consignor or consignee)
   * @param {string} status - Status filter (ASSIGNED, RETURNED, UNASSIGNED)
   */
  async getElockHistoryWithSsoFiltering(page = 1, limit = 100, search = '', ieCodeNo = '', filterType = '', status = '') {
    try {
      // Use the client API endpoint which supports filtering
      const url = `http://13.201.247.240:9005/api/client-elock-assign`;

      // Build query parameters
      const params = {
        page,
        limit,
        search
      };

      // Add status filter if provided
      if (status) {
        params.status = status;
      }

      // Add IE Code Number filtering if provided
      if (ieCodeNo && filterType) {
        params.ieCodeNo = ieCodeNo;
        params.filterType = filterType;
      }

      console.log(`📡 Fetching E-Lock history with params:`, params);

      const response = await axios.get(url, {
        params,
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Successfully fetched E-Lock history data from third-party API with filtering');
      
      // Transform the response to match our expected format
      if (response.data && response.data.data) {
        const transformedData = response.data.data.map(item => ({
          // Required fields for dashboard
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
          location: null, // This field might come from GPS data separately
          
          // Additional useful fields
          f_asset_id: item.elock_no_details?.FAssetID || item.elock_no,
          elock_status: item.elock_assign_status,
          driver_name: item.driver_name,
          driver_phone: item.driver_phone,
          vehicle_no: item.vehicle_no,
          tr_no: item.tr_no,
          elock_no: item.elock_no,
          
          // Original ID for reference
          _id: item._id
        }));

        return {
          success: true,
          data: transformedData,
          totalCount: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || page,
          limit: limit
        };
      }

      return {
        success: true,
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: page,
        limit: limit
      };
    } catch (error) {
      console.error('❌ Failed to get E-Lock history with SSO filtering:', error.message);
      
      // Return a more detailed error response
      return {
        success: false,
        error: error.message,
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: page,
        limit: limit
      };
    }
  }

  /**
   * Try both consignor and consignee filtering with fallback
   * This method tries first as consignor, and if no results, tries as consignee
   */
  async getElockHistoryWithAutoFilter(page = 1, limit = 100, search = '', ieCodeNo = '', status = '') {
    // If no IE Code, just use regular method
    if (!ieCodeNo) {
      return await this.getElockHistory(page, limit, search);
    }
    
    // First try as consignor
    const consignorResults = await this.getElockHistoryWithSsoFiltering(
      page, 
      limit, 
      search, 
      ieCodeNo, 
      'consignor',
      status
    );
    
    // If we got results, return them
    if (consignorResults.success && consignorResults.data && consignorResults.data.length > 0) {
      console.log(`✅ Found ${consignorResults.data.length} results as consignor`);
      return consignorResults;
    }
    
    // Otherwise try as consignee
    console.log('ℹ️ No results as consignor, trying as consignee');
    const consigneeResults = await this.getElockHistoryWithSsoFiltering(
      page, 
      limit, 
      search, 
      ieCodeNo, 
      'consignee',
      status
    );
    
    return consigneeResults;
  }

  /**
   * Check overall service status (prioritizes iCloud API)
   */
  async checkServiceStatus() {
    try {
      // Check iCloud API status first
      await this.ensureValidICloudToken();
      return {
        success: true,
        message: 'iCloud Assets Controls API service is operational',
        apiType: 'iCloud',
        tokenID: this.fTokenID ? 'Valid' : 'Invalid',
        userGUID: this.fUserGUID || 'Not set'
      };
    } catch (icloudError) {
      console.log('iCloud API not available, checking legacy API...');
      
      try {
        // Fallback to legacy API if available
        if (this.baseURL && !this.baseURL.includes('icloud.assetscontrols.com')) {
          await this.ensureValidToken();
          return {
            success: true,
            message: 'Legacy E-Lock API service is operational',
            apiType: 'Legacy',
            token: this.token ? 'Valid' : 'Invalid'
          };
        } else {
          throw new Error('iCloud API authentication failed and no legacy API configured');
        }
      } catch (legacyError) {
        return {
          success: false,
          message: 'Both iCloud and Legacy API services are unavailable',
          errors: {
            icloud: icloudError.message,
            legacy: legacyError.message
          }
        };
      }
    }
  }

  /**
   * Query asset data by Asset ID to get FGUID and other details
   * This follows the same pattern as the React frontend
   */
  async getAssetData(assetId) {
    try {
      await this.ensureValidICloudToken();

      const adminURL = 'http://icloud.assetscontrols.com:8092/OpenApi/Admin';
      
      const response = await axios.post(adminURL, {
        FAction: 'QueryAdminAssetByAssetId',
        FTokenID: this.fTokenID,
        FAssetID: assetId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Asset data retrieved successfully');
      return {
        success: true,
        data: response.data,
        assetId
      };
    } catch (error) {
      console.error('❌ Failed to get asset data:', error.message);
      throw new Error(`Failed to get asset data: ${error.message}`);
    }
  }
}

// Create singleton instance
const elockApiService = new ElockApiService();

export default elockApiService;
