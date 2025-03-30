import { google, youtube_v3 } from 'googleapis';
import { getToken } from '$auth/db';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse, APIResponse } from '$youtube/types';
import { mapPlaylistResponse, mapPlaylistItemResponse } from '$youtube/utils';

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
  youtube: youtube_v3.Youtube
): Promise<APIResponse<YouTubePlaylistResponse[]>> {
  try {
    let allPlaylists: YouTubePlaylistResponse[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: any = await youtube.playlists.list({
        part: ['snippet', 'contentDetails', 'status'],
        mine: true,
        maxResults: 50,
        pageToken
      });

      if (!response.data.items) {
        break;
      }

      // Map YouTube API response to our type using utility function
      const playlists: YouTubePlaylistResponse[] = response.data.items.map(mapPlaylistResponse);

      allPlaylists = allPlaylists.concat(playlists);
      pageToken = response.data.nextPageToken;

    } while (pageToken);

    return {
      data: allPlaylists,
      pageInfo: {
        totalResults: allPlaylists.length,
        resultsPerPage: 50
      }
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
  playlistId: string
): Promise<APIResponse<YouTubePlaylistItemResponse[]>> {
  try {
    const itemsResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails', 'status'],
      playlistId,
      maxResults: 50
    });

    if (!itemsResponse.data.items) {
      return {
        data: [],
        pageInfo: {
          totalResults: 0,
          resultsPerPage: 0
        }
      };
    }

    // Map YouTube API response to our type using utility function
    const items: YouTubePlaylistItemResponse[] = itemsResponse.data.items.map(mapPlaylistItemResponse);

    return {
      data: items,
      pageInfo: {
        totalResults: items.length,
        resultsPerPage: 50
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
