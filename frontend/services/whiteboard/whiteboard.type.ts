export interface CreatePayload {
    name: string;
    isPrivate?: boolean;
    password?: string;
}

export interface UpdateBoardPayload {
    name: string;
    isPrivate?: boolean;
}

export interface AddMemberPayload {
    userId: string;
    role: string;
}