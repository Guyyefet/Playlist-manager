export interface YouTubePlaylistResponse {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
    channelId: string;
    channelTitle: string;
  };
  contentDetails: {
    itemCount: number;
  };
  status: {
    privacyStatus: 'public' | 'unlisted' | 'private';
  };
  items?: YouTubePlaylistItemResponse[];
}

export interface YouTubePlaylistItemResponse {
  id: string;
  snippet: {
    playlistId: string;
    resourceId: {
      videoId: string;
    };
    position: number;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
    channelId: string;
    channelTitle: string;
  };
  contentDetails: {
    duration: string;
  };
  status: {
    privacyStatus: 'public' | 'unlisted' | 'private';
  };
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  ERROR = 'ERROR'
}

export interface APIResponse<T> {
  data: T;
  error?: string;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
