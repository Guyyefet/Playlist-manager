import type { RequestHandler } from '../$types';
import { json } from '@sveltejs/kit';
import { getYouTubeService, getPlaylists } from '$youtube/api/client';
import { withTransaction, handleDbError, executeInTransaction, createWhereClause } from '$db/utils'
import { hasAnyPlaylists } from '$youtube/data/utils'
import { mapPlaylistResponse, mapPlaylistItemResponse } from '$youtube/utils'
import {
  createPlaylist,
  createVideo,
  getPlaylist
} from '$youtube/data/playlists.crud';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const youtube = await getYouTubeService(user.id);
    
    return await withTransaction(async (tx) => {
      const dbPlaylists = await hasAnyPlaylists();
      
      if (!dbPlaylists) {
        const response = await youtube.playlists.list({
          part: ['snippet', 'contentDetails'],
          mine: true,
          maxResults: 50
        });

        for (const item of response.data.items || []) {
          if (!item.id || !item.snippet?.title) continue;
          await createPlaylist(tx, mapPlaylistResponse(item), user.id);
        }
      }

      const playlists = await getPlaylists(youtube);
      return json(playlists);
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { playlistId } = await request.json();
    if (typeof playlistId !== 'string') {
      return json({ error: 'Invalid playlist ID' }, { status: 400 });
    }

    const youtube = await getYouTubeService(user.id);
    let videosProcessed = 0;
    
    await withTransaction(async (tx) => {
      const playlist = await getPlaylist(tx, playlistId);
      if (!playlist) {
        return json({ error: 'Playlist not found' }, { status: 404 });
      }

      const response = await youtube.playlistItems.list({
        part: ['snippet', 'status'],
        playlistId,
        maxResults: 50
      });

      for (const item of response.data.items || []) {
        if (!item.snippet?.resourceId?.videoId || !item.snippet.title) continue;
        await createVideo(tx, mapPlaylistItemResponse(item), playlist.id);
        videosProcessed++;
      }
    });

    return json({ success: true, count: videosProcessed });
  } catch (error) {
    console.error('Error processing playlist:', error);
    return json({ error: 'Failed to process playlist' }, { status: 500 });
  }
};
