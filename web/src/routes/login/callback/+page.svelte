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
            return;
        }
        
        if (!code) {
            console.log('No code provided');
            errorMessage = 'No authorization code provided.';
            return;
        }
        
        console.log('Exchanging code for token');
        try {
            const response = await fetch('http://localhost:8080/api/auth/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                console.log('Authentication successful, redirecting to home');
                // Redirect to home page after successful auth
                window.location.href = '/home';
            } else {
                console.log('Authentication failed');
                errorMessage = 'Authentication failed. Please try again.';
            }
        } catch (err) {
            console.error('Error during authentication:', err);
            errorMessage = 'An error occurred during authentication.';
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
