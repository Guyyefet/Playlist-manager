import { YouTubeApiClient } from './api/client';
import { PlaylistsRepository } from './data/playlists.repository';
import { PlaylistService } from './service/playlists.service';
import { prismaClient } from '$lib/server/db';

// Initialize dependencies with default configurations
export const youtubeClient = new YouTubeApiClient(fetch);
export const playlistsRepo = new PlaylistsRepository(prismaClient);
export const youtubeService = new PlaylistService(youtubeClient, playlistsRepo);

// Re-export types for convenience
export type { YouTubeApiClient, PlaylistsRepository, PlaylistService };
