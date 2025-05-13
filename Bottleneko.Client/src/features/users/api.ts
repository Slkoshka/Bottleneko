import { request } from '../api/utils';
import { UserDto } from '../api/dtos.gen';

export interface ListUsersResponse {
    users: UserDto[];
}

export interface AddUserResponse {
    user: UserDto;
}

export interface LoginResponse {
    accessToken: string;
}

export default {
    list: async (signal?: AbortSignal) => {
        return await request<ListUsersResponse>('GET', 'users', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<UserDto>('GET', `users/${id}`, { signal });
    },

    getMe: async (signal?: AbortSignal) => {
        return await request<UserDto>('GET', `users/me`, { signal });
    },

    add: async (username: string, password: string) => {
        return await request<AddUserResponse>('PUT', `users`, {
            body: {
                username,
                password,
            },
        });
    },

    update: async (id: string, username: string, password: string | null) => {
        await request<object>('PATCH', `users/${id}`, {
            body: {
                username,
                password,
            },
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `users/${id}`);
    },

    login: async (username: string, password: string) => {
        return await request<LoginResponse>('POST', `users/login`, {
            body: {
                username,
                password,
            },
        });
    },
};
