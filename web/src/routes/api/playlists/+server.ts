import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
    const token = cookies.get('auth_token');
    
    if (!token) {
        return json({ authenticated: false }, { status: 401 });
    }

    // Validate token with backend
    try {
        const response = await fetch('http://localhost:8080/api/auth/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return json({ authenticated: false }, { status: 401 });
        }

        return json({ authenticated: true });
    } catch (error) {
        console.error('Token validation error:', error);
        return json({ authenticated: false }, { status: 500 });
    }
};
