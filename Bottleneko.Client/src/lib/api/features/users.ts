import { request, type MutationRequestProperties, type RequestProperties } from '../utils';
import type { UserDto } from '../dtos.gen';

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
    list: async (props?: RequestProperties) => {
        return await request<ListUsersResponse>('GET', 'users', props);
    },

    get: async (id: string, props?: RequestProperties) => {
        return await request<UserDto>('GET', `users/${id}`, props);
    },

    getMe: async (props?: RequestProperties) => {
        return await request<UserDto>('GET', `users/me`, props);
    },

    add: async (
        parameters: Partial<Omit<UserDto, 'id' | 'displayName'> & { password: string }>,
        props?: MutationRequestProperties,
    ) => {
        return await request<AddUserResponse>('PUT', `users`, {
            body: parameters,
            ...props,
        });
    },

    update: async (
        id: string,
        parameters: Partial<Omit<UserDto, 'id' | 'displayName'> & { password: string }>,
        props?: MutationRequestProperties,
    ) => {
        return await request<UpdateUserResponse>('PATCH', `users/${id}`, {
            body: parameters,
            ...props,
        });
    },

    delete: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('DELETE', `users/${id}`, props);
    },

    login: async (login: string, password: string, props?: RequestProperties) => {
        return await request<LoginResponse>('POST', `users/login`, {
            body: {
                login,
                password,
            },
            ...props,
        });
    },
};
