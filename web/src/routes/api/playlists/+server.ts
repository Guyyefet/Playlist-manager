import type { RequestHandler } from './$types';
import { json, redirect } from '@sveltejs/kit';
import { youtubeService } from '$lib/server/youtube';

export const GET: RequestHandler = async ({ locals }) => {
  console.log('Playlist route - locals.user:', locals.user);
  if (!locals.user) {
    return json({
      error: 'Unauthorized',
      details: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      }
    }, { status: 401 });
  }
  console.log('Playlist route - using user ID:', locals.user.id);
  
  try {
    const result = await youtubeService.getPlaylists(locals.user.id, {
      limit: 50
    });

    return json({
      data: result.items,
      meta: { total: result.total }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('No token found for user')) {
      return json({
        error: 'Unauthorized',
        details: {
          code: 'UNAUTHORIZED',
          message: 'User token missing - please reauthenticate'
        }
      }, { status: 401 });
    }

    return json({
      error: 'Failed to fetch playlists',
      details: {
        code: 'PLAYLIST_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
};

// export const POST: RequestHandler = async ({ request, locals }) => {
//   const user = locals.user!; // Non-null assertion since auth layer ensures user exists
  
//   try {
//     const { playlistId } = await request.json();
//     if (typeof playlistId !== 'string' || !playlistId.trim()) {
//       return json({ 
//         error: 'Invalid playlist ID',
//         details: {
//           code: 'INVALID_PLAYLIST_ID',
//           message: 'Playlist ID must be a non-empty string'
//         }
//       }, { status: 400 });
//     }

//     const result = await youtubeService.processPlaylist(user.id, playlistId);

//     return json({
//       data: {
//         processed: result.processed,
//         total: result.total,
//         skipped: result.skipped
//       }
//     });
//   } catch (error) {
//     return json({
//       error: 'Failed to process playlist',
//       details: {
//         code: 'PLAYLIST_PROCESS_ERROR',
//         message: error instanceof Error ? error.message : 'Unknown error'
//       }
//     }, { status: 500 });
//   }
// };
