import privateApi from '../api/private.api';
import publicApi from '../api/public.api';
import { LoginPayload, RegisterPayload } from './auth.type';

export const AuthService = {
    login: (data: LoginPayload) => publicApi.post('/auth/login', data),
    register: (data: RegisterPayload) => publicApi.post('/auth/register', data),
    logout: () => privateApi.post('/auth/logout'),
};
