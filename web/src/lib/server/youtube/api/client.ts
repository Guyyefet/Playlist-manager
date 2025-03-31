import { google, youtube_v3 } from 'googleapis';
import type { GaxiosResponse } from 'googleapis-common';
import { getToken } from '$auth/db';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse, APIResponse, BatchOptions } from '$youtube/types';
import { mapPlaylistResponse, mapPlaylistItemResponse } from '$youtube/utils';
import { processInBatches, paginateYouTubePlaylists } from '$youtube/pagination';

export async function getYouTubeService(userId: string) {
  const token = await getToken(userId);
  if (!token) {
    throw new Error('No valid YouTube token');
  }

  const auth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  });

  auth.setCredentials(token);
  return google.youtube({ version: 'v3', auth });
}

export async function getPlaylists(
  youtube: youtube_v3.Youtube,
  userId: string,
  limit: number = 50,
  pageToken?: string
): Promise<APIResponse<YouTubePlaylistResponse[]>> {
  try {
    const result = await paginateYouTubePlaylists(youtube, userId, limit, pageToken);
    
    return {
      data: result.items.map(mapPlaylistResponse),
      pageInfo: result.pageInfo,
      nextPageToken: result.nextPageToken
    };
  } catch (error) {
    console.error('Error fetching YouTube playlists:', error);
    return {
      data: [],
      error: 'Failed to fetch YouTube playlists',
      pageInfo: {
        totalResults: 0,
        resultsPerPage: 0
      }
    };
  }
}

export async function getPlaylistItems(
  youtube: youtube_v3.Youtube,
  playlistId: string,
  options?: BatchOptions
): Promise<APIResponse<YouTubePlaylistItemResponse[]>> {
  try {
    const items = await processInBatches<string, YouTubePlaylistItemResponse>(
      [playlistId], // Start with just the playlist ID
      async ([playlistId]: string[]) => {
        const response = await youtube.playlistItems.list({
          part: ['snippet', 'contentDetails', 'status'],
          playlistId,
          maxResults: options?.batchSize || 50
        });
        return response.data.items?.map(mapPlaylistItemResponse) || [];
      },
      options
    );

    return {
      data: items,
      pageInfo: {
        totalResults: items.length,
        resultsPerPage: options?.batchSize || 50
      }
    };
  } catch (error) {
    console.error('Error fetching YouTube playlist items:', error);
    return {
      data: [],
      error: 'Failed to fetch YouTube playlist items',
      pageInfo: {
        totalResults: 0,
        resultsPerPage: 0
      }
    };
  }
}
