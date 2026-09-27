'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';

interface SSEContextValue {
    isConnected: boolean;
    subscribe: (eventType: string, handler: (data: any) => void) => () => void;
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
    id: number | null;
}

const SSEContext = createContext<SSEContextValue | null>(null);

interface SSEProviderProps {
    url: string;
    children: React.ReactNode;
}

export function SSEProvider({ url, children }: SSEProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] =
        useState<SSEContextValue['connectionState']>('connecting');
    const [clientId, setClientId] = useState<number | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    // Lưu trữ các handlers dạng Ref để tránh re-subscribe khi handler reference thay đổi
    const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(
        new Map(),
    );
    const eventListenersRef = useRef<Map<string, EventListener>>(new Map());

    // Hàm thêm EventListener thực tế vào EventSource
    const addEventListenerForType = useCallback((eventType: string) => {
        if (
            eventType === 'message' ||
            !eventSourceRef.current ||
            eventListenersRef.current.has(eventType)
        ) {
            return;
        }

        const eventHandler = ((event: MessageEvent) => {
            const handlers = handlersRef.current.get(eventType);
            if (handlers) {
                try {
                    const data = JSON.parse(event.data);
                    handlers.forEach((h) => h(data));
                } catch (err) {
                    console.error(
                        `Lỗi parse JSON cho event ${eventType}:`,
                        err,
                    );
                }
            }
        }) as EventListener;

        eventSourceRef.current.addEventListener(eventType, eventHandler);
        eventListenersRef.current.set(eventType, eventHandler);
    }, []);

    // CHỈ khởi tạo EventSource khi URL thay đổi (hạn chế tối đa việc reconnect)
    useEffect(() => {
        if (!url) return;

        console.log('🔌 Đang khởi tạo kết nối SSE tới:', url);
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setConnectionState('connected');
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            if (eventSource.readyState === EventSource.CLOSED) {
                setConnectionState('error');
            } else {
                setConnectionState('disconnected');
            }
        };

        // Lắng nghe sự kiện SYSTEM lấy Client ID
        const systemHandler = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data);
                const id = payload.id || payload.clientId;
                if (id) {
                    setClientId(Number(id));
                }
            } catch (err) {
                console.error('Lỗi lấy ID hệ thống:', err);
            }
        };
        eventSource.addEventListener('SYSTEM', systemHandler);

        // Lắng nghe message mặc định
        eventSource.onmessage = (event) => {
            const handlers = handlersRef.current.get('message');
            if (handlers) {
                try {
                    const data = JSON.parse(event.data);
                    handlers.forEach((handler) => handler(data));
                } catch (err) {
                    console.error('Lỗi parse message:', err);
                }
            }
        };

        // Đăng ký lại các event đang có sẵn trong registry nếu kết nối bị reset
        handlersRef.current.forEach((_, eventType) => {
            addEventListenerForType(eventType);
        });

        return () => {
            console.log('🔌 Đóng kết nối SSE');
            eventSource.removeEventListener('SYSTEM', systemHandler);
            eventListenersRef.current.forEach((listener, eventType) => {
                eventSource.removeEventListener(eventType, listener);
            });
            eventListenersRef.current.clear();
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [url]); // <--- CHỈ phụ thuộc vào url

    const subscribe = useCallback(
        (eventType: string, handler: (data: any) => void) => {
            if (!handlersRef.current.has(eventType)) {
                handlersRef.current.set(eventType, new Set());
            }

            handlersRef.current.get(eventType)!.add(handler);

            // Nếu EventSource đã sẵn sàng, đăng ký listener ngay lập tức
            if (eventSourceRef.current) {
                addEventListenerForType(eventType);
            }

            return () => {
                const handlers = handlersRef.current.get(eventType);
                if (handlers) {
                    handlers.delete(handler);
                    // Giữ lại eventListener trên EventSource để tránh register/unregister liên tục gây mất mát event
                }
            };
        },
        [addEventListenerForType],
    );

    const value: SSEContextValue = {
        isConnected,
        subscribe,
        connectionState,
        id: clientId,
    };

    return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
}

export function useSSEContext() {
    const context = useContext(SSEContext);
    if (!context) {
        throw new Error('useSSEContext must be used within an SSEProvider');
    }
    return context;
}

export function useSSEEvent<T>(eventType: string, handler: (data: T) => void) {
    const { subscribe } = useSSEContext();

    const savedHandler = useRef(handler);
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!eventType) return;

        const listener = (data: T) => savedHandler.current(data);
        return subscribe(eventType, listener);
    }, [eventType, subscribe]);
}
