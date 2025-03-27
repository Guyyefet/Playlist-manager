import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { exchangeCodeForToken, createOAuthClient } from '$auth/oauth';
import { createSession } from '$auth/sessions';
import { createUser, updateUserToken, getUser } from '$auth/db';
import type { Token, User } from '$auth/types';

// Helper function to find or create user from token
async function findOrCreateUser(token: Token): Promise<User> {
    try {
        console.log('Looking up user with email:', token.email);
        let user = await getUser({ email: token.email });
        
        if (!user) {
            console.log('Creating new user with email:', token.email);
            user = await createUser(token);
            if (!user) {
                throw new Error('Database error: Cannot read properties of undefined (reading \'user\')');
            }
        } else {
            console.log('Updating tokens for existing user:', user.id);
            user = await updateUserToken(user.id, token);
        }
        
        return user;
    } catch (error) {
        console.error('Error in findOrCreateUser:', {
            error: error instanceof Error ? error.message : String(error),
            token: {
                email: token.email,
                hasAccessToken: !!token.access_token,
                hasRefreshToken: !!token.refresh_token
            }
        });
        throw error;
    }
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
        
        console.log('Token exchange successful, email:', token.email);
        
        // Find or create user
        const user = await findOrCreateUser(token);
        
        if (!user) {
            console.error('User creation/update failed', { token });
            throw new Error('Database error: Failed to create or update user');
        }

        if (!user.id) {
            console.error('User missing ID after creation', { user });
            throw new Error('Database error: User missing ID');
        }
        
        console.log('User created/updated successfully:', user.id);
        
        // Create session
        await createSession(cookies, user, JSON.stringify(token));
        
        console.log('Session created, redirecting to home');
        throw redirect(303, '/home');
    } catch (error) {
        console.error('Callback processing error:', {
            error: error instanceof Error ? error.message : String(error),
            code: code ? 'present' : 'missing',
            stack: error instanceof Error ? error.stack : undefined
        });
        
        const errorMessage = error instanceof Error ? 
            error.message.includes('Failed to get user email') ? 'email_required' :
            error.message.includes('Database error') ? 'database_error' :
            'oauth_failed' : 'oauth_failed';
            
        return redirect(302, `/login?error=${errorMessage}`);
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
        
        // Create session
        await createSession(cookies, user, JSON.stringify(token));
        
        return json({ success: true });
    } catch (error) {
        console.error('Auth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
};
