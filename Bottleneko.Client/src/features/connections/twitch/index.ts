import * as yup from 'yup';
import { Connection } from '..';
import { Protocol, TwitchScope, TwitchSubscriptionTopic } from '../../api/dtos.gen';

export const TwitchAuthSchema = yup.object().shape({
    clientId: yup.string().default('').required('Client ID is required'),
    me: yup.string().default('').required(),
    accessToken: yup.string().default(''),
    refreshToken: yup.string().default(''),
    scopes: yup.array().of(yup.mixed<TwitchScope>().oneOf(Object.values(TwitchScope)).required()).default([]),
});

export const TwitchProtocolChannelSchema = yup.object().shape({
    name: yup.string().default('').required('Channel name is required'),
    eventSubscriptions: yup.array().of(yup.mixed<TwitchSubscriptionTopic>().oneOf(Object.values(TwitchSubscriptionTopic)).required()).default([TwitchSubscriptionTopic.ChannelChatMessage]).required(),
});

export const TwitchConfigSchema = yup.object().noUnknown().shape({
    $type: yup.string().default(Protocol.Twitch),
    receiveEvents: yup.boolean().default(true),
    channels: yup.array().of(TwitchProtocolChannelSchema).max(100).default([]).required(),
    auth: TwitchAuthSchema.required(),
});

export type TwitchAuth = yup.InferType<typeof TwitchAuthSchema>;
export type Twitch = Connection<Protocol.Twitch, yup.InferType<typeof TwitchConfigSchema>>;
