import type { YouTubeApiClient } from '$youtube/api/client';
import { PlaylistsRepository } from '$youtube/data/playlists.repository';
import { handleError } from '$youtube/utils/helpers';
import { mapPlaylistToServicePlaylist } from '$youtube/utils/data-mappers';
import { mapApiPlaylistToPlaylist, mapApiPlaylistItemToVideo } from '$youtube/utils/api-mappers';
import type { PlaylistServiceOptions, PlaylistWithVideos, PaginatedResponse } from './service.types';

export class PlaylistService {
  private client: YouTubeApiClient;
  private repository: PlaylistsRepository;

  constructor(client: YouTubeApiClient, repository: PlaylistsRepository) {
    this.client = client;
    this.repository = repository;
  }

  /**
   * Get all playlists for a user with their videos
   * First tries to get from DB, falls back to YouTube API if none found
   */
  async getPlaylists(
    userId: string, 
    options: PlaylistServiceOptions
  ): Promise<PaginatedResponse<PlaylistWithVideos>> {
    try {
      // Get playlists from DB
      const dbPlaylists = await this.repository.getUserPlaylistsWithVideos(userId, options.limit);
      
      // If we have playlists in the DB, return them
      if (dbPlaylists.length > 0) {
        // Map to service types using the mapper
        const mappedPlaylists = dbPlaylists.map(mapPlaylistToServicePlaylist);
        
        return {
          items: mappedPlaylists,
          total: mappedPlaylists.length
        };
      } 
      
      // If no playlists in DB, fetch from YouTube API
      const response = await this.client.getPlaylistsRaw(options.limit);
      
      if (!response.data.items || response.data.items.length === 0) {
        return { items: [], total: 0 };
      }
      
      // Save playlists to DB
      for (const playlist of response.data.items) {
        // Create playlist in DB using repository
        const playlistData = mapApiPlaylistToPlaylist(playlist, userId);
        await this.repository.createPlaylist(playlistData);
        
        // Get playlist items from YouTube API
        const playlistItemsResponse = await this.client.getPlaylistItemsRaw(playlist.id, 50);
        
        if (playlistItemsResponse.data.items && playlistItemsResponse.data.items.length > 0) {
          // Save playlist items to DB
          for (const item of playlistItemsResponse.data.items) {
            const videoData = mapApiPlaylistItemToVideo(item, playlist.id);
            await this.repository.createVideo(videoData);
          }
        }
      }
      
      // Get the saved playlists from DB to ensure consistent format
      const savedPlaylists = await this.repository.getUserPlaylistsWithVideos(userId, options.limit);
      
      // Map to service types using the mapper
      const mappedPlaylists = savedPlaylists.map(mapPlaylistToServicePlaylist);
      
      return {
        items: mappedPlaylists,
        total: mappedPlaylists.length
      };
    } catch (error) {
      throw handleError(error, 'Failed to get playlists');
    }
  }
}
