import type { PlaylistWithVideos } from '$youtube/service/service.types';

/**
 * Maps a video from data layer to service layer
 */
export function mapVideoToServiceVideo(video: any): {
  id: string;
  playlistId: string;
  videoId?: string;
  available: boolean;
} {
  return {
    id: video.id,
    playlistId: video.playlistId,
    videoId: video.videoId,
    available: video.availability
  };
}

/**
 * Maps a playlist from data layer to service layer
 */
export function mapPlaylistToServicePlaylist(playlist: any): PlaylistWithVideos {
  return {
    id: playlist.id,
    userId: playlist.userId,
    videos: playlist.videos?.map(mapVideoToServiceVideo) || []
  };
}
