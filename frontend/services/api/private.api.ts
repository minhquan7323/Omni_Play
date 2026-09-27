import { store } from '@/store';
import { setCredentials, logout } from '@/store/slices/auth.slice';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const privateApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

privateApi.interceptors.request.use((config) => {
    const accessToken = store.getState().auth.accessToken;

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

privateApi.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) {
            error.message = Array.isArray(serverMessage)
                ? serverMessage[0]
                : serverMessage;
        }

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return privateApi(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    `${BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true },
                );
                const refreshData = response.data?.data;
                const newAccessToken = refreshData?.accessToken;

                store.dispatch(setCredentials({
                    accessToken: newAccessToken,
                    roles: refreshData?.roles,
                    permissions: refreshData?.permissions,
                }));
                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return privateApi(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                store.dispatch(logout());
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default privateApi;

