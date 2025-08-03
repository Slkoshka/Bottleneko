import { useCallback, useEffect, useState } from 'react';
import { ItemInfoProperty } from '../components/DeleteConfirmationDialog';
import { useFetchData } from './hooks';

export interface EntityConfig<Entity extends EntityData = EntityData, EntityUpdate extends object = object, State extends EntityState<Entity, EntityUpdate> = EntityState<Entity, EntityUpdate>> {
    Entity: Entity;
    EntityUpdate: EntityUpdate;
    State: State;
}

export interface EntityData {
    id: string;
}

export interface EntityApi<Entity extends EntityData, EntityUpdate extends object> {
    get(id: string, signal?: AbortSignal): Promise<Entity>;
    list(signal?: AbortSignal): Promise<{ result: Entity[] }>;
    update(id: string, data: EntityUpdate): Promise<{ result: Entity }>;
    delete(id: string): Promise<void>;
}

export abstract class EntityState<Entity extends EntityData, EntityUpdate extends object> {
    protected asyncOps = new Map<string, Promise<void>>();

    constructor(protected api: EntityApi<Entity, EntityUpdate>, public data: Entity, protected readonly updated: () => void) { this.stateUpdated(); }

    get isLoading() {
        return this.asyncOps.size !== 0;
    }

    protected stateUpdated() {
        this.updated();
    }

    abstract get info(): Record<string, ItemInfoProperty>;

    protected async asyncOp(callback: () => Promise<void>, operation: string, autoRefresh?: boolean) {
        const doAsyncOp = async () => {
            await callback();
            this.asyncOps.delete(operation);
            this.stateUpdated();
            if (autoRefresh) {
                await this.refresh();
            }
        };

        while (this.asyncOps.has(operation)) {
            await this.asyncOps.get(operation);
        }

        this.asyncOps.set(operation, doAsyncOp());
    }

    async refresh() {
        await this.asyncOp(async () => {
            this.data = await this.api.get(this.data.id);
        }, 'refreshing');
    }

    async update(updateData: EntityUpdate) {
        await this.asyncOp(async () => {
            this.data = (await this.api.update(this.data.id, updateData)).result;
        }, 'updating', true);
    }
}

export interface EntityContextData<Type extends EntityConfig> {
    name: string;

    state: {
        list: Type['State'][] | null;
    };

    actions: {
        added: (entity: Type['Entity']) => void;
        updated: (entity: Type['Entity']) => void;
        deleted: (id: string) => void;

        delete: (id: string) => Promise<void>;
    };
}

export function useEntityProvider<Type extends EntityConfig>(name: string, api: EntityApi<Type['Entity'], Type['EntityUpdate']>, factory: (entity: Type['Entity'], updated: () => void) => Type['State']): { data: EntityContextData<Type> } {
    const [list, setList] = useState<Type['State'][] | null>(null);

    const listUpdated = useCallback(() => {
        setList(current => current ? [...current] : null);
    }, []);

    const added = useCallback((entity: Type['Entity']) => {
        if (list !== null) {
            setList([...list, factory(entity, listUpdated)]);
        }
    }, [factory, list, listUpdated]);

    const updated = useCallback((entity: Type['Entity']) => {
        if (list !== null) {
            setList(list.map(e => e.data.id !== entity.id
                ? e
                : factory(entity, listUpdated),
            ));
        }
    }, [factory, list, listUpdated]);

    const deleted = useCallback((id: string) => {
        if (list !== null) {
            setList(list.filter(c => c.data.id !== id));
        }
    }, [list]);

    const deleteEntity = useCallback(async (id: string) => {
        await api.delete(id);
        deleted(id);
    }, [api, deleted]);

    const [remoteList] = useFetchData(useCallback(() => api.list(), [api]), true, 3000);

    useEffect(() => {
        if (remoteList) {
            setList(remoteList.result.map(entity => factory(entity, listUpdated)));
        }
    }, [factory, remoteList, listUpdated]);

    return {
        data: {
            name,
            state: {
                list,
            },
            actions: {
                added,
                updated,
                deleted,
                delete: deleteEntity,
            },
        },
    };
};
