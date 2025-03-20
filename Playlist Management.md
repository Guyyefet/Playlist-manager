
3. Implement Video Availability Detection
We'll need a helper function to detect unavailable videos:

function isVideoUnavailable(video: YouTubePlaylistItemResponse): boolean {
  return !video.contentDetails.duration || 
         video.status.privacyStatus === 'private' ||
         video.status.privacyStatus === 'deleted';
}
4. Implement Music Playlist Detection
Music playlists should be detected with:

function isMusicPlaylist(playlist: YouTubePlaylistResponse): boolean {
  const title = playlist.snippet.title.toLowerCase();
  return title.startsWith('music:');
}
5. Create a Synchronization Manager
We should create a new file web/src/lib/server/youtube/sync/index.ts that provides a high-level API:

export async function syncAllUserPlaylists(userId: string) {
  // 1. Get YouTube service for user
  // 2. Fetch all playlists
  // 3. Save playlists to DB
  // 4. For each playlist, fetch and save its items
  // 5. Update sync status
}

Implement the helper functions for detection
Create the synchronization manager
Update API endpoints to use the new functionality
Ensure error handling and logging is robust