import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const publicApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

publicApi.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const serverMessage = error.response?.data?.message;

        if (serverMessage) {
            error.message = Array.isArray(serverMessage)
                ? serverMessage[0]
                : serverMessage;
        }

        return Promise.reject(error);
    },
);

export default publicApi;
