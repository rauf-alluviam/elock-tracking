import React, { useState, useEffect } from 'react';
import { MapPin, Unlock, RefreshCw, Search, AlertCircle, CheckCircle, User, Phone, PhoneOff } from 'lucide-react';
import { apiService, api } from '../services/api';
import MapModal from './MapModal';
import Toast from './Toast';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const ADMIN_API_URL = "http://icloud.assetscontrols.com:8092/OpenApi/Admin";
const INSTRUCTION_API_URL = "http://icloud.assetscontrols.com:8092/OpenApi/Instruction";
const TOKEN_ID = "e36d2589-9dc3-4302-be7d-dc239af1846c";

const Dashboard = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [filterType, setFilterType] = useState('');
  const [userData, setUserData] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [clientCallStates, setClientCallStates] = useState({});

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUserData();
    checkServiceStatus();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchAssignments();
    }
  }, [currentPage, searchTerm, statusFilter, filterType, userData]);

  const fetchUserData = async () => {
    try {
      const response = await apiService.getUserData();
      if (response && response.success && response.user) {
        setUserData(response.user);
        console.log('✅ User data loaded:', response.user);
        if (response.user.ieCodeNo) {
          showToast(`Authenticated with IE Code: ${response.user.ieCodeNo}`, 'success');
        }
      } else {
        console.error('❌ Failed to fetch user data:', response);
        showToast('Failed to load user data', 'error');
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      showToast('Error loading user data', 'error');
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching assignments...');
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter,
        filterType: filterType,
        ieCodeNo: userData?.ieCodeNo || ''
      };

      console.log('📊 Request params:', params);
      
      const response = await apiService.getElockAssignments(params);
      
      if (response.success) {
        console.log('✅ Assignments fetched:', response.data.length, 'containers');
        console.log('📈 Total count:', response.pagination?.totalCount || response.data.length);
        
        setAssignments(response.data);
        setTotalCount(response.pagination?.totalCount || response.data.length);
        
        // Initialize client call states
        const initialCallStates = {};
        response.data.forEach(assignment => {
          initialCallStates[assignment.id || assignment._id] = assignment.client_call_enabled || false;
        });
        setClientCallStates(initialCallStates);
        
        if (response.data.length === 0) {
          showToast('No container assignments found', 'info');
        }
      } else {
        console.error('❌ API returned error:', response.error);
        showToast(response.error || 'Failed to fetch assignments', 'error');
        setAssignments([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      showToast('Network error: Unable to fetch data from server', 'error');
      setAssignments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const checkServiceStatus = async () => {
    try {
      const response = await apiService.getServiceStatus();
      setServiceStatus({
        main: response.success,
        overall: response.success
      });
    } catch (error) {
      setServiceStatus({
        main: false,
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
      // Step 1: Get FGUID from Admin API
      const adminRes = await fetch(ADMIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FAction: 'QueryAdminAssetByAssetId',
          FTokenID: TOKEN_ID,
          FAssetID: assetId
        })
      });
      const adminData = await adminRes.json();
      if (!adminData.FObject || !adminData.FObject.length) {
        showToast('Asset not found in system', 'error');
        return;
      }
      const FGUID = adminData.FObject[0].FGUID;
      // Step 2: Send unlock instruction
      const unlockRes = await fetch(INSTRUCTION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FTokenID: TOKEN_ID,
          FAction: 'OpenLockControl',
          FAssetGUID: FGUID
        })
      });
      const unlockData = await unlockRes.json();
      if (unlockData.Result === 200) {
        showToast(`Unlock command sent successfully for ${containerNo}`, 'success');
      } else {
        showToast(unlockData.Message || 'Failed to send unlock command', 'error');
      }
    } catch (error) {
      console.error('Error unlocking device:', error);
      showToast('Failed to unlock device', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`unlock_${assetId}`]: false }));
    }
  };

  const handleClientCallToggle = async (assignmentId) => {
    try {
      const currentState = clientCallStates[assignmentId] || false;
      const newState = !currentState;
      
      // Optimistically update the UI
      setClientCallStates(prev => ({
        ...prev,
        [assignmentId]: newState
      }));
      
      // Here you would typically make an API call to update the server
      // await apiService.updateClientCall(assignmentId, newState);
      
      showToast(`Client call ${newState ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      // Revert the change if API call fails
      setClientCallStates(prev => ({
        ...prev,
        [assignmentId]: !prev[assignmentId]
      }));
      showToast('Failed to update client call setting', 'error');
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

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterTypeChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const formatFieldValue = (value) => {
    if (!value || value === 'null' || value === 'undefined') return 'N/A';
    return value;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return 'bg-green-100 text-green-800';
      case 'unassigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && assignments.length === 0) {
    return <LoadingSpinner />;
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
              {userData && (
                <div className="flex items-center mt-2 text-sm text-blue-600">
                  <User className="h-4 w-4 mr-1" />
                  <span>IE Code: {userData.ieCodeNo}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                serviceStatus?.overall 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {serviceStatus?.overall ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Service Online</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Service Offline</span>
                  </>
                )}
              </div>
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

      <div className="max-w-7.5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 max-w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-2 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by container number, consignor, consignee..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full min-w-[350px] pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">All Status</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="RETURNED">Returned</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            {/* Filter Type */}
            <div className="relative">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={filterType}
                onChange={handleFilterTypeChange}
              >
                <option value="">All Types</option>
                <option value="consignor">Consignor</option>
                <option value="consignee">Consignee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Container Assignments</h2>
                <p className="text-sm text-gray-600">
                  {totalCount} total containers, showing {assignments.length} on page {currentPage}
                </p>
              </div>
              
              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">LR No</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Consignor</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Consignee</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Container No</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vehicle No</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Driver Info</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">E-Lock Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client Call</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pickup Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Delivery Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment, index) => (
                  <tr key={assignment.id || assignment._id || index} className="hover:bg-gray-50">
                    {/* LR NO*/}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {formatFieldValue(assignment.tr_no)}
                      </div>
                    </td>
                    {/* Consignor */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {formatFieldValue(assignment.consignor_name)}
                      </div>
                    </td>
                    {/* Consignee */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {formatFieldValue(assignment.consignee_name)}
                      </div>
                    </td>
                    {/* Container No */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatFieldValue(assignment.container_no)}
                      </div>
                    </td>
                    {/* Vehicle No */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatFieldValue(assignment.vehicle_no)}
                      </div>
                    </td>
                    {/* Driver Info */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatFieldValue(assignment.driver_name)}
                        </div>
                        <div className="text-gray-500">
                          {formatFieldValue(assignment.driver_phone)}
                        </div>
                      </div>
                    </td>
                    {/* E-Lock Details */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatFieldValue(assignment.elock_no || assignment.f_asset_id)}
                        </div>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.elock_status)}`}>
                            {formatFieldValue(assignment.elock_status)}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Client Call Toggle */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleClientCallToggle(assignment.id || assignment._id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          clientCallStates[assignment.id || assignment._id]
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {clientCallStates[assignment.id || assignment._id] ? (
                          <Phone className="h-3 w-3 mr-1" />
                        ) : (
                          <PhoneOff className="h-3 w-3 mr-1" />
                        )}
                        {clientCallStates[assignment.id || assignment._id] ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    {/* Pickup Location */}
                  <td className="px-6 py-4">
  <div className="text-sm max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
    <div
      className="font-medium text-gray-900 break"
      title={assignment.pickup_location_address}
    >
      {formatFieldValue(assignment.pickup_location_address)}
    </div>
  </div>
</td>
                    {/* Delivery Location */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs">
                        {formatFieldValue(assignment.delivery_location_address)}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                          
                        <button
                          onClick={() => handleUnlockDevice(assignment.f_asset_id || assignment.elock_no, assignment.container_no)}
                          disabled={!(assignment.f_asset_id || assignment.elock_no) || loadingStates[`unlock_${assignment.f_asset_id || assignment.elock_no}`]}
                          className={`inline-flex items-center justify-center px-2 py-1 border text-xs rounded-md transition-colors ${
                            !(assignment.f_asset_id || assignment.elock_no)
                              ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {loadingStates[`unlock_${assignment.f_asset_id || assignment.elock_no}`] ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Unlock className="h-3 w-3 mr-1" />
                          )}
                          Unlock
                        </button>
                        <button
                          onClick={() => navigate(`/elock/${assignment.f_asset_id || assignment.elock_no}`)}
                          disabled={!(assignment.f_asset_id || assignment.elock_no)}
                          className={`inline-flex items-center justify-center px-2 py-1 border text-xs rounded-md transition-colors ${
                            !(assignment.f_asset_id || assignment.elock_no)
                              ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                          }`}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Track
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  const pageNum = Math.max(1, currentPage - 2) + index;
                  if (pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {assignments.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or filters.</p>
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