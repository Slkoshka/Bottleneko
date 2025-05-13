import * as yup from 'yup';
import { Connection } from '..';
import { Protocol } from '../../api/dtos.gen';

export const DiscordConfigSchema = yup.object().shape({
    $type: yup.string().default(Protocol.Discord),
    token: yup.string().default('').required('API token is required'),
    receiveEvents: yup.boolean().default(true),
    isPresenceIntentEnabled: yup.boolean().default(false),
    isServerMembersIntentEnabled: yup.boolean().default(false),
    isMessageContentIntentEnabled: yup.boolean().default(false),
});

export type Discord = Connection<Protocol.Discord, yup.InferType<typeof DiscordConfigSchema>>;
