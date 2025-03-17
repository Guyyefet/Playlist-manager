import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/sessions';
import type { Handle } from '@sveltejs/kit';
import type { User, Token } from '$lib/types';

export const handle: Handle = async ({ event, resolve }) => {
  // Make cookies available in locals for auth functions
  event.locals.cookies = event.cookies;
  
  try {
    const user = await validateSession(event.cookies);
    
    if (user) {
      // Set basic user info
      event.locals.user = user;
      // Initialize empty token
      event.locals.token = null;
    } else {
      // Clear invalid session cookie
      event.cookies.delete('session', { path: '/' });
      event.locals.user = undefined;
      event.locals.token = null;
    }
  } catch (error) {
    console.error('Session parsing error:', error);
    // Clear invalid session cookie
    event.cookies.delete('session', { path: '/' });
  }

  // Protect routes that require authentication
  // Allow access to auth-related API endpoints without authentication
  if (event.url.pathname.startsWith('/api') && 
      !event.url.pathname.startsWith('/api/auth') && 
      !event.locals.user) {
    throw redirect(302, '/login');
  }

  return resolve(event);
};
