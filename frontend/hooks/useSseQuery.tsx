'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSSEEvent } from '@/contexts/SSEContext';

interface SseEventsConfig<T> {
    createEvent?: string;
    updateEvent?: string;
    deleteEvent?: string;
    idField?: keyof T;
}

interface UseSseQueryOptions<T, TResponse> {
    queryKey: string[];
    fetchFn: () => Promise<TResponse>;
    dataKey: keyof TResponse;
    sseEvents: SseEventsConfig<T>;
}

export function useSseQuery<T, TResponse = any>({
    queryKey,
    fetchFn,
    dataKey,
    sseEvents,
}: UseSseQueryOptions<T, TResponse>) {
    const queryClient = useQueryClient();
    const idField = sseEvents.idField || ('id' as keyof T);

    const queryInfo = useQuery({
        queryKey,
        queryFn: fetchFn,
    });

    const updateCache = (updater: (currentList: T[]) => T[]) => {
        queryClient.setQueryData<TResponse>(queryKey, (oldData) => {
            if (!oldData) {
                return {
                    success: true,
                    message: 'Success',
                    [dataKey]: updater([]),
                } as unknown as TResponse;
            }

            const currentList = (oldData[dataKey] as T[]) ?? [];
            return {
                ...oldData,
                [dataKey]: updater(currentList),
            };
        });
    };

    useSSEEvent<any>(sseEvents.createEvent || '', (payload) => {
        if (!sseEvents.createEvent) return;
        alert(payload.message);
        const newItem =
            payload[dataKey.toString().slice(0, -1)] || payload.data || payload;

        updateCache((currentList) => [newItem, ...currentList]);
    });

    useSSEEvent<any>(sseEvents.updateEvent || '', (payload) => {
        if (!sseEvents.updateEvent) return;

        const updatedItem =
            payload[dataKey.toString().slice(0, -1)] || payload.data || payload;

        updateCache((currentList) =>
            currentList.map((item) =>
                item[idField] === updatedItem[idField] ? updatedItem : item,
            ),
        );
    });

    useSSEEvent<any>(sseEvents.deleteEvent || '', (payload) => {
        if (!sseEvents.deleteEvent) return;

        const targetId = payload.id || payload;

        updateCache((currentList) =>
            currentList.filter((item) => item[idField] !== targetId),
        );
    });

    return {
        ...queryInfo,
        dataList: (queryInfo.data?.[dataKey] as T[]) ?? [],
    };
}
