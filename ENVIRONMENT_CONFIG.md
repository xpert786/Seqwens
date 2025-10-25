# Environment Configuration

This application uses conditional URL routing based on the server environment.

## Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
# Set to 'true' to use server URL, 'false' to use localhost
VITE_IS_SERVER=false
```

## URL Configuration

- **When `VITE_IS_SERVER=true`**: Uses server URL `http://168.231.121.7/seqwens-frontend`
- **When `VITE_IS_SERVER=false`**: Uses localhost URL `http://localhost:5173`

## Usage

The application automatically detects the environment and uses the appropriate URL for:
- Login page navigation
- Protected route redirects
- API authentication redirects

## Files Modified

1. `src/ClientOnboarding/utils/urlUtils.jsx` - New utility functions for URL handling
2. `src/ClientOnboarding/components/Sidebar.jsx` - Updated logout navigation
3. `src/ClientOnboarding/Login-setup/SetNewPassword.jsx` - Updated password reset navigation
4. `src/ClientOnboarding/components/ProtectedRoute.jsx` - Updated protected route redirects
5. `src/ClientOnboarding/utils/apiUtils.jsx` - Updated API authentication redirects

## How It Works

The `urlUtils.jsx` file provides utility functions that:
- Check the `VITE_IS_SERVER` environment variable
- Return the appropriate base URL (server or localhost)
- Handle navigation with conditional URLs
- Provide helper functions for common navigation patterns

All navigation to `/login` now uses these utility functions to ensure the correct URL is used based on the environment configuration.
