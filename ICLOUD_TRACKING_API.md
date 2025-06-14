# iCloud Assets Controls API Integration

This document explains how the E-Lock Tracking System integrates with the iCloud Assets Controls API for location tracking.

## API Overview

The system now integrates with the iCloud Assets Controls LBS (Location Based Services) API:
- **Base URL**: `http://icloud.assetscontrols.com:8092/OpenApi`
- **Endpoint**: `/LBS`
- **Method**: POST

## Authentication Flow

The system expects an authentication response in the following format:
```json
{
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
}
```

From this response, the system extracts:
- `FTokenID`: Used for API authentication
- `FUserGUID`: User identification
- `FExpireTime`: Token expiration time

## API Request Format

### Single Asset Location
```json
{
    "FTokenID": "e36d2589-9dc3-4302-be7d-dc239af1846c",
    "FAction": "QueryLBSMonitorListByFGUIDs",
    "FGUIDs": "asset_id_here",
    "FType": 1
}
```

### Multiple Asset Locations
```json
{
    "FTokenID": "e36d2589-9dc3-4302-be7d-dc239af1846c",
    "FAction": "QueryLBSMonitorListByFGUIDs",
    "FGUIDs": "asset1,asset2,asset3",
    "FType": 1
}
```

### Device Location
```json
{
    "FTokenID": "e36d2589-9dc3-4302-be7d-dc239af1846c",
    "FAction": "QueryLBSMonitorListByFGUIDs",
    "FGUIDs": "device_id_here",
    "FType": 2
}
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| FTokenID | Yes | string | Authentication token from login response |
| FAction | Yes | string | Always "QueryLBSMonitorListByFGUIDs" for location queries |
| FGUIDs | Yes | string | Asset/device IDs (comma-separated for multiple) |
| FType | Yes | int | 1 for assets, 2 for devices |

## Implementation Details

### Server-Side (Node.js)

The integration is implemented in `/server/services/elockApi.js`:

- `authenticateICloudAPI()`: Handles authentication and token management
- `getAssetLocation(assetId)`: Get single asset location
- `getMultipleAssetLocations(assetIds)`: Get multiple asset locations
- `getDeviceLocation(deviceId)`: Get device location

### Client-Side (React)

New API functions in `/client/src/services/api.js`:

- `getAssetLocation(assetId)`: Single asset tracking
- `getMultipleAssetLocations(assetIds)`: Bulk asset tracking
- `getDeviceLocation(deviceId)`: Device tracking
- `getICloudServiceStatus()`: Check iCloud API status

### Dashboard Features

The Dashboard component now includes:

- **Bulk Tracking Button**: Track multiple assets simultaneously
- **Enhanced Service Status**: Shows both main service and iCloud API status
- **Device Location Tracking**: Support for device-type location queries

## API Endpoints

### Backend Routes

- `POST /api/elock/location` - Single asset location
- `POST /api/elock/locations/multiple` - Multiple asset locations
- `POST /api/elock/device-location` - Device location
- `GET /api/elock/icloud-status` - iCloud API service status

### Usage Examples

#### Single Asset Location
```javascript
const location = await apiService.getAssetLocation('asset_123');
```

#### Multiple Asset Locations
```javascript
const locations = await apiService.getMultipleAssetLocations(['asset_1', 'asset_2', 'asset_3']);
```

#### Device Location
```javascript
const deviceLocation = await apiService.getDeviceLocation('device_456');
```

## Error Handling

The system includes comprehensive error handling:
- Token validation and automatic renewal
- API connectivity checks
- Graceful degradation when services are unavailable
- User-friendly error messages in the UI

## Configuration

To configure the iCloud API integration, update your environment variables:

```env
# Add any required iCloud API configuration
ICLOUD_API_BASE_URL=http://icloud.assetscontrols.com:8092/OpenApi
```

## Token Management

- Tokens are automatically managed and renewed before expiration
- The system checks token validity before each API call
- Failed authentication attempts are logged and reported

## Testing

Use the new API status endpoint to test connectivity:
```
GET /api/elock/icloud-status
```

This will return the current status of the iCloud Assets Controls API integration.
