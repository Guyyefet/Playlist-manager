<script lang="ts">
    import { onMount } from 'svelte';
    
    let errorMessage = '';
    
    onMount(async () => {
        console.log('Login callback page mounted');
        
        // Get code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        console.log('URL params:', window.location.search);
        console.log('Code:', code);
        console.log('Error:', error);
        
        if (error) {
            console.log('Authentication error:', error);
            errorMessage = 'Authentication failed. Please try again.';
            window.location.href = `/login?error=${error}`;
            return;
        }
        
        if (!code) {
            console.log('No code provided');
            errorMessage = 'No authorization code provided.';
            window.location.href = '/login';
            return;
        }
        
        console.log('Exchanging code for token');
        try {
            console.time('Token exchange');
            console.log('Sending POST request to /login/callback with code');
            
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
                
                console.log('Direct backend response status:', directResponse.status);
                
                if (directResponse.ok) {
                    console.log('Direct backend request successful');
                    console.timeEnd('Token exchange');
                    
                    console.log('Authentication successful, redirecting to home');
                    // Add a small delay to ensure the token is saved before redirecting
                    setTimeout(() => {
                        // Redirect to home page after successful auth
                        window.location.href = '/home';
                    }, 1000); // Increased delay to 1 second
                    return;
                } else {
                    console.log('Direct backend request failed, trying proxy...');
                }
            } catch (err) {
                console.error('Error with direct backend request:', err);
                console.log('Falling back to proxy...');
            }
            
            // Fall back to the proxy if direct request fails
            const response = await fetch('/login/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });
            
            console.log('Proxy response status:', response.status);
            console.timeEnd('Token exchange');
            
            if (response.ok) {
                console.log('Authentication successful, redirecting to home');
                // Add a small delay to ensure the token is saved before redirecting
                setTimeout(() => {
                    // Redirect to home page after successful auth
                    window.location.href = '/home';
                }, 1000); // Increased delay to 1 second
            } else {
                console.log('Authentication failed');
                errorMessage = 'Authentication failed. Please try again.';
                window.location.href = '/login';
            }
        } catch (err) {
            console.error('Error during authentication:', err);
            errorMessage = 'An error occurred during authentication.';
            window.location.href = '/login';
        }
    });
</script>

<div class="callback-container">
    <h1>Authentication in progress...</h1>
    {#if errorMessage}
        <div class="error">{errorMessage}</div>
        <a href="/login">Return to login</a>
    {/if}
</div>

<style>
    .callback-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }
    
    .error {
        color: red;
        margin: 1rem 0;
    }
</style>
