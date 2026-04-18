export interface ApiEnvelope<T> {
    success: boolean;
    data?: T;
    errors?: string[];
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
}

export interface PaginatedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    hasMore: boolean;
}
