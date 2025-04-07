import type { OffsetPaginationOptions, OffsetPaginatedResult } from './utils.types';

/**
 * Database pagination utilities
 */

export function calculatePagination(options: OffsetPaginationOptions) {
    return {
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize
    };
}

export async function paginateWithCount<T>(
    queryFn: (skip: number, take: number) => Promise<T[]>,
    countFn: () => Promise<number>,
    options: OffsetPaginationOptions
): Promise<OffsetPaginatedResult<T>> {
    const { skip, take } = calculatePagination(options);
    
    const [items, total] = await Promise.all([
        queryFn(skip, take),
        countFn()
    ]);

    return {
        items,
        total,
        page: options.page,
        pageSize: options.pageSize,
        hasMore: skip + take < total
    };
}

export function createPaginatedResult<T>(
    items: T[],
    total: number,
    options: OffsetPaginationOptions
): OffsetPaginatedResult<T> {
    return {
        items,
        total,
        page: options.page,
        pageSize: options.pageSize,
        hasMore: (options.page - 1) * options.pageSize + items.length < total
    };
}
