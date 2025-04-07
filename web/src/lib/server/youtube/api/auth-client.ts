import { refreshToken } from '$auth/tokens';
import { getToken, saveToken } from '$auth/db'
import { createOAuthClient } from '$auth/oauth';
import type { Token } from '$auth/types';

/**
 * YouTube Auth Client - handles token management for YouTube API
 */
export class YouTubeAuthClient {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private async ensureValidToken(): Promise<Token> {
    let token = await getToken(this.userId);
    if (!token) {
      throw new Error(`No token found for user ${this.userId}`);
    }

    // Refresh token if needed (5 minute buffer)
    if (token.expiry_date < Date.now() + 300_000) {
      const client = await createOAuthClient();
      token = await refreshToken(client, token);
      await saveToken(this.userId, token);
    }

    return token;
  }

  async getAccessToken(): Promise<string> {
    const token = await this.ensureValidToken();
    return token.access_token;
  }
}
