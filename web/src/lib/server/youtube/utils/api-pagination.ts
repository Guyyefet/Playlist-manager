import type {
    PaginatedResult,
    PaginationOptions,
    PaginationFetcher,
    BatchOptions,
    ProgressLogger
} from '$lib/server/youtube/utils/utils.types';

/**
 * YouTube API pagination utilities
 */
export async function paginate<T>(
    fetcher: PaginationFetcher<T>,
    limit: number,
    pageToken?: string
): Promise<PaginatedResult<T>> {
    let allItems: T[] = [];
    let nextPageToken = pageToken;
    let totalProcessed = 0;
    let resultsPerPage = 50; // Default page size

    do {
        const response = await fetcher({
            limit: Math.min(limit - totalProcessed, 50),
            pageToken: nextPageToken
        });

        if (!response.items) {
            throw new Error('No items found in API response');
        }

        allItems = [...allItems, ...response.items];
        nextPageToken = response.nextPageToken;
        totalProcessed += response.items.length;
        resultsPerPage = response.pageInfo?.resultsPerPage || resultsPerPage;

    } while (nextPageToken && totalProcessed < limit);

    return {
        items: allItems,
        nextPageToken,
        pageInfo: {
            totalResults: allItems.length,
            resultsPerPage
        }
    };
}

/**
 * Process items in batches with retry logic
 */
export async function processInBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    options: BatchOptions = {}
): Promise<R[]> {
    const { batchSize = 50, maxRetries = 3 } = options;
    const results: R[] = [];
    
    if (!items?.length) {
        console.warn('processInBatches called with empty items array');
        return results;
    }

    console.log('Starting batch processing', {
        totalItems: items.length,
        batchSize,
        timestamp: new Date().toISOString()
    });

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        let retries = 0;
        let batchResults: R[] = [];
        let success = false;

        while (retries < maxRetries && !success) {
            try {
                console.log('Processing batch', {
                    batchNumber: Math.floor(i / batchSize) + 1,
                    batchStart: i,
                    batchEnd: Math.min(i + batchSize, items.length),
                    retryAttempt: retries + 1,
                    timestamp: new Date().toISOString()
                });

                batchResults = await processor(batch);
                success = true;
                
                console.log('Batch processed successfully', {
                    batchNumber: Math.floor(i / batchSize) + 1,
                    itemsProcessed: batchResults.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                retries++;
                console.error('Batch processing failed', {
                    batchNumber: Math.floor(i / batchSize) + 1,
                    error: error instanceof Error ? error.message : String(error),
                    retryAttempt: retries,
                    maxRetries,
                    timestamp: new Date().toISOString()
                });

                if (retries >= maxRetries) {
                    throw new Error(`Failed to process batch after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }

        results.push(...batchResults);
        
        if (options.onProgress) {
            options.onProgress({
                current: Math.min(i + batchSize, items.length),
                total: items.length
            });
        }
    }
    
    console.log('Batch processing completed', {
        totalProcessed: results.length,
        timestamp: new Date().toISOString()
    });

    return results;
}

/**
 * Create a progress logger function
 */
export function createProgressLogger(label: string): ProgressLogger {
    return (processed: number, total: number) => {
        console.log(`${label}: Processed ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
    };
}
