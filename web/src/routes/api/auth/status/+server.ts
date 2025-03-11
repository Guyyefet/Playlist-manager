import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { checkAuthStatus } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const status = await checkAuthStatus(locals);
    return json({ authenticated: status.authenticated, user: status.user });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return json({ authenticated: false }, { status: 500 });
  }
};
