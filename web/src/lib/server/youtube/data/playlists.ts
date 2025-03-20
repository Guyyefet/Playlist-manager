import { prisma } from '../../db';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '../types';
import { isMusicPlaylist, isVideoAvailable } from '../utils'

export async function getPlaylistById(id: string) {
  return await prisma.playlist.findUnique({
    where: { id },
    include: { videos: true }
  });
}

export async function createPlaylist(data: {
  name: string;
  description?: string;
  userId: string;
}) {
  return await prisma.playlist.create({
    data: {
      name: data.name,
      description: data.description,
      user: { connect: { id: data.userId } }
    }
  });
}

export async function updatePlaylist(id: string, data: {
  name?: string;
  description?: string;
}) {
  return await prisma.playlist.update({
    where: { id },
    data
  });
}

export async function deletePlaylist(id: string) {
  return await prisma.playlist.delete({
    where: { id }
  });
}

export async function addVideoToPlaylist(playlistId: string, videoData: {
  title: string;
  videoId: string;
  url: string;
}) {
  return await prisma.video.create({
    data: {
      ...videoData,
      playlist: { connect: { id: playlistId } }
    }
  });
}

export async function updateVideoStatus(videoId: string, status: string) {
  return await prisma.video.update({
    where: { id: videoId },
    data: { status }
  });
}

export async function getVideosByStatus(status: string) {
  return await prisma.video.findMany({
    where: { status },
    include: { playlist: true }
  });
}

export async function storePlaylistsInDB(
  playlists: YouTubePlaylistResponse[],
  userId: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
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
    return await prisma.$transaction(async (tx) => {
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
