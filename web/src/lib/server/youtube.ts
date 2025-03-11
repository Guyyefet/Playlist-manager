import { google } from 'googleapis';
import type { youtube_v3 } from 'googleapis';
import { getToken } from './auth';
import type { Token } from '../types';

export interface YouTubePlaylist {
  id: string;
  name: string;
  description?: string | null;
  itemCount?: number | null;
  thumbnail?: string | null;
}

export async function getYouTubeService() {
  const token = await getToken();
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

export async function getPlaylists(youtube: youtube_v3.Youtube): Promise<YouTubePlaylist[]> {
  try {
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50
    });

    if (!response.data.items) {
      return [];
    }

    return response.data.items.map((item: youtube_v3.Schema$Playlist) => ({
      id: item.id!,
      name: item.snippet?.title!,
      description: item.snippet?.description,
      itemCount: item.contentDetails?.itemCount,
      thumbnail: item.snippet?.thumbnails?.default?.url
    }));
  } catch (error) {
    console.error('Error fetching YouTube playlists:', error);
    throw new Error('Failed to fetch YouTube playlists');
  }
}
