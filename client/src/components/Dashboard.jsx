import React, { useState, useEffect } from "react";
import {
  MapPin,
  Unlock,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  PhoneOff,
  ChevronDown,
  ArrowLeft,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiService, api } from "../services/api";
import TrackingMap from "./TrackingMap.jsx"; // Import TrackingMap instead of ElockGPSOperation
import Toast from "./Toast";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from "react-router-dom";
import ElockManagement from "./ElockManagement.jsx";

const Dashboard = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [filterType, setFilterType] = useState("");
  const [userData, setUserData] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [clientCallStates, setClientCallStates] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedIeCode, setSelectedIeCode] = useState("");
  const [showIeCodeDropdown, setShowIeCodeDropdown] = useState(false);

  // Tracking Map States
  const [showTrackingMap, setShowTrackingMap] = useState(false);
  const [selectedElockNo, setSelectedElockNo] = useState(null);
  const [selectedContainerData, setSelectedContainerData] = useState(null);
  const [activeTab, setActiveTab] = useState("assignments");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedAssignmentImages, setSelectedAssignmentImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [limits, setLimits] = useState(null);
  const [limitsLoading, setLimitsLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
    checkServiceStatus();
  }, []);
  useEffect(() => {
    if (userData) {
      fetchAssignments();
    }
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    filterType,
    userData,
    itemsPerPage,
    selectedIeCode,
  ]);

  const fetchLimits = async () => {
    try {
      const typeStr = filterType
        ? filterType.charAt(0).toUpperCase() + filterType.slice(1).toLowerCase()
        : "";

      console.log(
        `[DEBUG] fetchLimits triggered for ieCode: "${selectedIeCode}", type: "${typeStr}"`
      );

      setLimitsLoading(true);
      const response = await apiService.getElockAssignLimits(
        selectedIeCode || userData?.ieCodeNo || "",
        typeStr
      );

      console.log("[DEBUG] fetchLimits response:", response);

      const data = response?.data || response;

      if (Array.isArray(data) && data.length > 0) {
        setLimits(data[0]);
      } else if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        Object.keys(data).length > 0
      ) {
        setLimits(data);
      } else {
        console.warn("[DEBUG] fetchLimits: No data found in response");
        setLimits(null);
      }
    } catch (error) {
      console.error("[DEBUG] fetchLimits error:", error);
      setLimits(null);
    } finally {
      setLimitsLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "[DEBUG] Effect check - selectedIeCode:",
      selectedIeCode,
      "filterType:",
      filterType
    );
    if (selectedIeCode) {
      fetchLimits();
    }
  }, [selectedIeCode, filterType]);

  const BackButton = () => {
    return (
      <button
        type="button"
        onClick={() =>
          (window.location.href =
            "http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/")
        }
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6 mr-2" />
      </button>
    );
  };

  const fetchUserData = async () => {
    try {
      const response = await apiService.getUserData();
      if (response && response.success && response.user) {
        setUserData(response.user);

        if (response.user.ieCodes && response.user.ieCodes.length > 0) {
          setSelectedIeCode(response.user.ieCodes[0]);
        }

        if (response.user.ieCodes && response.user.ieCodes.length > 1) {
          showToast(
            `Authenticated with ${response.user.ieCodes.length} IE Codes`,
            "success"
          );
        } else if (response.user.ieCodeNo) {
          showToast(
            `Authenticated with IE Code: ${response.user.ieCodeNo}`,
            "success"
          );
        }
      } else {
        console.error("❌ Failed to fetch user data:", response);
        showToast("Failed to load user data", "error");
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      showToast("Error loading user data", "error");
    }
  };
  const toPositiveIntOrNull = (value) => {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) return null;
    return num;
  };

  const buildAssignmentParams = () => {
    const page = toPositiveIntOrNull(currentPage);
    const limit = toPositiveIntOrNull(itemsPerPage);

    const params = {
      ieCodeNo: selectedIeCode || userData?.ieCodeNo || "",
      search: searchTerm || "",
      status: statusFilter || "",
      filterType: filterType || "",
    };

    // send only when meaningful
    if (page !== null) params.page = page;
    if (limit !== null) params.limit = limit;

    return params;
  };
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = buildAssignmentParams();
      const response = await apiService.getElockAssignments(params);

      if (response.success) {
        console.log(
          "✅ Assignments fetched:",
          response.data.length,
          "containers"
        );

        setAssignments(response.data);
        setTotalCount(response.pagination?.totalCount || response.data.length);
        setTotalPages(response.pagination?.totalPages || 1);

        // Initialize client call states
        const initialCallStates = {};
        response.data.forEach((assignment) => {
          initialCallStates[assignment.id || assignment._id] =
            assignment.client_call_enabled || false;
        });
        setClientCallStates(initialCallStates);

        if (response.data.length === 0) {
          showToast(
            selectedIeCode
              ? `No container assignments found for IE Code: ${selectedIeCode}`
              : "No container assignments found",
            "info"
          );
        }
      } else {
        console.error("❌ API returned error:", response.error);
        showToast(response.error || "Failed to fetch assignments", "error");
        setAssignments([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("❌ Error fetching assignments:", error);
      showToast("Network error: Unable to fetch data from server", "error");
      setAssignments([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Track E-lock handler - Opens TrackingMap
  const handleTrackElock = (elockNo, containerData) => {
    if (!elockNo) {
      showToast("E-lock number not available for this container", "error");
      return;
    }

    setSelectedElockNo(elockNo);
    setSelectedContainerData(containerData);
    setShowTrackingMap(true);
  };

  const checkServiceStatus = async () => {
    try {
      const response = await apiService.getServiceStatus();
      setServiceStatus({
        main: response.success,
        overall: response.success,
      });
    } catch (error) {
      setServiceStatus({
        main: false,
        overall: false,
      });
    }
  };

  const handleUnlockDevice = async (assetId, containerNo) => {
    if (!assetId) {
      showToast("Asset ID not available for this container", "error");
      return;
    }
    setLoadingStates((prev) => ({ ...prev, [`unlock_${assetId}`]: true }));
    try {
      // Use your existing unlock logic from TrackingMap
      const adminRes = await fetch(
        "http://icloud.assetscontrols.com:8092/OpenApi/Admin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FAction: "QueryAdminAssetByAssetId",
            FTokenID: "e36d2589-9dc3-4302-be7d-dc239af1846c",
            FAssetID: assetId,
          }),
        }
      );
      const adminData = await adminRes.json();
      if (!adminData.FObject || !adminData.FObject.length) {
        showToast("Asset not found in system", "error");
        return;
      }
      const FGUID = adminData.FObject[0].FGUID;
      const unlockRes = await fetch(
        "http://icloud.assetscontrols.com:8092/OpenApi/Instruction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FTokenID: "e36d2589-9dc3-4302-be7d-dc239af1846c",
            FAction: "OpenLockControl",
            FAssetGUID: FGUID,
          }),
        }
      );
      const unlockData = await unlockRes.json();
      if (unlockData.Result === 200) {
        showToast(
          `Unlock command sent successfully for ${containerNo}`,
          "success"
        );
      } else {
        showToast(
          unlockData.Message || "Failed to send unlock command",
          "error"
        );
      }
    } catch (error) {
      console.error("Error unlocking device:", error);
      showToast("Failed to unlock device", "error");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`unlock_${assetId}`]: false }));
    }
  };

  const handleClientCallToggle = async (assignmentId) => {
    try {
      const currentState = clientCallStates[assignmentId] || false;
      const newState = !currentState;

      setClientCallStates((prev) => ({
        ...prev,
        [assignmentId]: newState,
      }));

      showToast(`Client call ${newState ? "enabled" : "disabled"}`, "success");
    } catch (error) {
      setClientCallStates((prev) => ({
        ...prev,
        [assignmentId]: !prev[assignmentId],
      }));
      showToast("Failed to update client call setting", "error");
    }
  };

  const handleViewImages = (assignment) => {
    if (
      assignment.uploadedImageUrls &&
      assignment.uploadedImageUrls.length > 0
    ) {
      setSelectedAssignmentImages(assignment.uploadedImageUrls);
      setCurrentImageIndex(0);
      setShowImageModal(true);
    } else {
      showToast("No images available for this assignment", "info");
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === selectedAssignmentImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedAssignmentImages.length - 1 : prev - 1
    );
  };

  const showToast = (message, type = "info") => {
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
  const hasMeaningfulValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) return false;
      if (["n/a", "na", "none", "null", "undefined", "-"].includes(trimmed)) {
        return false;
      }
    }
    return true;
  };

  const formatFieldValue = (value) => {
    if (!value || value === "null" || value === "undefined") return "N/A";
    return value;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "assigned":
        return "bg-green-100 text-green-800";
      case "unassigned":
        return "bg-yellow-100 text-yellow-800";
      case "returned":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderIeCodeSelector = () => {
    if (!userData?.ieCodes || userData.ieCodes.length <= 1) {
      return null;
    }

    return (
      <div className="relative ml-8">
        <button
          onClick={() => setShowIeCodeDropdown(!showIeCodeDropdown)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        >
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">IE Code: {selectedIeCode}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showIeCodeDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            <div className="p-2 max-h-60 overflow-y-auto">
              {userData.ieCodes.map((ieCode, index) => (
                <button
                  key={ieCode}
                  onClick={() => {
                    setSelectedIeCode(ieCode);
                    setShowIeCodeDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedIeCode === ieCode
                      ? "bg-blue-100 text-blue-800"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">{ieCode}</div>
                  {userData.ieCodeAssignments?.[index]?.importer_name && (
                    <div className="text-xs text-gray-600 truncate">
                      {userData.ieCodeAssignments[index].importer_name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && assignments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {console.log("[DEBUG] Render Dashboard - limits:", limits)}
      {/* Header */}
      <div className="flex justify-between items-center py-6">
        <div className="flex flex-col items-start ml-10">
          <div className="flex items-center">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900 ml-2">
              E-Lock Tracking System
            </h1>
            {renderIeCodeSelector()}
          </div>
          <p className="text-gray-600 mt-1 ml-8">
            Monitor and control electronic locks in real-time
          </p>
          {userData && (
            <div className="flex items-center mt-2 text-sm text-blue-600 ml-8">
              <User className="h-4 w-4 mr-1" />
              <span>
                {userData.ieCodes && userData.ieCodes.length > 1
                  ? `${userData.ieCodes.length} IE Codes`
                  : `IE Code: ${userData.ieCodeNo}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center mr-10 space-x-4">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              serviceStatus?.overall
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
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
              fetchLimits();
            }}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
          <button
            onClick={() => fetchLimits()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Limits
          </button>
          <div>{import.meta.env.VERSION}</div>
        </div>
      </div>

      {/* Container Assignments */}
      <div className="max-w-7.5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 max-w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-w-full">
          {/* Tab Navigation */}
          <div className="max-w-7.5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="border-b border-gray-200 flex justify-between items-center">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "assignments"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Container Assignments
                </button>
                {/* <button
                  onClick={() => setActiveTab("elock-management")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "elock-management"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  E-Lock Management
                </button> */}
              </nav>

              {/* Compact Assignment Limits */}
              <div className="flex items-center pr-2">
                {limitsLoading ? (
                  <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500 mr-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Updating...
                    </span>
                  </div>
                ) : limits ? (
                  <div className="flex items-center space-x-4">
                    {/* Assigned Pill */}
                    <div className="flex items-center space-x-3 pl-4 pr-2 py-1.5 bg-green-100 rounded-full">
                      <span className="text-sm font-bold text-green-800 uppercase tracking-wide">
                        ASSIGNED
                      </span>
                      <span className="flex items-center justify-center px-2.5 py-0.5 bg-white text-green-800 text-sm font-bold rounded-full min-w-[28px] shadow-sm">
                        {limits.assigned || 0}
                      </span>
                    </div>

                    {/* Remaining Pill */}
                    <div className="flex items-center space-x-3 pl-4 pr-2 py-1.5 bg-red-100 rounded-full">
                      <span className="text-sm font-bold text-red-900 uppercase tracking-wide">
                        REMAINING
                      </span>
                      <span className="flex items-center justify-center px-2.5 py-0.5 bg-white text-red-900 text-sm font-bold rounded-full min-w-[28px] shadow-sm">
                        {limits.remaining || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  filterType && (
                    <div className="px-4 py-1.5 bg-yellow-50 rounded-lg border border-yellow-100">
                      <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">
                        Sync Needed
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "assignments" ? (
            // Your existing assignments content
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Container Assignments
                    </h2>
                    <p className="text-sm text-gray-600">
                      {totalCount} total containers, showing{" "}
                      {assignments.length} on page {currentPage}
                      {selectedIeCode && ` for IE Code: ${selectedIeCode}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Items per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value={20}>20</option>
                        <option value={100}>100</option>
                        <option value={1000}>1000</option>
                      </select>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "text-gray-700 bg-white hover:bg-gray-50"
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
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Actions
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        LR No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Consignor
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Consignee
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Container No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Vehicle No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Driver Info
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        E-Lock Details
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Client Call
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Pickup Location
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Delivery Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment, index) => (
                      <tr
                        key={assignment.id || assignment._id || index}
                        className="hover:bg-gray-50"
                      >
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() =>
                                handleUnlockDevice(
                                  assignment.f_asset_id || assignment.elock_no,
                                  assignment.container_no
                                )
                              }
                              disabled={
                                !(
                                  assignment.f_asset_id || assignment.elock_no
                                ) ||
                                loadingStates[
                                  `unlock_${
                                    assignment.f_asset_id || assignment.elock_no
                                  }`
                                ]
                              }
                              className={`inline-flex items-center justify-center px-2 py-1 border text-xs rounded-md transition-colors ${
                                !(assignment.f_asset_id || assignment.elock_no)
                                  ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                                  : "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                              }`}
                            >
                              {loadingStates[
                                `unlock_${
                                  assignment.f_asset_id || assignment.elock_no
                                }`
                              ] ? (
                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Unlock className="h-3 w-3 mr-1" />
                              )}
                              Unlock
                            </button>
                            <button
                              onClick={() =>
                                handleTrackElock(
                                  assignment.f_asset_id || assignment.elock_no,
                                  assignment
                                )
                              }
                              disabled={
                                !(assignment.f_asset_id || assignment.elock_no)
                              }
                              className={`inline-flex items-center justify-center px-2 py-1 border text-xs rounded-md transition-colors ${
                                !(assignment.f_asset_id || assignment.elock_no)
                                  ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                                  : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                              }`}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Track
                            </button>
                            <button
                              onClick={() => handleViewImages(assignment)}
                              disabled={
                                !assignment.uploadedImageUrls ||
                                assignment.uploadedImageUrls.length === 0
                              }
                              className={`inline-flex items-center justify-center px-2 py-1 border text-xs rounded-md transition-colors ${
                                !assignment.uploadedImageUrls ||
                                assignment.uploadedImageUrls.length === 0
                                  ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                                  : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                              }`}
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Images
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {formatFieldValue(assignment.tr_no)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {formatFieldValue(assignment.consignor_name)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {formatFieldValue(assignment.consignee_name)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatFieldValue(assignment.container_no)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatFieldValue(assignment.vehicle_no)}
                          </div>
                        </td>
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
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatFieldValue(
                                assignment.elock_no || assignment.f_asset_id
                              )}
                            </div>
                            <div>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                  assignment.elock_status
                                )}`}
                              >
                                {formatFieldValue(assignment.elock_status)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleClientCallToggle(
                                assignment.id || assignment._id
                              )
                            }
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              clientCallStates[assignment.id || assignment._id]
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {clientCallStates[
                              assignment.id || assignment._id
                            ] ? (
                              <Phone className="h-3 w-3 mr-1" />
                            ) : (
                              <PhoneOff className="h-3 w-3 mr-1" />
                            )}
                            {clientCallStates[assignment.id || assignment._id]
                              ? "Enabled"
                              : "Disabled"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
                            <div
                              className="font-medium text-gray-900 break"
                              title={assignment.pickup_location_address}
                            >
                              {formatFieldValue(
                                assignment.pickup_location_address
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {formatFieldValue(
                              assignment.delivery_location_address
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {assignments.length === 0 && !loading && (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No assignments found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedIeCode
                      ? `No assignments found for IE Code: ${selectedIeCode}. Try selecting a different IE Code.`
                      : "Try adjusting your search criteria or filters."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // E-Lock Management Tab Content
            <ElockManagement />
          )}
        </div>

        {assignments.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No assignments found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedIeCode
                ? `No assignments found for IE Code: ${selectedIeCode}. Try selecting a different IE Code.`
                : "Try adjusting your search criteria or filters."}
            </p>
          </div>
        )}
      </div>

      {/* Tracking Map Modal */}
      {showTrackingMap && (
        <TrackingMap
          isOpen={showTrackingMap}
          onClose={() => {
            setShowTrackingMap(false);
            setSelectedElockNo(null);
            setSelectedContainerData(null);
          }}
          elockNo={selectedElockNo}
          containerId={selectedContainerData?.id || selectedContainerData?._id}
          containerData={selectedContainerData}
          source="containers"
        />
      )}

      {/* Image Preview Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Uploaded Images ({currentImageIndex + 1} /{" "}
                {selectedAssignmentImages.length})
              </h2>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedAssignmentImages([]);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 flex-1 flex items-center justify-center bg-gray-100 relative min-h-[400px]">
              {selectedAssignmentImages.length > 0 ? (
                <>
                  {/* Left Button */}
                  {selectedAssignmentImages.length > 1 && (
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}

                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={selectedAssignmentImages[currentImageIndex]}
                      alt={`Upload ${currentImageIndex + 1}`}
                      className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300?text=Image+Load+Error";
                      }}
                    />
                  </div>

                  {/* Right Button */}
                  {selectedAssignmentImages.length > 1 && (
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}

                  {/* Image Indicators */}
                  {selectedAssignmentImages.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                      {selectedAssignmentImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentImageIndex
                              ? "bg-blue-600"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* View Full Link */}
                  <a
                    href={selectedAssignmentImages[currentImageIndex]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 text-xs font-semibold rounded shadow hover:bg-white transition-colors"
                  >
                    View Full Size
                  </a>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No images available to display.
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedAssignmentImages([]);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
