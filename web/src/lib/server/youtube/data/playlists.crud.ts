import type { Prisma } from '$db/index';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '../types';
import { isMusicPlaylist, isVideoAvailable } from '../utils';

export async function createPlaylist(
  tx: Prisma.TransactionClient,
  playlist: YouTubePlaylistResponse,
  userId: string
) {
  return tx.playlist.create({
    data: {
      youtubeId: playlist.id,
      name: playlist.snippet.title,
      description: playlist.snippet.description,
      isMusicPlaylist: isMusicPlaylist(playlist.snippet.title),
      itemCount: playlist.contentDetails.itemCount,
      thumbnailUrl: playlist.snippet.thumbnails.default.url,
      user: { connect: { id: userId } }
    }
  });
}

export async function updatePlaylist(
  tx: Prisma.TransactionClient,
  playlist: YouTubePlaylistResponse
) {
  return tx.playlist.update({
    where: { youtubeId: playlist.id },
    data: {
      name: playlist.snippet.title,
      description: playlist.snippet.description,
      isMusicPlaylist: isMusicPlaylist(playlist.snippet.title),
      itemCount: playlist.contentDetails.itemCount,
      thumbnailUrl: playlist.snippet.thumbnails.default.url,
      updatedAt: new Date()
    }
  });
}

export async function createVideo(
  tx: Prisma.TransactionClient,
  item: YouTubePlaylistItemResponse,
  playlistId: string
) {
  return tx.video.create({
    data: {
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
}

export async function updateVideo(
  tx: Prisma.TransactionClient,
  item: YouTubePlaylistItemResponse
) {
  return tx.video.update({
    where: { videoId: item.snippet.resourceId.videoId },
    data: {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.default.url,
      position: item.snippet.position,
      status: item.status.privacyStatus,
      availability: isVideoAvailable(item.status.privacyStatus),
      updatedAt: new Date()
    }
  });
}
