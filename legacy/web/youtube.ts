import { google } from 'googleapis';
import type { youtube_v3 } from 'googleapis';
import { getToken } from './auth';
import type { Token } from '../types';

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  thumbnailUrl: string;
  syncStatus: 'pending' | 'completed' | 'failed';
  lastSyncedAt: Date | null;
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
    let allPlaylists: YouTubePlaylist[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults: 50,
        pageToken
      });

      if (!response.data.items) {
        break;
      }

      const playlists = response.data.items.map((item: youtube_v3.Schema$Playlist) => ({
        id: item.id!,
        name: item.snippet?.title!,
        description: item.snippet?.description,
        itemCount: item.contentDetails?.itemCount,
        thumbnail: item.snippet?.thumbnails?.default?.url
      }));

      allPlaylists = allPlaylists.concat(playlists);
      pageToken = response.data.nextPageToken;

    } while (pageToken);

    return allPlaylists;
  } catch (error) {
    console.error('Error fetching YouTube playlists:', error);
    throw new Error('Failed to fetch YouTube playlists');
  }
}

export async function getPlaylistItems(youtube: youtube_v3.Youtube, playlistId: string): Promise<PlaylistItem[]> {
  try {
    let allItems: PlaylistItem[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response = await youtube.playlistItems.list({
        part: ['snippet', 'contentDetails', 'status'],
        playlistId,
        maxResults: 50,
        pageToken
      });

      if (!response.data.items) {
        break;
      }

      const items = response.data.items.map((item: youtube_v3.Schema$PlaylistItem) => ({
        id: item.id!,
        videoId: item.contentDetails?.videoId!,
        title: item.snippet?.title!,
        description: item.snippet?.description,
        thumbnail: item.snippet?.thumbnails?.default?.url,
        position: item.snippet?.position,
        status: item.status?.privacyStatus
      }));

      allItems = allItems.concat(items);
      pageToken = response.data.nextPageToken;

    } while (pageToken);

    return allItems;
  } catch (error) {
    console.error('Error fetching playlist items:', error);
    throw new Error('Failed to fetch playlist items');
  }
}

export async function storePlaylistsInDB(playlists: YouTubePlaylist[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const playlist of playlists) {
        await tx.playlist.upsert({
          where: { id: playlist.id },
          update: {
            name: playlist.name,
            description: playlist.description,
            itemCount: playlist.itemCount,
            thumbnail: playlist.thumbnail,
            updatedAt: new Date()
          },
          create: {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            itemCount: playlist.itemCount,
            thumbnail: playlist.thumbnail
          }
        });
      }
    });
  } catch (error) {
    console.error('Error storing playlists in database:', error);
    throw new Error('Failed to store playlists in database');
  }
}

export async function storePlaylistItemsInDB(playlistId: string, items: PlaylistItem[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.video.upsert({
          where: { videoId: item.videoId },
          update: {
            title: item.title,
            description: item.description,
            thumbnail: item.thumbnail,
            position: item.position,
            status: item.status,
            updatedAt: new Date()
          },
          create: {
            videoId: item.videoId,
            title: item.title,
            description: item.description,
            thumbnail: item.thumbnail,
            position: item.position,
            status: item.status,
            playlist: {
              connect: { id: playlistId }
            }
          }
        });
      }
    });
  } catch (error) {
    console.error('Error storing playlist items in database:', error);
    throw new Error('Failed to store playlist items in database');
  }
}
