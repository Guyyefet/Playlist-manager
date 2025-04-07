import { BaseRepository } from './base.repository';
import type { Prisma } from '$db/index';
import { handleError } from '../utils/helpers';
import type { Playlist, PlaylistWithVideos, Video } from './data.types';

export class PlaylistsRepository extends BaseRepository<Playlist> {
  constructor(tx: Prisma.TransactionClient) {
    super(tx);
  }

  protected getModel() {
    return this.tx.playlist;
  }

  /**
   * Get all playlists for a specific user with their videos
   */
  async getUserPlaylistsWithVideos(userId: string, limit?: number): Promise<PlaylistWithVideos[]> {
    try {
      // First get the playlists
      const playlists = await this.tx.playlist.findMany({
        where: { userId },
        take: limit
      });

      // Then get videos for each playlist
      const playlistsWithVideos = await Promise.all(
        playlists.map(async (playlist) => {
          const videos = await this.tx.video.findMany({
            where: { playlistId: playlist.id },
            orderBy: { position: 'asc' }
          });
          return { ...playlist, videos };
        })
      );

      return playlistsWithVideos;
    } catch (error) {
      throw handleError(error, 'Failed to get user playlists with videos');
    }
  }

  /**
   * Create a playlist in the database
   */
  async createPlaylist(data: Prisma.PlaylistCreateInput): Promise<Playlist> {
    try {
      return await this.tx.playlist.create({
        data
      });
    } catch (error) {
      throw handleError(error, 'Failed to create playlist');
    }
  }

  /**
   * Create a video in the database
   */
  async createVideo(data: Prisma.VideoUncheckedCreateInput): Promise<Video> {
    try {
      return await this.tx.video.create({
        data
      });
    } catch (error) {
      throw handleError(error, 'Failed to create video');
    }
  }
}
