import * as yup from 'yup';
import { Protocol } from '../../api/dtos.gen';

export const DiscordConfigSchema = yup.object().shape({
    $type: yup.string().oneOf([Protocol.Discord]).default(Protocol.Discord),
    token: yup.string().default('').required('API token is required'),
    receiveEvents: yup.boolean().default(true),
    isPresenceIntentEnabled: yup.boolean().default(false),
    isServerMembersIntentEnabled: yup.boolean().default(false),
    isMessageContentIntentEnabled: yup.boolean().default(false),
    proxyId: yup.string().default(''),
});
