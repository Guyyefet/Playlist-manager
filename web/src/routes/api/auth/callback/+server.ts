import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// Handle GET request from Google OAuth redirect
export const GET: RequestHandler = async ({ url, cookies }) => {
    console.log('Received callback GET request with URL:', url.toString());
    
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    console.log('Code:', code);
    console.log('Error:', error);
    
    if (error) {
        console.log('Redirecting to login with error');
        // Redirect to login page with error
        return redirect(302, `/login?error=${error}`);
    }
    
    if (!code) {
        console.log('No code provided');
        return json({ success: false, error: 'No authorization code provided' }, { status: 400 });
    }
    
    console.log('Redirecting to login with code');
    // Redirect to login page with the code
    // The login page will handle exchanging the code for tokens
    return redirect(302, `/login?code=${code}`);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { code } = await request.json();
    
    try {
        // Exchange code for tokens with backend
        const response = await fetch('http://localhost:8080/api/auth/callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        // Set auth token cookie
        cookies.set('auth_token', 'authenticated', {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return json({ success: true });
    } catch (error) {
        console.error('Auth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
};
