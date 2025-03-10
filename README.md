# MiBiblia App Debug Logging System

This system provides comprehensive debug logging capabilities for the MiBiblia app, allowing developers to track and analyze app behavior, especially during startup and error scenarios.

## Setup

1. Deploy the PHP API files to your server:
   - `api/debug_logger.php` - Handles incoming log requests
   - `api/view_logs.php` - Web interface to view logs
   - `api/logs/` - Directory where logs are stored

2. Update the API URL in `services/DebugLogger.ts`:
   ```typescript
   private static API_URL = 'https://mibiblia.click/api/debug_logger.php';
   ```

## Features

- Automatic logging of app initialization
- Device information logging (model, OS, app version)
- Error boundary for catching and logging unhandled errors
- Async error handling utilities
- Web interface for viewing logs with filtering and clearing capabilities

## Usage

### In Components

```typescript
import DebugLogger from './services/DebugLogger';

// Log information
await DebugLogger.info('User logged in successfully');

// Log debug messages
await DebugLogger.debug('Cache initialized');

// Log errors
await DebugLogger.error('Failed to load user data');
```

### Error Handling

```typescript
import { wrapAsync } from './utils/errorHandler';

const loadData = wrapAsync(async () => {
  // Your async code here
  const data = await fetchData();
  return data;
}, 'loadData');
```

### Viewing Logs

1. Access the log viewer at: `https://mibiblia.click/api/view_logs.php`
2. Use the "Refresh Logs" button to see new entries
3. Use the "Clear Logs" button to reset the log file

## Log Format

Each log entry includes:
- Timestamp
- Log level (INFO, ERROR, DEBUG)
- Message
- Device information (when available)

Example:
```
[2023-08-10T15:30:45Z] [INFO] App initialization started
Device Info: {"brand":"Apple","modelName":"iPhone 12","osName":"iOS","osVersion":"15.0"}
```

## Security Considerations

- Ensure the `api/logs` directory is not publicly accessible
- Add authentication to `view_logs.php` in production
- Use HTTPS for the API endpoint
- Implement rate limiting on the logging endpoint

## Troubleshooting

1. If logs are not appearing:
   - Check the API URL configuration
   - Verify PHP server permissions
   - Check network connectivity

2. If the app crashes:
   - Check the error logs for uncaught exceptions
   - Verify the ErrorBoundary component is properly wrapped around the app

3. If device info is missing:
   - Ensure expo-device is properly installed
   - Check platform compatibility
