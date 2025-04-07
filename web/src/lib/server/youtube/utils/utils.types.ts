export interface PaginatedResult<T> {
    items: T[];
    nextPageToken?: string;
    pageInfo?: {
        totalResults?: number;
        resultsPerPage?: number;
    };
}

export interface PaginationOptions {
    limit: number;
    pageToken?: string;
}

export interface PaginationFetcher<T> {
    (options: PaginationOptions): Promise<{
        items: T[];
        nextPageToken?: string;
        pageInfo?: {
            resultsPerPage?: number;
        };
    }>;
}

export interface BatchOptions {
    batchSize?: number;
    onProgress?: (progress: { current: number, total: number }) => void;
    maxRetries?: number;
}

export interface ProgressLogger {
    (processed: number, total: number): void;
}

export interface MapperConfig<T, U> {
    id: (item: T) => string;
    title: (item: T) => string;
    description: (item: T) => string;
    thumbnailUrl: (item: T) => string;
    channelId: (item: T) => string;
    channelTitle: (item: T) => string;
    itemCount?: (item: T) => number;
    privacyStatus?: (item: T) => 'public' | 'unlisted' | 'private';
    videoId?: (item: T) => string;
    position?: (item: T) => number;
    duration?: (item: T) => string;
}

export interface OffsetPaginationOptions {
    page: number;
    pageSize: number;
}

export interface OffsetPaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
