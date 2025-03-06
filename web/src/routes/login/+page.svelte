<script lang="ts">
    import { onMount } from 'svelte';

    let authUrl = '';
    let errorMessage = '';
    let urlParams;
    let code;
    let error;

    // Only access window in onMount which runs in the browser
    onMount(async () => {
        console.log('Login page mounted');
        
        // Check if we're handling the callback from YouTube auth
        urlParams = new URLSearchParams(window.location.search);
        code = urlParams.get('code');
        error = urlParams.get('error');
        
        console.log('URL params:', window.location.search);
        console.log('Code:', code);
        console.log('Error:', error);

        // If we have an error from auth, show it
        if (error) {
            console.log('Authentication error:', error);
            errorMessage = 'Authentication failed. Please try again.';
            return;
        }

        // If we have a code, exchange it for a token
        if (code) {
            console.log('Exchanging code for token');
            try {
                const response = await fetch('http://localhost:8080/api/auth/callback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                if (response.ok) {
                    // Redirect to home page after successful auth
                    window.location.href = '/home';
                    return;
                } else {
                    errorMessage = 'Authentication failed. Please try again.';
                }
            } catch (err) {
                console.error('Error during authentication:', err);
                errorMessage = 'An error occurred during authentication.';
            }
            return;
        }

        // Check if user is already authenticated
        try {
            const response = await fetch('http://localhost:8080/api/playlists');
            if (response.ok) {
                // User is already authenticated, redirect to home
                window.location.href = '/home';
                return;
            }
        } catch (err) {
            // Ignore 404 errors since backend might not be running
            if (err instanceof Error && !err.message.includes('404')) {
                console.error('Error checking auth status:', err);
            }
        }

        // Get auth URL for login button
        try {
            const response = await fetch('http://localhost:8080/api/auth/url');
            if (response.ok) {
                const data = await response.json();
                authUrl = data.url;
            } else {
                errorMessage = 'Backend service unavailable. Please try again later.';
            }
        } catch (err) {
            // Ignore 404 errors since backend might not be running
            if (err instanceof Error && !err.message.includes('404')) {
                console.error('Error fetching auth URL:', err);
            }
            errorMessage = 'Backend service unavailable. Please try again later.';
        }
    });

    function handleLogin() {
        window.location.href = authUrl;
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
