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
   * Helper function to safely format address
   */
  formatAddress(locationObj) {
    if (!locationObj) return 'N/A';
    
    const parts = [];
    if (locationObj.name) parts.push(locationObj.name);
    if (locationObj.city) parts.push(locationObj.city);
    if (locationObj.district && locationObj.district !== locationObj.city) parts.push(locationObj.district);
    if (locationObj.state) parts.push(locationObj.state);
    if (locationObj.postal_code) parts.push(locationObj.postal_code);
    if (locationObj.country) parts.push(locationObj.country);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }

  /**
   * Helper function to format company details
   */
  formatCompanyDetails(companyObj) {
    if (!companyObj) return null;
    
    return {
      id: companyObj._id,
      name: companyObj.name,
      alias: companyObj.alias,
      type: companyObj.type,
      gstin: companyObj.gstin,
      panNo: companyObj.panNo,
      ieCodeNo: companyObj.ieCodeNo,
      binNo: companyObj.binNo,
      cinNo: companyObj.cinNo,
      cstNo: companyObj.cstNo,
      stNo: companyObj.stNo,
      stRegNo: companyObj.stRegNo,
      tanNo: companyObj.tanNo,
      vatNo: companyObj.vatNo,
      branches: companyObj.branches?.map(branch => ({
        id: branch._id,
        branchName: branch.branchName,
        address: branch.address,
        country: branch.country,
        state: branch.state,
        city: branch.city,
        postalCode: branch.postalCode,
        telephoneNo: branch.telephoneNo,
        fax: branch.fax,
        website: branch.website,
        emailAddress: branch.emailAddress,
        taxableType: branch.taxableType,
        addresses: branch.addresses,
        contacts: branch.contacts
      })) || [],
      createdAt: companyObj.createdAt,
      updatedAt: companyObj.updatedAt
    };
  }

  /**
   * Get E-Lock assignments with complete data mapping
   * Applied comprehensive logic to include all available fields from the API response
   */
  async getElockAssignments(queryParams = {}) {
    try {
      const {
        page = 1,
        limit = 100,
        search = '',
        status = '',
        filterType = '',
        ieCodeNo = ''
      } = queryParams;

      console.log('🔍 Backend: Processing assignment request with params:', queryParams);

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
      const response = await axios.get(`${this.thirdPartyBaseURL}/client-elock-assign`, {
        params,
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Backend: Third-party API response received');

      // Transform the response to include ALL available fields
      if (response.data && response.data.jobs) {
        const transformedData = response.data.jobs.map(item => ({
          // Original job ID and reference
          _id: item._id,
          tr_no: item.tr_no,
          
          // Container and vehicle details
          container_number: item.container_number,
          container_no: item.container_number || 'N/A', // Alias for backward compatibility
          vehicle_no: item.vehicle_no,
          
          // Driver information
          driver_name: item.driver_name,
          driver_phone: item.driver_phone,
          
          // E-Lock information
          elock_no: item.elock_no,
          f_asset_id: item.elock_no, // Alias for iCloud API compatibility
          elock_assign_status: item.elock_assign_status,
          elock_status: item.elock_assign_status, // Alias for backward compatibility
          
          // Consignor details (complete object)
          consignor: this.formatCompanyDetails(item.consignor),
          consignor_name: item.consignor?.name || 'N/A',
          consignor_alias: item.consignor?.alias || 'N/A',
          consignor_gstin: item.consignor?.gstin || 'N/A',
          consignor_ie_code: item.consignor?.ieCodeNo || 'N/A',
          
          // Consignee details (complete object)
          consignee: this.formatCompanyDetails(item.consignee),
          consignee_name: item.consignee?.name || 'N/A',
          consignee_alias: item.consignee?.alias || 'N/A',
          consignee_gstin: item.consignee?.gstin || 'N/A',
          consignee_ie_code: item.consignee?.ieCodeNo || 'N/A',
          
          // Pickup location details
          goods_pickup: item.goods_pickup,
          pickup_location: {
            id: item.goods_pickup?._id,
            name: item.goods_pickup?.name,
            postal_code: item.goods_pickup?.postal_code,
            city: item.goods_pickup?.city,
            district: item.goods_pickup?.district,
            state: item.goods_pickup?.state,
            country: item.goods_pickup?.country,
            createdAt: item.goods_pickup?.createdAt,
            updatedAt: item.goods_pickup?.updatedAt
          },
          pickup_location_address: this.formatAddress(item.goods_pickup),
          
          // Delivery location details
          goods_delivery: item.goods_delivery,
          delivery_location: {
            id: item.goods_delivery?._id,
            name: item.goods_delivery?.name,
            postal_code: item.goods_delivery?.postal_code,
            city: item.goods_delivery?.city,
            district: item.goods_delivery?.district,
            state: item.goods_delivery?.state,
            country: item.goods_delivery?.country,
            createdAt: item.goods_delivery?.createdAt,
            updatedAt: item.goods_delivery?.updatedAt
          },
          delivery_location_address: this.formatAddress(item.goods_delivery),
          
          // Additional fields that might be present
          seal_no: item.seal_no || 'N/A',
          gross_weight: item.gross_weight || 'N/A',
          net_weight: item.net_weight || 'N/A',
          total_weight: item.gross_weight || item.net_weight || 'N/A',
          
          // Consolidated details for display
          container_details: `TR: ${item.tr_no || 'N/A'} | Vehicle: ${item.vehicle_no || 'N/A'} | Driver: ${item.driver_name || 'N/A'} | Phone: ${item.driver_phone || 'N/A'}`,
          
          // Trip summary
          trip_summary: {
            from: item.goods_pickup?.name || 'Unknown',
            to: item.goods_delivery?.name || 'Unknown',
            distance: item.distance || 'N/A',
            estimated_time: item.estimated_time || 'N/A'
          },
          
          // Location placeholder (will be populated by location API)
          location: null,
          current_location: null,
          
          // Timestamps and additional metadata
          created_at: item.createdAt,
          updated_at: item.updatedAt,
          
          // Any additional fields that might be present in the future
          ...Object.keys(item).reduce((acc, key) => {
            if (!['_id', 'tr_no', 'container_number', 'vehicle_no', 'driver_name', 'driver_phone', 
                  'elock_no', 'elock_assign_status', 'consignor', 'consignee', 'goods_pickup', 
                  'goods_delivery', 'seal_no', 'gross_weight', 'net_weight', 'createdAt', 'updatedAt'].includes(key)) {
              acc[key] = item[key];
            }
            return acc;
          }, {})
        }));

        const result = {
          success: true,
          data: transformedData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount: response.data.totalJobs || 0,
            totalPages: response.data.totalPages || 1,
            currentPage: response.data.currentPage || parseInt(page),
            hasNextPage: (response.data.currentPage || parseInt(page)) < (response.data.totalPages || 1),
            hasPreviousPage: (response.data.currentPage || parseInt(page)) > 1
          },
          filters: {
            status,
            filterType,
            ieCodeNo,
            search
          },
          summary: {
            totalAssignments: response.data.totalJobs || 0,
            assignedCount: transformedData.filter(item => item.elock_assign_status === 'ASSIGNED').length,
            unassignedCount: transformedData.filter(item => item.elock_assign_status === 'UNASSIGNED').length,
            returnedCount: transformedData.filter(item => item.elock_assign_status === 'RETURNED').length
          },
          message: `Found ${transformedData.length} assignments with complete details`
        };

        console.log('✅ Backend: Sending comprehensive transformed response');
        return result;
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
          currentPage: parseInt(page),
          hasNextPage: false,
          hasPreviousPage: false
        },
        filters: {
          status,
          filterType,
          ieCodeNo,
          search
        },
        summary: {
          totalAssignments: 0,
          assignedCount: 0,
          unassignedCount: 0,
          returnedCount: 0
        },
        message: 'No assignments found'
      };

      console.log('ℹ️ Backend: No assignments found');
      return emptyResult;

    } catch (error) {
      console.error('❌ Backend: Error in getElockAssignments:', error.message);
      
      const errorResult = {
        success: false,
        error: error.message,
        data: [],
        pagination: {
          page: parseInt(queryParams.page) || 1,
          limit: parseInt(queryParams.limit) || 100,
          totalCount: 0,
          totalPages: 1,
          currentPage: parseInt(queryParams.page) || 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        filters: {
          status: queryParams.status || '',
          filterType: queryParams.filterType || '',
          ieCodeNo: queryParams.ieCodeNo || '',
          search: queryParams.search || ''
        },
        summary: {
          totalAssignments: 0,
          assignedCount: 0,
          unassignedCount: 0,
          returnedCount: 0
        },
        message: 'Failed to fetch assignments'
      };

      return errorResult;
    }
  }

  /**
   * Get detailed assignment by ID
   */
  async getAssignmentById(assignmentId) {
    try {
      console.log('🔍 Backend: Getting assignment details for ID:', assignmentId);
      
      // You can implement specific endpoint for single assignment
      // For now, we'll get all and filter by ID
      const allAssignments = await this.getElockAssignments({ limit: 1000 });
      
      if (allAssignments.success) {
        const assignment = allAssignments.data.find(item => item._id === assignmentId);
        
        if (assignment) {
          return {
            success: true,
            data: assignment,
            message: 'Assignment details retrieved successfully'
          };
        } else {
          return {
            success: false,
            error: 'Assignment not found',
            message: 'Assignment with the specified ID was not found'
          };
        }
      }
      
      return allAssignments;
    } catch (error) {
      console.error('❌ Backend: Error in getAssignmentById:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get assignment details'
      };
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