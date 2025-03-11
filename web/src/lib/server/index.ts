export { 
  createUser,
  getUserByEmail,
  updateUserToken,
  getUserPlaylists,
  getVideosByStatus,
  updateVideoStatus,
  prisma
} from './db';

export * from './auth';
export * from './youtube';
export * from './data/playlists';
export { startVideoProcessing } from './background/processVideos';

import { startVideoProcessing } from './background/processVideos';

// Initialize background processing
startVideoProcessing().catch((error) => {
  console.error('Failed to start video processing:', error);
});
