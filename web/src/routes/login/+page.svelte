<script lang="ts">
    import { onMount } from 'svelte';

    // Generate the auth URL immediately
    // This should be a Google OAuth URL that redirects to the callback endpoint
    const clientId = '1027325691752-i9c97l70j8vh1aquchhsb8i7v7t9a4mn.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:5173/login/callback');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly');
    
    // Generate the auth URL outside of onMount to ensure it's available immediately
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=state-token`;
    console.log('Generated auth URL:', authUrl);
    
    let errorMessage = '';
    let isAuthenticated = false;

    // Only access window in onMount which runs in the browser
    onMount(async () => {
        console.log('Login page mounted');

        // Check authentication status
        try {
            const response = await fetch('/api/auth/status');
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    // User is already authenticated, redirect to home
                    isAuthenticated = true;
                    window.location.href = '/home';
                    return;
                }
            }
        } catch (err) {
            console.error('Error checking auth status:', err);
        }
    });

    function handleLogin() {
        console.log('Login button clicked');
        console.log('Redirecting to auth URL:', authUrl);
        
        if (!authUrl) {
            console.error('Auth URL is empty, cannot redirect');
            errorMessage = 'Authentication service unavailable. Please try again later.';
            return;
        }
        
        // Use window.open instead of window.location.href for more reliable redirection
        window.open(authUrl, '_self');
    }
</script>

<div class="login-container">
    <h1>Playlist Manager Login</h1>
    <button on:click={handleLogin} class="login-button">
        Login with Google
    </button>
</div>

<style>
    .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }

    .login-button {
        padding: 12px 24px;
        font-size: 1.2rem;
        background-color: #ff0000;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .login-button:hover {
        background-color: #cc0000;
    }
</style>
