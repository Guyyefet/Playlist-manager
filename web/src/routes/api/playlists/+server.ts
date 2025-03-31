import type { RequestHandler } from './$types';
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

export const GET: RequestHandler = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) {
    return json({ 
      error: 'Unauthorized',
      details: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      }
    }, { status: 401 });
  }

  try {
    console.log('Fetching playlists for user:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    const youtube = await getYouTubeService(user.id);
    
    return await withTransaction(async (tx) => {
      try {
        const dbPlaylists = await hasAnyPlaylists();
        
        if (!dbPlaylists) {
          console.log('No playlists in DB, fetching from YouTube API');
        const limit = Number(url.searchParams.get('limit')) || 50;
        const pageToken = url.searchParams.get('pageToken') || undefined;
        
        let allPlaylists = [];
        let nextPageToken = pageToken;
        let totalCreated = 0;
        
        do {
          const response = await youtube.playlists.list({
            part: ['snippet', 'contentDetails'],
            mine: true,
            maxResults: Math.min(limit, 50),
            pageToken: nextPageToken
          });

          if (!response.data.items) {
            throw new Error('No playlists found in YouTube response');
          }

          console.log(`Found ${response.data.items.length} playlists from YouTube`);
          
          let createdCount = 0;
          for (const item of response.data.items) {
            if (!item.id || !item.snippet?.title) {
              console.warn('Skipping invalid playlist item:', {
                itemId: item.id,
                hasTitle: !!item.snippet?.title,
                timestamp: new Date().toISOString()
              });
              continue;
            }
            await createPlaylist(tx, mapPlaylistResponse(item), user.id);
            createdCount++;
            allPlaylists.push(item);
          }
          totalCreated += createdCount;
          nextPageToken = response.data.nextPageToken;
          
          console.log(`Created ${createdCount} playlists in database (total: ${totalCreated})`);
        } while (nextPageToken && totalCreated < limit);
          console.log(`Created ${createdCount} playlists in database`);
        }

        const playlistsResponse = await getPlaylists(youtube);
        console.log('Successfully fetched playlists:', {
          count: playlistsResponse.data.length,
          source: dbPlaylists ? 'database' : 'youtube',
          timestamp: new Date().toISOString()
        });
        
        return json({
          success: true,
          data: playlistsResponse.data,
          meta: {
            source: dbPlaylists ? 'database' : 'youtube',
            count: playlistsResponse.data.length,
            totalResults: playlistsResponse.pageInfo?.totalResults || 0,
            nextPageToken: playlistsResponse.nextPageToken,
            limit: Number(url.searchParams.get('limit')) || 50,
            debug: {
              fetchedFromYouTube: totalCreated,
              skipped: allPlaylists.length - totalCreated
            }
          }
        });
      } catch (innerError) {
        console.error('Playlist operation failed:', {
          error: innerError,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        throw innerError;
      }
    });
  } catch (error) {
    console.error('Playlist fetch failed:', {
      error,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    return json({
      error: 'Failed to fetch playlists',
      details: {
        code: 'PLAYLIST_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ 
      error: 'Unauthorized',
      details: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      }
    }, { status: 401 });
  }

  try {
    const { playlistId } = await request.json();
    if (typeof playlistId !== 'string' || !playlistId.trim()) {
      return json({ 
        error: 'Invalid playlist ID',
        details: {
          code: 'INVALID_PLAYLIST_ID',
          received: typeof playlistId,
          message: 'Playlist ID must be a non-empty string'
        }
      }, { status: 400 });
    }

    console.log('Processing playlist request:', {
      userId: user.id,
      playlistId,
      timestamp: new Date().toISOString()
    });

    const youtube = await getYouTubeService(user.id);
    let videosProcessed = 0;
    let totalVideos = 0;
    
    await withTransaction(async (tx) => {
      try {
        const playlist = await getPlaylist(tx, playlistId);
        if (!playlist) {
          return json({ 
            error: 'Playlist not found',
            details: {
              code: 'PLAYLIST_NOT_FOUND',
              playlistId
            }
          }, { status: 404 });
        }

        let nextPageToken;
        let allVideos = [];
        
        do {
          const response = await youtube.playlistItems.list({
            part: ['snippet', 'status'],
            playlistId,
            maxResults: 50,
            pageToken: nextPageToken
          });

          if (!response.data.items) {
            throw new Error('No videos found in playlist');
          }

          const batchVideos = response.data.items;
          totalVideos = response.data.pageInfo?.totalResults || batchVideos.length;
          allVideos = [...allVideos, ...batchVideos];
          
          console.log(`Found ${batchVideos.length} videos in playlist ${playlistId} (total: ${totalVideos})`);
          
          for (const [index, item] of batchVideos.entries()) {
            if (!item.snippet?.resourceId?.videoId || !item.snippet.title) {
              console.warn('Skipping invalid video item:', {
                position: index,
                hasVideoId: !!item.snippet?.resourceId?.videoId,
                hasTitle: !!item.snippet?.title,
                timestamp: new Date().toISOString()
              });
              continue;
            }
            
            try {
              await createVideo(tx, mapPlaylistItemResponse(item), playlist.id);
              videosProcessed++;
            } catch (videoError) {
              console.error('Failed to process video:', {
                videoId: item.snippet.resourceId.videoId,
                error: videoError,
                timestamp: new Date().toISOString()
              });
            }
            
            if (index % 10 === 0 || index === batchVideos.length - 1) {
              console.log(`Processed ${videosProcessed}/${totalVideos} videos`, {
                playlistId,
                progress: `${Math.round((videosProcessed / totalVideos) * 100)}%`,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);
        }
      } catch (innerError) {
        console.error('Playlist processing failed:', {
          error: innerError,
          userId: user.id,
          playlistId,
          timestamp: new Date().toISOString()
        });
        throw innerError;
      }
    });

    return json({ 
      success: true,
      data: {
        processed: videosProcessed,
        total: totalVideos,
        skipped: totalVideos - videosProcessed
      }
    });
  } catch (error) {
    console.error('Playlist processing failed:', {
      error,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    return json({
      error: 'Failed to process playlist',
      details: {
        code: 'PLAYLIST_PROCESS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
};
