import * as yup from 'yup';

export const DiscordConfigSchema = yup
    .object()
    .noUnknown()
    .shape({
        $type: yup.string().oneOf(['Discord']).default('Discord'),
        token: yup.string().default('').required('API token is required'),
        receiveEvents: yup.boolean().default(true),
        isPresenceIntentEnabled: yup.boolean().default(false),
        isServerMembersIntentEnabled: yup.boolean().default(false),
        isMessageContentIntentEnabled: yup.boolean().default(false),
        proxyId: yup.string().nullable().default(''),
    });

export const FormSchema = yup.object().shape({
    name: yup.string().default('').required('Name should not be empty'),
    config: DiscordConfigSchema.required(),
});
