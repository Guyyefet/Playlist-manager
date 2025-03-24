import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { checkAuthStatus } from '$auth/tokens';

export const GET: RequestHandler = async ({ cookies, locals }) => {
  try {
    const status = await checkAuthStatus({ ...locals, cookies });
    return json({ authenticated: status.authenticated, user: status.user });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return json({ authenticated: false }, { status: 500 });
  }
};
