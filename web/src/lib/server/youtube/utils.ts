import { youtube_v3 } from 'googleapis';
import type { YouTubePlaylistResponse, YouTubePlaylistItemResponse } from './types';

export function isMusicPlaylist(playlistName: string): boolean {
  return playlistName.toLowerCase().includes('music:');
}

export function isVideoAvailable(status: string): boolean {
  return status.toLowerCase() === 'public';
}

export function mapPlaylistResponse(item: youtube_v3.Schema$Playlist): YouTubePlaylistResponse {
  return {
    id: item.id!,
    snippet: {
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      thumbnails: {
        default: {
          url: item.snippet?.thumbnails?.default?.url || ''
        }
      },
      channelId: item.snippet?.channelId || '',
      channelTitle: item.snippet?.channelTitle || ''
    },
    contentDetails: {
      itemCount: item.contentDetails?.itemCount || 0
    },
    status: {
      privacyStatus: (item.status?.privacyStatus as 'public' | 'unlisted' | 'private') || 'private'
    }
  };
}

export function mapPlaylistItemResponse(item: youtube_v3.Schema$PlaylistItem): YouTubePlaylistItemResponse {
  return {
    id: item.id!,
    snippet: {
      playlistId: item.snippet?.playlistId || '',
      resourceId: {
        videoId: item.snippet?.resourceId?.videoId || ''
      },
      position: item.snippet?.position || 0,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      thumbnails: {
        default: {
          url: item.snippet?.thumbnails?.default?.url || ''
        }
      },
      channelId: item.snippet?.channelId || '',
      channelTitle: item.snippet?.channelTitle || ''
    },
    contentDetails: {
      duration: item.contentDetails?.videoPublishedAt || ''
    },
    status: {
      privacyStatus: (item.status?.privacyStatus as 'public' | 'unlisted' | 'private') || 'private'
    }
  };
}