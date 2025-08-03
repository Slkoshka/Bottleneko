import * as yup from 'yup';
import { Protocol } from '../../api/dtos.gen';

export const TelegramConfigSchema = yup.object().noUnknown().shape({
    $type: yup.string().oneOf([Protocol.Telegram]).default(Protocol.Telegram),
    token: yup.string().default('').required('API token is required'),
    receiveEvents: yup.boolean().default(true),
    proxyId: yup.string().default(''),
});
