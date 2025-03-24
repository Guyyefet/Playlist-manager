import { google, youtube_v3 } from 'googleapis';
import { getToken } from '$auth/db';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse, APIResponse } from '../types';

export async function getYouTubeService(email: string) {
  const token = await getToken(email);
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

      // Map YouTube API response to our type
      const playlists: YouTubePlaylistResponse[] = response.data.items.map((item: youtube_v3.Schema$Playlist) => ({
        id: item.id!,
        snippet: {
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          thumbnails: {
            default: {
              url: item.snippet?.thumbnails?.default?.url || ''
            }
          },
          channelId: item.snippet?.channelId || '',
          channelTitle: item.snippet?.channelTitle || ''
        },
        contentDetails: {
          itemCount: item.contentDetails?.itemCount || 0
        },
        status: {
          privacyStatus: (item.status?.privacyStatus as 'public' | 'unlisted' | 'private') || 'private'
        }
      }));

      // Fetch items for each playlist
      for (const playlist of playlists) {
        const itemsResponse = await youtube.playlistItems.list({
          part: ['snippet', 'contentDetails', 'status'],
          playlistId: playlist.id,
          maxResults: 50
        });

        if (itemsResponse.data.items) {
          // Map YouTube API response to our type
          playlist.items = itemsResponse.data.items.map((item: youtube_v3.Schema$PlaylistItem) => ({
            id: item.id!,
            snippet: {
              playlistId: item.snippet?.playlistId || '',
              resourceId: {
                videoId: item.snippet?.resourceId?.videoId || ''
              },
              position: item.snippet?.position || 0,
              title: item.snippet?.title || '',
              description: item.snippet?.description || '',
              thumbnails: {
                default: {
                  url: item.snippet?.thumbnails?.default?.url || ''
                }
              },
              channelId: item.snippet?.channelId || '',
              channelTitle: item.snippet?.channelTitle || ''
            },
            contentDetails: {
              duration: item.contentDetails?.videoPublishedAt || ''
            },
            status: {
              privacyStatus: (item.status?.privacyStatus as 'public' | 'unlisted' | 'private') || 'private'
            }
          }));
        }
      }

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
