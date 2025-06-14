import React, { useState, useEffect } from 'react';
import { MapPin, Unlock, RefreshCw, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import MapModal from './MapModal';
import Toast from './Toast';
import LoadingSpinner from './LoadingSpinner';

const Dashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});

  const itemsPerPage = 10;

  useEffect(() => {
    fetchAssignments();
    checkServiceStatus();
  }, [currentPage, searchTerm]);
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching assignments...');
      
      const response = await apiService.getAssignments(currentPage, itemsPerPage, searchTerm);
      
      if (response.success) {
        // Handle different response structures
        let assignmentData = [];
        
        if (Array.isArray(response.data)) {
          assignmentData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          assignmentData = response.data.data;
        } else if (response.data && response.data.assignments) {
          assignmentData = response.data.assignments;
        }
        
        console.log('✅ Assignments fetched:', assignmentData.length, 'containers');
        setAssignments(assignmentData);
        
        if (assignmentData.length === 0) {
          showToast('No container assignments found', 'info');
        }
      } else {
        console.error('❌ API returned error:', response.error);
        showToast(response.error || 'Failed to fetch assignments', 'error');
        setAssignments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      showToast('Network error: Unable to fetch data from server', 'error');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };
  const checkServiceStatus = async () => {
    try {
      const [mainService, icloudService] = await Promise.allSettled([
        apiService.getServiceStatus(),
        apiService.getICloudServiceStatus()
      ]);
      
      const mainServiceOnline = mainService.status === 'fulfilled' && mainService.value.success;
      const icloudServiceOnline = icloudService.status === 'fulfilled' && icloudService.value.success;
      
      setServiceStatus({
        main: mainServiceOnline,
        icloud: icloudServiceOnline,
        overall: mainServiceOnline && icloudServiceOnline
      });
    } catch (error) {
      setServiceStatus({
        main: false,
        icloud: false,
        overall: false
      });
    }
  };

  const handleViewLocation = async (assetId, containerNo) => {
    if (!assetId) {
      showToast('Asset ID not available for this container', 'error');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`location_${assetId}`]: true }));
    
    try {
      const response = await apiService.getAssetLocation(assetId);
      if (response.success && response.data) {
        setSelectedLocation({
          ...response.data,
          containerNo,
          assetId
        });
        setShowMapModal(true);
      } else {
        showToast('Location data not available', 'error');
      }

      console.log("location response:", response);
    } catch (error) {
      console.error('Error fetching location:', error);
      showToast('Failed to fetch location data', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`location_${assetId}`]: false }));
    }
  };

  const handleUnlockDevice = async (assetId, containerNo) => {
    if (!assetId) {
      showToast('Asset ID not available for this container', 'error');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`unlock_${assetId}`]: true }));
    
    try {
      const response = await apiService.unlockDevice(assetId);
      if (response.success) {
        showToast(`Unlock command sent successfully for ${containerNo}`, 'success');
      } else {
        showToast('Failed to send unlock command', 'error');
      }
    } catch (error) {
      console.error('Error unlocking device:', error);
      showToast('Failed to unlock device', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`unlock_${assetId}`]: false }));
    }
  };

  const handleBulkLocationTracking = async () => {
    const selectedAssets = assignments
      .filter(assignment => assignment.f_asset_id)
      .map(assignment => assignment.f_asset_id)
      .slice(0, 5); // Limit to first 5 for demo

    if (selectedAssets.length === 0) {
      showToast('No assets available for bulk tracking', 'error');
      return;
    }

    setLoadingStates(prev => ({ ...prev, bulkTracking: true }));
    
    try {
      const response = await apiService.getMultipleAssetLocations(selectedAssets);
      if (response.success && response.data) {
        showToast(`Bulk location tracking completed for ${selectedAssets.length} assets`, 'success');
        console.log('Bulk tracking results:', response.data);
        // You can update the UI to show all locations or process the data as needed
      } else {
        showToast('Bulk location tracking failed', 'error');
      }
    } catch (error) {
      console.error('Error in bulk location tracking:', error);
      showToast('Failed to perform bulk location tracking', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, bulkTracking: false }));
    }
  };

  const handleDeviceLocationTracking = async (deviceId, containerNo) => {
    if (!deviceId) {
      showToast('Device ID not available for this container', 'error');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`device_${deviceId}`]: true }));
    
    try {
      const response = await apiService.getDeviceLocation(deviceId);
      if (response.success && response.data) {
        setSelectedLocation({
          ...response.data,
          containerNo,
          deviceId,
          type: 'device'
        });
        setShowMapModal(true);
      } else {
        showToast('Device location data not available', 'error');
      }
    } catch (error) {
      console.error('Error fetching device location:', error);
      showToast('Failed to fetch device location data', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`device_${deviceId}`]: false }));
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatFieldValue = (value) => {
    if (!value || value === 'null' || value === 'undefined') return 'N/A';
    return value;
  };
  if (loading && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          message="Connecting to E-Lock API and fetching container data..." 
          size="large" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-Lock Tracking System</h1>
              <p className="text-gray-600 mt-1">Monitor and control electronic locks in real-time</p>
            </div>            <div className="flex items-center space-x-4">              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                serviceStatus?.overall 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {serviceStatus?.overall ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>All Services Online</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {serviceStatus?.main === false && serviceStatus?.icloud === false 
                        ? 'All Services Offline'
                        : serviceStatus?.main === false 
                          ? 'Main Service Offline'
                          : 'iCloud API Offline'
                      }
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={handleBulkLocationTracking}
                disabled={loadingStates.bulkTracking || assignments.length === 0}
                className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {loadingStates.bulkTracking ? 'Tracking...' : 'Bulk Track'}
              </button>
              <button
                onClick={() => {
                  fetchAssignments();
                  checkServiceStatus();
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by container number, consignor, consignee..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchAssignments}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Container Assignments</h2>
            <p className="text-sm text-gray-600">
              {assignments.length} containers found
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Container Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight & Seal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment, index) => (
                  <tr key={assignment.id || assignment._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatFieldValue(assignment.container_no)}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {formatFieldValue(assignment.container_details)}
                        </div>
                        {assignment.f_asset_id && (
                          <div className="text-xs text-blue-600 mt-1">
                            Asset ID: {assignment.f_asset_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">CONSIGNOR:</span>
                          <div className="text-gray-900">{formatFieldValue(assignment.consignor_name)}</div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">CONSIGNEE:</span>
                          <div className="text-gray-900">{formatFieldValue(assignment.consignee_name)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">
                          {formatFieldValue(assignment.total_weight)}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="text-xs font-medium">SEAL:</span> {formatFieldValue(assignment.seal_no)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="text-xs font-medium text-green-600">PICKUP:</span>
                          <div className="text-gray-900 text-xs max-w-xs truncate">
                            {formatFieldValue(assignment.pickup_location_address)}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-red-600">DELIVERY:</span>
                          <div className="text-gray-900 text-xs max-w-xs truncate">
                            {formatFieldValue(assignment.delivery_location_address)}
                          </div>
                        </div>
                        {assignment.location && (
                          <div>
                            <span className="text-xs font-medium text-blue-600">CURRENT:</span>
                            <div className="text-blue-800 text-xs max-w-xs truncate">
                              {formatFieldValue(assignment.location)}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleViewLocation(assignment.f_asset_id, assignment.container_no)}
                          disabled={!assignment.f_asset_id || loadingStates[`location_${assignment.f_asset_id}`]}
                          className={`inline-flex items-center justify-center px-3 py-1 border text-xs rounded-md transition-colors ${
                            !assignment.f_asset_id 
                              ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          {loadingStates[`location_${assignment.f_asset_id}`] ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <MapPin className="h-3 w-3 mr-1" />
                          )}
                          GPS Location
                        </button>
                        <button
                          onClick={() => handleUnlockDevice(assignment.f_asset_id, assignment.container_no)}
                          disabled={!assignment.f_asset_id || loadingStates[`unlock_${assignment.f_asset_id}`]}
                          className={`inline-flex items-center justify-center px-3 py-1 border text-xs rounded-md transition-colors ${
                            !assignment.f_asset_id 
                              ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {loadingStates[`unlock_${assignment.f_asset_id}`] ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Unlock className="h-3 w-3 mr-1" />
                          )}
                          Unlock E-Lock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {assignments.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Map Modal */}
      {showMapModal && selectedLocation && (
        <MapModal
          location={selectedLocation}
          onClose={() => setShowMapModal(false)}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
