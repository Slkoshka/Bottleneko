import * as yup from 'yup';

export const TelegramConfigSchema = yup
    .object()
    .noUnknown()
    .shape({
        $type: yup.string().oneOf(['Telegram']).default('Telegram'),
        token: yup.string().default('').required('API token is required'),
        receiveEvents: yup.boolean().default(true),
        proxyId: yup.string().nullable().default(''),
    });

export const FormSchema = yup.object().shape({
    name: yup.string().default('').required('Name should not be empty'),
    config: TelegramConfigSchema.required(),
});
