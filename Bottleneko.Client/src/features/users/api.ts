import { request } from '../api/utils';
import { UserDto } from '../api/dtos.gen';

export interface ListUsersResponse {
    result: UserDto[];
}

export interface AddUserResponse {
    result: UserDto;
}

export interface UpdateUserResponse {
    result: UserDto;
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

    add: async (parameters: Partial<Omit<UserDto, 'id' | 'displayName'> & { password: string }>) => {
        return await request<AddUserResponse>('PUT', `users`, {
            body: parameters,
        });
    },

    update: async (id: string, parameters: Partial<Omit<UserDto, 'id' | 'displayName'> & { password: string }>) => {
        return await request<UpdateUserResponse>('PATCH', `users/${id}`, {
            body: parameters,
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `users/${id}`);
    },

    login: async (login: string, password: string) => {
        return await request<LoginResponse>('POST', `users/login`, {
            body: {
                login,
                password,
            },
        });
    },
};
