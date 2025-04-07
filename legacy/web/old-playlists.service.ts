import type { Prisma } from '$db/index';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse } from '$youtube/types/types';
import type { YouTubeApiClient } from '$youtube/api/client';
import { paginate, processInBatches } from '$youtube/utils/pagination';
import { createPlaylist, updatePlaylist, getPlaylist, createVideo, updateVideo, getVideo } from '$youtube/data/playlists.crud';
import { PlaylistsRepository } from '$youtube/data/playlists.repository';
import { isMusicPlaylist, isVideoAvailable } from '$youtube/utils/helpers';
import type { PaginatedVideosResponse } from '$lib/server/youtube/data/data.types';

export class YouTubePlaylistService {
    private client: YouTubeApiClient;
    private tx: Prisma.TransactionClient;
    private repository: PlaylistsRepository;

    constructor(client: YouTubeApiClient, tx: Prisma.TransactionClient) {
        this.client = client;
        this.tx = tx;
        this.repository = new PlaylistsRepository(tx);
    }

    async syncUserPlaylists(userId: string, limit = 50) {
        try {
            const { items: playlists, nextPageToken } = await paginate<YouTubePlaylistResponse>(
                async (options) => {
                    const response = await this.client.getPlaylistsRaw(options.limit, options.pageToken);
                    if (!response.data.items) {
                        throw new Error('Invalid YouTube API response - missing items');
                    }
                    return {
                        items: response.data.items,
                        nextPageToken: response.data.nextPageToken,
                        pageInfo: response.data.pageInfo
                    };
                },
                limit
            );

            await processInBatches(
                playlists,
                async (batch) => this.processPlaylistBatch(batch, userId),
                {
                    batchSize: 10,
                    onProgress: (progress) => {
                        console.log(`Synced ${progress.current}/${progress.total} playlists`);
                    }
                }
            );

            return {
                syncedCount: playlists.length,
                nextPageToken
            };
        } catch (error) {
            console.error('Failed to sync playlists:', error);
            throw error;
        }
    }

    private async processPlaylistBatch(
        playlists: YouTubePlaylistResponse[],
        userId: string
    ) {
        return Promise.all(
            playlists.map(async (playlist) => {
                const existing = await getPlaylist(this.tx, playlist.id!);
                if (existing) {
                    return updatePlaylist(this.tx, playlist as YouTubePlaylistResponse);
                }
                return createPlaylist(this.tx, playlist as YouTubePlaylistResponse, userId);
            })
        );
    }

    async syncPlaylistVideos(playlistId: string, videos: YouTubePlaylistItemResponse[]) {
        try {
            await processInBatches(
                videos,
                async (batch) => this.processVideoBatch(batch, playlistId),
                {
                    batchSize: 20,
                    onProgress: (progress) => {
                        console.log(`Synced ${progress.current}/${progress.total} videos`);
                    }
                }
            );
        } catch (error) {
            console.error('Failed to sync videos:', error);
            throw error;
        }
    }

    private async processVideoBatch(
        videos: YouTubePlaylistItemResponse[],
        playlistId: string
    ) {
        return Promise.all(
            videos.map(async (video) => {
                const existing = await getVideo(this.tx, video.snippet!.resourceId!.videoId!);
                if (existing) {
                    return updateVideo(this.tx, video as YouTubePlaylistItemResponse);
                }
                return createVideo(this.tx, video as YouTubePlaylistItemResponse, playlistId);
            })
        );
    }
}
