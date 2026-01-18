import type { UserDto } from '$lib/api/dtos.gen';
import api from '../api';
import { RequestError } from '../api/errors';
import { ErrorCode } from '../api/responses';

const storageAccessTokenKey = 'neko-access-token';

export type AppStatus = 'loading' | 'logged-in' | 'login-required' | 'setup-required' | 'error';

export type AuthState =
    | {
          status: 'loading' | 'login-required' | 'setup-required' | 'error';
          me: null;
      }
    | {
          me: UserDto;
          accessToken: string;
          status: 'logged-in';
      };

export const authState: { data: AuthState } = $state({
    data: {
        me: null,
        accessToken: null,
        status: 'loading',
    },
});

export const login = async (accessToken: string | null) => {
    if (accessToken === null) {
        logout();
        return;
    }

    try {
        authState.data = {
            status: 'logged-in',
            accessToken,
            me: await api.users.getMe({ accessToken }),
        };
        localStorage.setItem(storageAccessTokenKey, accessToken);
    } catch (err: unknown) {
        if (err instanceof RequestError) {
            switch (err.code) {
                case ErrorCode.Unauthorized:
                    authState.data = { status: 'login-required', me: null };
                    break;

                case ErrorCode.SetupRequired:
                    authState.data = { status: 'setup-required', me: null };
                    break;

                default:
                    console.error('Authentication error:', err);
                    authState.data = { status: 'error', me: null };
                    break;
            }
        } else {
            console.error('Authentication error:', err);
            authState.data = { status: 'error', me: null };
        }
    }
};

export const logout = () => {
    localStorage.removeItem(storageAccessTokenKey);

    if (authState.data.status !== 'setup-required') {
        authState.data = { status: 'login-required', me: null };
    }
};

export const initAuth = async (accessToken?: string) => {
    if (accessToken !== undefined) {
        localStorage.setItem(storageAccessTokenKey, accessToken);
    }
    await login(accessToken ?? localStorage.getItem(storageAccessTokenKey));
};
