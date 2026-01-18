import { type ProxyType, type ProxyDto, ProxyTypeValues } from '$lib/api/dtos.gen';
import * as yup from 'yup';
import type { ProxiesProvider } from './provider.svelte';

export interface Props {
    proxy: ProxyDto | null;
    show: boolean;
    onsuccess?: (proxy: InstanceType<typeof ProxiesProvider>['$update']) => Promise<void>;
    onclose?: () => void;
}

export const FormSchema = yup.object().shape({
    name: yup.string().label('Name').required(),
    type: yup.mixed<ProxyType>().oneOf(ProxyTypeValues).required(),
    hostname: yup.string().label('Hostname').required(),
    port: yup.number().label('Port').min(1).max(65535).required(),
    isAuthRequired: yup.boolean().required(),
    username: yup
        .string()
        .label('Username')
        .nullable()
        .when('isAuthRequired', {
            is: true,
            then: (schema) => schema.nonNullable(),
        }),
    password: yup
        .string()
        .label('Password')
        .nullable()
        .when(['isAuthRequired', 'type'], {
            is: (isAuthRequired: boolean, type: ProxyType) => isAuthRequired && type !== 'Socks4' && type !== 'Socks4a',
            then: (schema) => schema.nonNullable(),
        }),
});

export type ProxyEditorStage = { id: 'select-type'; type: ProxyType } | { id: 'edit'; proxy: ProxyDto; isNew: boolean };
