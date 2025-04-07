export interface YouTubeApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface YouTubePlaylistResponse {
  items: Array<{
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
  }>;
  nextPageToken?: string;
  pageInfo?: {
    totalResults?: number;
    resultsPerPage?: number;
  };
}

export interface YouTubePlaylistItemResponse {
  items: Array<{
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
  }>;
  nextPageToken?: string;
  pageInfo?: {
    totalResults?: number;
    resultsPerPage?: number;
  };
}
