import { type ConnectionDto, type ProtocolConfiguration } from '../../api/dtos.gen';
import api from '$lib/api';
import { EntityProvider, LocalEntity } from '$lib/provider.svelte';
import type { RequestProperties } from '$lib/api/utils';
import type { TestConnectionResponse } from '$lib/api/features/connections';

export const state = $state({
    provider: null as ConnectionsProvider | null,
});

export class LocalConnection extends LocalEntity<
    ConnectionDto,
    Parameters<typeof api.connections.add>[0],
    Parameters<typeof api.connections.update>[1]
> {
    override canStart = $derived(
        !this.isLoading &&
            (this.data.extendedStatus.status === 'NotConnected' ||
                this.data.extendedStatus.status === 'Error' ||
                this.data.extendedStatus.status === 'DelayedReconnect'),
    );
    override canRestart = $derived(
        !this.isLoading &&
            this.data.extendedStatus.status !== 'NotConnected' &&
            this.data.extendedStatus.status !== 'Stopping' &&
            this.data.extendedStatus.status !== 'Error' &&
            this.data.extendedStatus.status !== 'DelayedReconnect',
    );
    override canStop = $derived(
        !this.isLoading &&
            this.data.extendedStatus.status !== 'NotConnected' &&
            this.data.extendedStatus.status !== 'Stopping' &&
            this.data.extendedStatus.status !== 'Error',
    );
    override canDelete = true;
    info = $derived({
        id: {
            name: 'ID',
            value: this.data.id,
        },
        protocol: {
            name: 'Protocol',
            value: this.data.protocol,
        },
        name: {
            name: 'Name',
            value: this.data.name,
        },
    });

    constructor(connection: ConnectionDto) {
        super(api.connections, connection);
    }

    async setAutoStart(isEnabled: boolean) {
        await this.update({ autoStart: isEnabled });
    }

    override async start() {
        await this.asyncOp(
            async () => {
                await api.connections.start(this.data.id);
            },
            'starting',
            true,
        );
    }

    override async restart() {
        await this.asyncOp(
            async () => {
                await api.connections.restart(this.data.id);
            },
            'restarting',
            true,
        );
    }

    override async stop() {
        await this.asyncOp(
            async () => {
                await api.connections.stop(this.data.id);
            },
            'stopping',
            true,
        );
    }
}

export class ConnectionsProvider extends EntityProvider<
    ConnectionDto,
    Parameters<typeof api.connections.add>[0],
    Parameters<typeof api.connections.update>[1],
    LocalConnection
> {
    constructor() {
        super(api.connections, (connection) => new LocalConnection(connection));
    }

    async test(config: ProtocolConfiguration, props?: RequestProperties): Promise<TestConnectionResponse> {
        return await api.connections.test(config, props);
    }

    static factory() {
        state.provider = new ConnectionsProvider();

        return {
            destroy() {
                state.provider?.destroy();
                state.provider = null;
            },
        };
    }
}
