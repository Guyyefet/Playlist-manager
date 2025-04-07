export interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  total?: number;
}

export interface PlaylistServiceOptions {
  limit: number;
  pageToken?: string;
}

export interface PlaylistWithVideos {
  id: string;
  userId: string;
  videos: Array<{
    id: string;
    playlistId: string;
    videoId?: string;
    available: boolean;
  }>;
}
