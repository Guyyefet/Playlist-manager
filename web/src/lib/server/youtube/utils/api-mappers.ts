import { isVideoAvailable } from '$youtube/utils/helpers';

/**
 * Maps a YouTube API playlist item to a database video object
 */
export function mapApiPlaylistItemToVideo(item: any, playlistId: string): any {
  return {
    id: item.id,
    playlistId: playlistId,
    videoId: item.snippet.resourceId.videoId,
    position: item.snippet.position,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.default.url,
    url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    availability: isVideoAvailable(item.status.privacyStatus)
  };
}

/**
 * Maps a YouTube API playlist to a database playlist object
 */
export function mapApiPlaylistToPlaylist(playlist: any, userId: string): any {
  return {
    id: playlist.id,
    user: { connect: { id: userId } },
    name: playlist.snippet.title,
    description: playlist.snippet.description,
    thumbnailUrl: playlist.snippet.thumbnails.default.url,
    itemCount: playlist.contentDetails.itemCount
  };
}
