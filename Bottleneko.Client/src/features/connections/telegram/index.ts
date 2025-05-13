import * as yup from 'yup';
import { Connection } from '..';
import { Protocol } from '../../api/dtos.gen';

export const TelegramConfigSchema = yup.object().noUnknown().shape({
    $type: yup.string().default(Protocol.Telegram),
    token: yup.string().default('').required('API token is required'),
    receiveEvents: yup.boolean().default(true),
});

export type Telegram = Connection<Protocol.Telegram, yup.InferType<typeof TelegramConfigSchema>>;
