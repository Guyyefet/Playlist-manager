import type { YouTubeApiResponse, YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '$youtube/api/api.types';
import { YouTubeAuthClient } from './auth-client';


/**
 * YouTube API client with built-in token management
 * Returns raw API responses without transformation
 */
export class YouTubeApiClient {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private fetch: typeof fetch;
  private authClient: YouTubeAuthClient;

  constructor(fetchInstance: typeof fetch) {
    this.fetch = fetchInstance;
    this.authClient = new YouTubeAuthClient('');
  }

  setCurrentUser(userId: string) {
    this.authClient.setUserId(userId);
  }

  /**
   * Get raw playlists response from YouTube API
   */
  async getPlaylistsRaw(
    limit: number = 50,
    pageToken?: string
  ): Promise<YouTubeApiResponse<YouTubePlaylistResponse>> {
    const accessToken = await this.authClient.getAccessToken();
    const url = new URL(`${this.baseUrl}/playlists`);
    url.searchParams.append('part', 'snippet,contentDetails');
    url.searchParams.append('mine', 'true');
    url.searchParams.append('maxResults', limit.toString());
    if (pageToken) {
      url.searchParams.append('pageToken', pageToken);
    }

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${accessToken}`);

    const response = await this.fetch(url.toString(), {
      headers
    });
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText
    };
  }

  /**
   * Get raw playlist items response from YouTube API
   */
  async getPlaylistItemsRaw(
    playlistId: string,
    limit: number = 50,
    pageToken?: string
  ): Promise<YouTubeApiResponse<YouTubePlaylistItemResponse>> {
    const accessToken = await this.authClient.getAccessToken();
    const url = new URL(`${this.baseUrl}/playlistItems`);
    url.searchParams.append('part', 'snippet,contentDetails,status');
    url.searchParams.append('playlistId', playlistId);
    url.searchParams.append('maxResults', limit.toString());
    if (pageToken) {
      url.searchParams.append('pageToken', pageToken);
    }

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${accessToken}`);

    const response = await this.fetch(url.toString(), {
      headers
    });
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText
    };
  }
}
