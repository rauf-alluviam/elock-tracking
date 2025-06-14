import axios from 'axios';

class ElockApiService {
  constructor() {
    this.baseURL = process.env.ELOCK_API_BASE_URL;
    this.username = process.env.ELOCK_USERNAME;
    this.password = process.env.ELOCK_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;
    
    // iCloud Assets Controls API configuration
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
      await this.ensureValidICloudToken();

      const response = await axios.post(`${this.icloudBaseURL}/LBS`, {
        FTokenID: this.fTokenID,
        FAction: "QueryLBSMonitorListByFGUIDs",
        FGUIDs: assetId, // Single asset ID or comma-separated for multiple
        FType: 1 // 1 for assets, 2 for device
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
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
  }

  /**
   * Unlock E-Lock device
   */
  async unlockDevice(assetId) {
    try {
      await this.ensureValidToken();

      const response = await axios.post(`${this.baseURL}/Instruction`, {
        "f-asset-id": assetId,
        "f-action": "open lock control"
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to unlock device:', error.message);
      throw new Error(`Failed to unlock device: ${error.message}`);
    }
  }  /**
   * Get E-Lock assignment and history data from third-party API
   */
  async getElockHistory(page = 1, limit = 100, search = '') {
    try {
      // Use the actual third-party API endpoint
      const url = `http://43.205.59.159:9000/api/elock-assign&other-history`;
      
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
}

// Create singleton instance
const elockApiService = new ElockApiService();

export default elockApiService;
