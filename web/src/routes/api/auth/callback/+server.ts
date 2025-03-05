import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { code } = await request.json();
    
    try {
        // Exchange code for tokens with backend
        const response = await fetch('http://localhost:8080/api/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        const { token } = await response.json();
        
        // Set auth token cookie
        cookies.set('auth_token', token, {
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
