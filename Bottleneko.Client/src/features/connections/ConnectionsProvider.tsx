import { ReactNode, useCallback } from 'react';
import api from '../api';
import { ConnectionDto, ConnectionStatus } from '../api/dtos.gen';
import { EntityState, useEntityProvider } from '../../app/EntityProvider';
import { ConnectionEntityConfig, ConnectionsContext } from './context';

export class ConnectionState extends EntityState<ConnectionDto, Parameters<typeof api.connections.update>[1]> {
    get info() {
        return {
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
        };
    }

    get canStart() {
        return !this.isLoading && (this.data.extendedStatus.status === ConnectionStatus.NotConnected || this.data.extendedStatus.status === ConnectionStatus.Error || this.data.extendedStatus.status === ConnectionStatus.DelayedReconnect);
    }

    get canRestart() {
        return !this.isLoading && (this.data.extendedStatus.status !== ConnectionStatus.NotConnected && this.data.extendedStatus.status !== ConnectionStatus.Stopping && this.data.extendedStatus.status !== ConnectionStatus.Error && this.data.extendedStatus.status !== ConnectionStatus.DelayedReconnect);
    }

    get canStop() {
        return !this.isLoading && (this.data.extendedStatus.status !== ConnectionStatus.NotConnected && this.data.extendedStatus.status !== ConnectionStatus.Stopping && this.data.extendedStatus.status !== ConnectionStatus.Error);
    }

    async setAutoStart(isEnabled: boolean) {
        await this.update({ autoStart: isEnabled });
    }

    async start() {
        await this.asyncOp(async () => {
            await api.connections.start(this.data.id);
        }, 'starting', true);
    }

    async restart() {
        await this.asyncOp(async () => {
            await api.connections.restart(this.data.id);
        }, 'restarting', true);
    }

    async stop() {
        await this.asyncOp(async () => {
            await api.connections.stop(this.data.id);
        }, 'stopping', true);
    }
}

export default function ConnectionsProvider({ children }: { children?: ReactNode | undefined }) {
    const factory = useCallback((entity: ConnectionDto, updated: () => void) => new ConnectionState(api.connections, entity, updated), []);
    const { data } = useEntityProvider<ConnectionEntityConfig>('connection', api.connections, factory);

    const add = useCallback(async (parameters: Parameters<typeof api.connections.add>[0]) => {
        const result = await api.connections.add(parameters);
        data.actions.added(result.result);
        return result;
    }, [data]);

    return (
        <ConnectionsContext.Provider
            value={{
                ...data,
                actions: {
                    add,
                    ...data.actions,
                },
            }}
        >
            {children}
        </ConnectionsContext.Provider>
    );
};
