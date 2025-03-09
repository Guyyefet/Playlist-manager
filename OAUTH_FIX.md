# OAuth Authentication Flow Fix

## Initial Issue

The application was encountering an error during the OAuth authentication flow with Google:

```
SvelteKitError: Not found: /login/callback
```

This error occurred because the OAuth redirect URI was misconfigured, causing a mismatch between where Google was redirecting after authentication and where our application was expecting to handle the callback.

## Root Cause of Initial Issue

1. The OAuth configuration in `internal/auth/auth.go` was setting the `RedirectURL` to `http://localhost:8080/api/auth/callback`, which pointed to the backend server.
2. However, the frontend SvelteKit application didn't have a proper route to handle this callback.
3. When Google redirected to the backend after authentication, the backend wasn't properly communicating with the frontend.

## Initial Solution

We implemented a comprehensive fix with the following changes:

1. **Created a dedicated callback page in the frontend**:
   - Added a new route at `/login/callback` (`web/src/routes/login/callback/+page.svelte`) to handle the OAuth callback
   - This page receives the authorization code from Google, exchanges it for a token via the backend, and redirects to the home page

2. **Updated the OAuth configuration**:
   - Changed the `RedirectURL` in `internal/auth/auth.go` to point to the frontend's callback page: `http://localhost:5173/login/callback`
   - This ensures Google redirects to a route that exists in our frontend application

3. **Added CORS support in the backend**:
   - Updated the backend to include proper CORS headers for all responses
   - This allows the frontend (running on port 5173) to make API requests to the backend (running on port 8080)

4. **Enhanced error handling and logging**:
   - Added detailed logging in both frontend and backend to help diagnose authentication issues
   - Improved error messages to provide better feedback during the authentication process

## Additional Issues

After implementing the initial fix, we encountered two additional issues:

1. **Login Button Not Redirecting to Auth Page**
   - The auth URL was being generated asynchronously in the `onMount` function, which might not have completed by the time the login button was clicked.
   - This resulted in an "Auth URL is empty, cannot redirect" error.

2. **Delay in Redirection to Main App Page**
   - The callback handling was not optimized, causing delays in the authentication flow.
   - There was no proper error handling or logging to diagnose issues.

## Additional Solutions

### Login Page Improvements

1. **Auth URL Generation**
   - Moved the auth URL generation outside of the `onMount` function to ensure it's available immediately when the page loads.
   - The auth URL is now generated synchronously during component initialization.
   ```typescript
   // Generate the auth URL immediately
   const clientId = '1027325691752-i9c97l70j8vh1aquchhsb8i7v7t9a4mn.apps.googleusercontent.com';
   const redirectUri = encodeURIComponent('http://localhost:5173/login/callback');
   const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly');
   
   // Generate the auth URL outside of onMount to ensure it's available immediately
   const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=state-token`;
   ```

2. **Improved Error Handling**
   - Added better error handling and logging to diagnose issues.
   - Added validation to ensure the auth URL is properly formatted before redirecting.

### Callback Page Improvements

1. **Dual-Approach Strategy**
   - Implemented a dual-approach strategy in the callback page:
     - First tries a direct request to the backend for faster processing
     - Falls back to the proxy approach if the direct request fails
   ```typescript
   // First try a direct request to the backend
   try {
       console.log('Trying direct request to backend...');
       const directResponse = await fetch('http://localhost:8080/login/callback', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({ code })
       });
       
       // ... handle response ...
       
   } catch (err) {
       // Fall back to the proxy if direct request fails
       // ... proxy request code ...
   }
   ```

2. **Increased Delay Before Redirecting**
   - Added a small delay before redirecting to ensure the token is properly saved.
   ```typescript
   setTimeout(() => {
       // Redirect to home page after successful auth
       window.location.href = '/home';
   }, 1000); // 1 second delay
   ```

3. **Performance Timing**
   - Added performance timing to measure how long each step takes.
   ```typescript
   console.time('Token exchange');
   // ... token exchange code ...
   console.timeEnd('Token exchange');
   ```

### Proxy Configuration Fixes

1. **Fixed Vite Proxy Configuration**
   - Updated the Vite proxy configuration to correctly route requests to the backend.
   ```javascript
   proxy: {
       '/api': {
           target: 'http://localhost:8080',
           changeOrigin: true,
           secure: false,
           ws: true
       },
       '/login/callback': {
           target: 'http://localhost:8080', // Fixed target URL
           changeOrigin: true,
           secure: false
       }
   }
   ```

## Complete OAuth Flow

The OAuth flow now works as follows:

1. User clicks "Login with Google" on the login page
2. Frontend redirects to Google's OAuth page using a synchronously generated auth URL
3. After authentication, Google redirects to `http://localhost:5173/login/callback` with an authorization code
4. The callback page tries a direct request to the backend first, then falls back to the proxy if needed
5. The backend validates the code with Google, saves the token, and returns a success response
6. After a short delay to ensure the token is saved, the frontend redirects to the home page

These improvements have made the authentication flow more reliable and provided better visibility into what's happening during the process. The login button now correctly redirects to the Google authentication page, and the callback handling is more robust.
