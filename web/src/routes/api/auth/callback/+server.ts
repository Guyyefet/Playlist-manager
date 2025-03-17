import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { exchangeCodeForToken, createOAuthClient } from '$lib/server/auth/oauth';
import { saveToken } from '$lib/server/auth/tokens';
import { createSession } from '$lib/server/auth/sessions';
import { prisma } from '$lib/server/db';
import type { Token, User } from '$lib/types';

// Helper function to find or create user from token
async function findOrCreateUser(token: Token): Promise<User> {
    let user = await prisma.user.findUnique({
        where: { email: token.email }
    });
    
    if (!user) {
        // Create new user
        user = await prisma.user.create({
            data: {
                email: token.email,
                accessToken: token.access_token,
                refreshToken: token.refresh_token || '',
                tokenExpiry: new Date(token.expiry_date)
            }
        });
    } else {
        // Update existing user's tokens
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                accessToken: token.access_token,
                refreshToken: token.refresh_token || '',
                tokenExpiry: new Date(token.expiry_date)
            }
        });
    }
    
    // Return the user directly - no need for conversion
    return user;
}

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
    
    try {
        // Exchange code for tokens directly in the callback
        const client = await createOAuthClient();
        const token = await exchangeCodeForToken(client, code);
        
        // Find or create user
        const user = await findOrCreateUser(token);
        
        // Save OAuth token
        await saveToken(user.id, token);
        
        // Create session
        await createSession(cookies, user, JSON.stringify(token));
        
        throw redirect(303, '/home');
    } catch (error) {
        console.error('Callback processing error:', error);
        return redirect(302, `/login?error=oauth_failed`);
    }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { code } = await request.json();
    
    try {
        // Create OAuth client and exchange code for tokens
        const client = await createOAuthClient();
        const token = await exchangeCodeForToken(client, code);
        
        // Find or create user
        const user = await findOrCreateUser(token);
        
        // Save OAuth token
        await saveToken(user.id, token);

        return json({ success: true });
    } catch (error) {
        console.error('Auth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
};
