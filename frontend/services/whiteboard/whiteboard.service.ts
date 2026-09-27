import privateApi from '../api/private.api';
import { CreatePayload, UpdateBoardPayload, AddMemberPayload } from './whiteboard.type';

export const Whiteboard = {
    findAll: () => 
        privateApi.get('/whiteboards'),

    findOneById: (boardId: string) => 
        privateApi.get(`/whiteboards/${boardId}`),

    create: (data: CreatePayload) => 
        privateApi.post('/whiteboards', data),

    updateBoardInfo: (boardId: string, data: UpdateBoardPayload) => 
        privateApi.patch(`/whiteboards/${boardId}`, data),

    verifyPassword: (boardId: string, password: string) =>
        privateApi.post(`/whiteboards/${boardId}/verify-password`, { password }),

    addMember: (boardId: string, data: AddMemberPayload) =>
        privateApi.post(`/whiteboards/${boardId}/members`, data),

    updateMemberRole: (boardId: string, targetUserId: string, role: string) =>
        privateApi.patch(`/whiteboards/${boardId}/members/${targetUserId}`, { role }),

    banUser: (boardId: string, targetUserId: string) =>
        privateApi.post(`/whiteboards/${boardId}/ban/${targetUserId}`),

    removeMember: (boardId: string, targetUserId: string) =>
        privateApi.delete(`/whiteboards/${boardId}/members/${targetUserId}`),

    deleteBoard: (boardId: string) =>
        privateApi.delete(`/whiteboards/${boardId}`),

    uploadThumbnail: (boardId: string, formData: FormData) =>
        privateApi.patch(`/whiteboards/${boardId}/thumbnail`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};