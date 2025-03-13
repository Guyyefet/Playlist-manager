<script lang="ts">
    import { onMount } from 'svelte';

    let authUrl: string | null = null;
    let isLoading = true;
    let errorMessage = '';
    let isAuthenticated = false;

    onMount(async () => {
        console.log('Login page mounted');

        // Get auth URL from server
        try {
            const response = await fetch('/api/auth/url');
            if (!response.ok) {
                throw new Error('Failed to get auth URL');
            }
            
            const { url } = await response.json();
            if (!url || typeof url !== 'string') {
                throw new Error('Invalid auth URL received');
            }
            
            authUrl = url;
        } catch (err) {
            console.error('Error getting auth URL:', err);
            errorMessage = 'Failed to get authentication URL. Please try again later.';
        }

        // Check authentication status
        try {
            const response = await fetch('/api/auth/status');
            if (response.ok) {
                const { authenticated } = await response.json();
                if (authenticated) {
                    // User is already authenticated, redirect to home
                    isAuthenticated = true;
                    window.location.href = '/home';
                    return;
                }
            }
        } catch (err) {
            console.error('Error checking auth status:', err);
            errorMessage = 'Failed to check authentication status';
        }

        isLoading = false;
    });
    
    function handleLogin() {
        console.log('Login button clicked');
        
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
    
    {#if isLoading}
        <div class="loading">Loading...</div>
    {:else if errorMessage}
        <div class="error">{errorMessage}</div>
        <button on:click={() => window.location.reload()} class="login-button">
            Try Again
        </button>
    {:else}
        <button on:click={handleLogin} class="login-button">
            Login with Google
        </button>
    {/if}
</div>

<style>
    .loading {
        color: #666;
        margin-bottom: 1rem;
    }
    
    .error {
        color: #cc0000;
        margin-bottom: 1rem;
    }
    
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
