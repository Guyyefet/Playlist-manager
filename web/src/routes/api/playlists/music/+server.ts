import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { getYouTubeService } from '$lib/server/youtube';
import {
  getPlaylistById,
  addVideoToPlaylist,
  updateVideoStatus
} from '$lib/server/data/playlists';

export const GET: RequestHandler = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const youtube = await getYouTubeService();
    
    // Fetch playlists from YouTube API
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50
    });

    // Filter and return only music playlists
    const musicPlaylists = response.data.items?.filter(item => 
      item.snippet?.title?.toLowerCase().includes('music')
    ).map(item => ({
      id: item.id,
      name: item.snippet?.title,
      description: item.snippet?.description,
      itemCount: item.contentDetails?.itemCount,
      thumbnail: item.snippet?.thumbnails?.default?.url
    })) || [];

    return json(musicPlaylists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { playlistId } = await request.json();
    const youtube = await getYouTubeService();
    
    // Get playlist details
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      return json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Fetch playlist items
    const response = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId,
      maxResults: 50
    });

    // Process videos
    const videos = response.data.items || [];
    for (const item of videos) {
      const video = item.snippet!;
      await addVideoToPlaylist(playlistId, {
        title: video.title!,
        videoId: video.resourceId!.videoId!,
        url: `https://www.youtube.com/watch?v=${video.resourceId!.videoId!}`
      });
    }

    return json({ success: true, count: videos.length });
  } catch (error) {
    console.error('Error processing playlist:', error);
    return json({ error: 'Failed to process playlist' }, { status: 500 });
  }
};
