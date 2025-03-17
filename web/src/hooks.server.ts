import { redirect } from '@sveltejs/kit';
import { parseSessionCookie } from '$lib/server/auth/sessions';
import type { Handle } from '@sveltejs/kit';
import type { Token } from '$lib/types';

export const handle: Handle = async ({ event, resolve }) => {
  // Make cookies available in locals for auth functions
  event.locals.cookies = event.cookies;
  
  const token = parseSessionCookie(event.cookies);
  
  if (token) {
    event.locals.user = token;
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
