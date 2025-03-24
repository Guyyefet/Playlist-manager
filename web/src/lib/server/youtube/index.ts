// Re-export the YouTube service function
export { getYouTubeService } from './api/client';

// Re-export utility functions
export { isMusicPlaylist, isVideoAvailable } from './utils';

// Re-export playlist functions
export { 
  getPlaylistById, 
  addVideoToPlaylist, 
  updateVideoStatus 
} from './data/playlists';

// Export types
export * from './types';
