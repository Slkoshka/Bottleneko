import { ReactNode, useCallback } from 'react';
import api from '../api';
import { ScriptDto, ScriptStatus } from '../api/dtos.gen';
import { EntityState, useEntityProvider } from '../../app/EntityProvider';
import { ScriptEntityConfig, ScriptsContext } from './context';

export class ScriptState extends EntityState<ScriptDto, Parameters<typeof api.scripts.update>[1]> {
    get info() {
        return {
            id: {
                name: 'ID',
                value: this.data.id,
            },
            name: {
                name: 'Name',
                value: this.data.name,
            },
            description: {
                name: 'Description',
                value: this.data.description === '' ? <em>(no description)</em> : this.data.description,
            },
        };
    }

    get canStart() {
        return !this.isLoading && (this.data.status === ScriptStatus.Stopped || this.data.status === ScriptStatus.Error);
    }

    get canRestart() {
        return !this.isLoading && (this.data.status !== ScriptStatus.Stopped && this.data.status !== ScriptStatus.Stopping && this.data.status !== ScriptStatus.Error);
    }

    get canStop() {
        return !this.isLoading && (this.data.status !== ScriptStatus.Stopped && this.data.status !== ScriptStatus.Stopping && this.data.status !== ScriptStatus.Error);
    }

    async setAutoStart(isEnabled: boolean) {
        await this.update({ autoStart: isEnabled });
    }

    async start() {
        await this.asyncOp(async () => {
            await api.scripts.start(this.data.id);
        }, 'starting', true);
    }

    async restart() {
        await this.asyncOp(async () => {
            await api.scripts.restart(this.data.id);
        }, 'restarting', true);
    }

    async stop() {
        await this.asyncOp(async () => {
            await api.scripts.stop(this.data.id);
        }, 'stopping', true);
    }
}

export default function ScriptsProvider({ children }: { children?: ReactNode | undefined }) {
    const factory = useCallback((entity: ScriptDto, updated: () => void) => new ScriptState(api.scripts, entity, updated), []);
    const { data } = useEntityProvider<ScriptEntityConfig>('script', api.scripts, factory);

    const add = useCallback(async (parameters: Parameters<typeof api.scripts.add>[0]) => {
        const result = await api.scripts.add(parameters);
        data.actions.added(result.result);
        return result;
    }, [data]);

    return (
        <ScriptsContext.Provider
            value={{
                ...data,
                actions: {
                    add,
                    ...data.actions,
                },
            }}
        >
            {children}
        </ScriptsContext.Provider>
    );
};
