# Usage Guide for Split ElockGPSOperation Components

## Quick Start

The main component works exactly the same as before:

```jsx
import ElockGPSOperation from './components/Elocktracking/ElockGPSOperation';

// Usage remains the same
<ElockGPSOperation 
  isOpen={isDialogOpen} 
  onClose={handleClose} 
  elockNo="ELK123456" 
/>
```

## Individual Component Usage

### 1. Using MapComponent Separately

```jsx
import MapComponent from './components/Elocktracking/components/MapComponent';

<MapComponent
  locationData={locationData}
  assetData={assetData}
  title="Device Location"
/>
```

### 2. Using AssetInformation Card

```jsx
import AssetInformation from './components/Elocktracking/components/AssetInformation';

<AssetInformation assetData={assetData} />
```

### 3. Using Custom Hooks

```jsx
import { useElockData } from './components/Elocktracking/hooks/useElockData';
import { useRealTimeTracking } from './components/Elocktracking/hooks/useRealTimeTracking';

function MyComponent({ elockNo }) {
  const { loading, assetData, locationData, error } = useElockData(elockNo);
  const { isRealTimeConnected, realTimeData } = useRealTimeTracking(elockNo);
  
  // Use the data...
}
```

## Configuration

### API Endpoints
Edit `/constants/config.js` to update API endpoints:

```js
export const API_CONFIG = {
  TOKEN_ID: "your-token-id",
  ADMIN_API_URL: "your-admin-api-url",
  LBS_API_URL: "your-lbs-api-url",
  SERVER_URL: "your-websocket-server-url",
};
```

### Animations
Modify `/constants/animations.js` to customize animations:

```js
export const advancedAnimations = `
  @keyframes customAnimation {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .custom-animation { animation: customAnimation 2s infinite; }
`;
```

## Adding New Features

### 1. Adding a New Tab

1. Update `TabNavigation.jsx` to include the new tab
2. Add the tab content in `ElockGPSOperation.js`
3. Handle tab switching logic

### 2. Adding New Real-time Event Types

1. Update `useRealTimeTracking.js` hook
2. Add new event handlers in the socket connection
3. Update `RealTimeTrackingSection.jsx` to display new data

### 3. Adding New History Filters

1. Update `timeRangeOptions` in `/constants/config.js`
2. Modify `HistorySection.jsx` to handle new filters
3. Update the API call in `useElockData.js`

## Testing Individual Components

Each component can be tested in isolation:

```jsx
// Test AssetInformation
import { render } from '@testing-library/react';
import AssetInformation from './AssetInformation';

const mockAssetData = {
  FAssetID: "ELK123",
  FVehicleName: "Test Vehicle",
  FAgentName: "Test Agent",
  FExpireTime: "2024-12-31T23:59:59.000Z"
};

test('renders asset information', () => {
  render(<AssetInformation assetData={mockAssetData} />);
  // Add assertions...
});
```

## Performance Optimization

### 1. Lazy Loading Components

```jsx
import { lazy, Suspense } from 'react';

const RealTimeTrackingSection = lazy(() => 
  import('./components/RealTimeTrackingSection')
);

// Usage with Suspense
<Suspense fallback={<LoadingState loading={true} />}>
  <RealTimeTrackingSection {...props} />
</Suspense>
```

### 2. Memoization

```jsx
import { memo } from 'react';

const AssetInformation = memo(({ assetData }) => {
  // Component implementation
});
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Errors**
   - Check `SERVER_URL` in config
   - Verify WebSocket server is running
   - Check firewall/proxy settings

2. **Map Not Loading**
   - Verify `truckIcon` path in `MapComponent.jsx`
   - Check Leaflet CSS imports
   - Ensure internet connection for tile layers

3. **API Errors**
   - Verify `TOKEN_ID` and API URLs in config
   - Check API server status
   - Review browser network tab for failed requests

### Debug Mode

Enable debug logging by adding to your environment:

```bash
REACT_APP_DEBUG=true
```

Then check browser console for detailed logs from the hooks and components.
