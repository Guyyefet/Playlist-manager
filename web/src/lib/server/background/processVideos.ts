import { getVideosByStatus, updateVideoStatus } from '../data/playlists';
import { getYouTubeService } from '../youtube';

const PROCESSING_INTERVAL = 1000 * 60 * 5; // 5 minutes

export async function startVideoProcessing() {
  setInterval(async () => {
    try {
      const processingVideos = await getVideosByStatus('processing');
      const youtube = await getYouTubeService();

      for (const video of processingVideos) {
        try {
          // Check video status on YouTube
          const response = await youtube.videos.list({
            part: ['status'],
            id: [video.videoId]
          });

          const status = response.data.items?.[0]?.status?.uploadStatus;
          if (status && status !== 'processing') {
            await updateVideoStatus(video.id, status);
          }
        } catch (error) {
          console.error(`Error processing video ${video.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in video processing interval:', error);
    }
  }, PROCESSING_INTERVAL);
}
