import { prismaClient, type Prisma } from '$db/index';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '../types';
import { isMusicPlaylist, isVideoAvailable } from '../utils';

export async function storePlaylistsInDB(
  playlists: YouTubePlaylistResponse[],
  userId: string
) {
  try {
    return await prismaClient.$transaction(async (tx: Prisma.TransactionClient) => {
      const storedPlaylists = [];
      
      for (const playlist of playlists) {
        const stored = await tx.playlist.upsert({
          where: { youtubeId: playlist.id },
          update: {
            name: playlist.snippet.title,
            description: playlist.snippet.description,
            isMusicPlaylist: isMusicPlaylist(playlist.snippet.title),
            itemCount: playlist.contentDetails.itemCount,
            thumbnailUrl: playlist.snippet.thumbnails.default.url,
            updatedAt: new Date()
          },
          create: {
            youtubeId: playlist.id,
            name: playlist.snippet.title,
            description: playlist.snippet.description,
            isMusicPlaylist: isMusicPlaylist(playlist.snippet.title),
            itemCount: playlist.contentDetails.itemCount,
            thumbnailUrl: playlist.snippet.thumbnails.default.url,
            user: { connect: { id: userId } }
          }
        });
        
        storedPlaylists.push(stored);
      }
      
      return storedPlaylists;
    });
  } catch (error) {
    console.error('Error storing playlists:', error);
    throw new Error('Failed to store playlists');
  }
}

export async function storePlaylistItemsInDB(
  playlistId: string,
  items: YouTubePlaylistItemResponse[]
) {
  try {
    return await prismaClient.$transaction(async (tx: Prisma.TransactionClient) => {
      const storedItems = [];
      
      for (const item of items) {
        const stored = await tx.video.upsert({
          where: { videoId: item.snippet.resourceId.videoId },
          update: {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails.default.url,
            position: item.snippet.position,
            status: item.status.privacyStatus,
            availability: isVideoAvailable(item.status.privacyStatus),
            updatedAt: new Date()
          },
          create: {
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails.default.url,
            position: item.snippet.position,
            status: item.status.privacyStatus,
            availability: isVideoAvailable(item.status.privacyStatus),
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            playlist: { connect: { id: playlistId } }
          }
        });
        
        storedItems.push(stored);
      }
      
      return storedItems;
    });
  } catch (error) {
    console.error('Error storing playlist items:', error);
    throw new Error('Failed to store playlist items');
  }
}
