import type { YouTubeApiResponse, YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '$youtube/api/api.types';
import * as auth from '$lib/server/auth';


/**
 * Pure YouTube API client - only handles HTTP communication
 * Returns raw API responses without transformation
 */
export class YouTubeApiClient {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private fetch: typeof fetch;

  constructor(
    fetchInstance: typeof fetch,
    private userId: string
  ) {
    this.fetch = fetchInstance;
  }

  private async getToken(): Promise<string> {
    // Get token from DB
    let token = await auth.getToken(this.userId);
    if (!token) {
      throw new Error(`No token found for user ${this.userId}. Please reauthenticate.`);
    }

    // Refresh if needed (5 minute buffer)
    if (token.expiry_date < Date.now() + 300_000) {
      const client = await auth.createOAuthClient();
      token = await auth.refreshToken(client, token);
      await auth.saveToken(this.userId, token);
    }

    return token.access_token;
  }

  /**
   * Get raw playlists response from YouTube API
   */
  async getPlaylistsRaw(
    limit: number = 50,
    pageToken?: string
  ): Promise<YouTubeApiResponse<YouTubePlaylistResponse>> {
    const url = new URL(`${this.baseUrl}/playlists`);
    url.searchParams.append('part', 'snippet,contentDetails');
    url.searchParams.append('mine', 'true');
    url.searchParams.append('maxResults', limit.toString());
    if (pageToken) {
      url.searchParams.append('pageToken', pageToken);
    }

    const headers = new Headers();
    const token = await this.getToken();
    headers.append('Authorization', `Bearer ${token}`);

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
    const url = new URL(`${this.baseUrl}/playlistItems`);
    url.searchParams.append('part', 'snippet,contentDetails,status');
    url.searchParams.append('playlistId', playlistId);
    url.searchParams.append('maxResults', limit.toString());
    if (pageToken) {
      url.searchParams.append('pageToken', pageToken);
    }

    const headers = new Headers();
    const token = await this.getToken();
    headers.append('Authorization', `Bearer ${token}`);

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
