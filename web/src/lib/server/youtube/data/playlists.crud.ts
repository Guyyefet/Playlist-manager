import type { Prisma } from '$db/index';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '$youtube/types';
import { isMusicPlaylist, isVideoAvailable } from '$youtube/utils';

export async function createPlaylist(
  tx: Prisma.TransactionClient,
  playlist: YouTubePlaylistResponse,
  userId: string
) {
  try {
    if (!playlist.id || !playlist.snippet?.title) {
      throw new Error('Invalid playlist data');
    }

    const result = await tx.playlist.create({
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

    console.log('Created playlist:', {
      playlistId: result.id,
      youtubeId: result.youtubeId,
      userId,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('Failed to create playlist:', {
      error,
      youtubeId: playlist?.id,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
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
  try {
    if (!item.snippet?.resourceId?.videoId || !item.snippet.title) {
      throw new Error('Invalid video data');
    }

    const result = await tx.video.create({
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

    console.log('Created video:', {
      videoId: result.videoId,
      playlistId,
      position: result.position,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('Failed to create video:', {
      error,
      videoId: item.snippet?.resourceId?.videoId,
      playlistId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
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

export async function getPlaylist(
  tx: Prisma.TransactionClient,
  youtubeId: string
) {
  try {
    if (!youtubeId) {
      throw new Error('Missing youtubeId');
    }

    const playlist = await tx.playlist.findUnique({
      where: { youtubeId }
    });

    if (!playlist) {
      console.warn('Playlist not found:', {
        youtubeId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('Retrieved playlist:', {
        playlistId: playlist.id,
        youtubeId,
        timestamp: new Date().toISOString()
      });
    }

    return playlist;
  } catch (error) {
    console.error('Failed to get playlist:', {
      error,
      youtubeId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function deletePlaylist(
  tx: Prisma.TransactionClient,
  youtubeId: string
) {
  return tx.playlist.delete({
    where: { youtubeId }
  });
}

export async function getVideo(
  tx: Prisma.TransactionClient,
  videoId: string
) {
  try {
    if (!videoId) {
      throw new Error('Missing videoId');
    }

    const video = await tx.video.findUnique({
      where: { videoId }
    });

    if (!video) {
      console.warn('Video not found:', {
        videoId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('Retrieved video:', {
        videoId,
        playlistId: video.playlistId,
        timestamp: new Date().toISOString()
      });
    }

    return video;
  } catch (error) {
    console.error('Failed to get video:', {
      error,
      videoId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function deleteVideo(
  tx: Prisma.TransactionClient,
  videoId: string
) {
  return tx.video.delete({
    where: { videoId }
  });
}
