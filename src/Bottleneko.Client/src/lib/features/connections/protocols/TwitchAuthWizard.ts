import { TwitchScopeValues, type TwitchAuth, type TwitchScope } from '$lib/api/bottleneko.gen';
import * as yup from 'yup';
import { chatScopes, viewChannelInfoScopes, viewUserInfoScopes } from './TwitchConfigEditor';

export interface Props {
    show?: boolean;
    onsuccess: (auth: TwitchAuth) => void;
    onclose: () => void;
}

export const BOTTLENEKO_CLIENT_ID = 'd7nyymm5khoc85v7urm5unjikw9gy2';

export const schema = yup.object().shape({
    clientId: yup.string().default(''),
    scopes: yup
        .array()
        .of(yup.mixed<TwitchScope>().oneOf(TwitchScopeValues).required())
        .default([...chatScopes, ...viewUserInfoScopes, ...viewChannelInfoScopes]),
});

export type TwitchAuthConfig = yup.InferType<typeof schema>;

export interface TwitchVerification {
    device_code: string;
    expires_in: number;
    interval: number;
    user_code: string;
    verification_uri: string;
}

export interface TwitchAuthSuccess {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string;
}

export type TwitchAuthStage =
    | { id: 'start'; config?: TwitchAuthConfig }
    | { id: 'requesting-verification'; config: TwitchAuthConfig }
    | { id: 'ready-for-authorization'; config: TwitchAuthConfig; verification: TwitchVerification }
    | { id: 'loading-user-data'; config: TwitchAuthConfig }
    | { id: 'authorization-failed'; config: TwitchAuthConfig };
