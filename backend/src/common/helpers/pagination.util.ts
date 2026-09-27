export interface PaginatedResult<T> {
    items: T[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export class PaginationUtil {
    static paginate<T>(
        items: T[],
        totalItems: number,
        page: number = 1,
        limit: number = 10,
    ): PaginatedResult<T> {
        const totalPages = Math.ceil(totalItems / limit) || 1;

        return {
            items,
            meta: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    static getSkip(page: number = 1, limit: number = 10): number {
        return (page - 1) * limit;
    }
}
