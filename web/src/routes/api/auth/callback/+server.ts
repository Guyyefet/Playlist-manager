import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { exchangeCodeForToken, createOAuthClient } from '$lib/server/auth/oauth';
import { saveToken } from '$lib/server/auth/tokens';

// Handle GET request from Google OAuth redirect
export const GET: RequestHandler = async ({ url, cookies }) => {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
        console.error('OAuth error:', error);
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
        // Create OAuth client and exchange code for tokens
        const client = await createOAuthClient();
        const token = await exchangeCodeForToken(client, code);
        await saveToken(token);

        // Set auth token cookie
        cookies.set('auth_token', token.access_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return json({ success: true, token });
    } catch (error) {
        console.error('Auth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
};
