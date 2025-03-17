import type { RequestHandler } from '@sveltejs/kit';

// Return 204 No Content for favicon.ico requests to prevent errors
export const GET: RequestHandler = () => {
  return new Response(null, { status: 204 });
};
