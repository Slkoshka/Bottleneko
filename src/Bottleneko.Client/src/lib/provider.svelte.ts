import { RequestError } from '$lib/api/errors';
import type { MutationRequestProperties, RequestProperties } from '$lib/api/utils';
import { SvelteDate, SvelteMap } from 'svelte/reactivity';
import { authState } from './features/auth.svelte';

export interface RemoteDataProps<T> {
    keepStale?: boolean;
    autoRefresh?: number | null;
    onDataUpdated?: (data: T | null) => void;
}

export class RemoteData<T> {
    private props: Required<RemoteDataProps<T>>;
    private abortController: AbortController | null = null;
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;
    private refreshInProgress = false;

    data: T | null = $state.raw(null);
    isLoading: boolean = $state(true);
    notFound: boolean = $state(false);
    lastRefresh: SvelteDate = new SvelteDate();
    destroyed = $state(false);

    constructor(
        public fetch: (props: RequestProperties) => Promise<T>,
        props: RemoteDataProps<T>,
    ) {
        this.props = {
            keepStale: false,
            autoRefresh: null,
            onDataUpdated: () => {},
            ...props,
        };

        void this.refresh();
    }

    private setData(data: T | null) {
        this.data = data;
        this.lastRefresh.setTime(SvelteDate.now());
        this.props.onDataUpdated(data);
    }

    private async loadData(signal: AbortSignal): Promise<void> {
        try {
            this.setData(await this.fetch({ signal }));
            this.notFound = false;
        } catch (err: unknown) {
            if (err instanceof RequestError && err.code === 'NotFound') {
                this.notFound = true;
                this.setData(null);
            } else {
                throw err;
            }
        } finally {
            this.isLoading = false;
        }
    }

    async refresh(): Promise<void> {
        if (this.refreshInProgress) {
            return;
        }

        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        try {
            this.abortController = new AbortController();

            if (authState.data.status === 'logged-in') {
                this.isLoading = true;

                if (!this.props.keepStale) {
                    this.notFound = false;
                    this.setData(null);
                }

                await this.loadData(this.abortController.signal);
            }
        } finally {
            this.refreshInProgress = false;
            if (
                (this.abortController === null || !this.abortController.signal.aborted) &&
                this.props.autoRefresh !== null &&
                !this.destroyed
            ) {
                this.refreshTimer = setTimeout(() => {
                    void this.refresh();
                }, this.props.autoRefresh);
            }
            this.abortController = null;
        }
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        if (this.refreshTimer !== null) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        this.abortController?.abort();
        this.isLoading = true;
        if (!this.props.keepStale) {
            this.data = null;
        }
    }
}

export interface RemoteEntityData {
    id: string;
}

export interface EntityApi<
    RemoteEntity extends RemoteEntityData,
    RemoteEntityAdd extends object,
    RemoteEntityUpdate extends object,
> {
    get: (id: string, props?: RequestProperties) => Promise<RemoteEntity>;
    list: (props?: RequestProperties) => Promise<{ result: RemoteEntity[] }>;
    add: (entity: RemoteEntityAdd, props?: MutationRequestProperties) => Promise<{ result: RemoteEntity }>;
    update: (
        id: string,
        data: RemoteEntityUpdate,
        props?: MutationRequestProperties,
    ) => Promise<{ result: RemoteEntity }>;
    delete: (id: string, props?: MutationRequestProperties) => Promise<void>;
}

export abstract class LocalEntity<
    RemoteEntity extends RemoteEntityData,
    RemoteEntityAdd extends object = object,
    RemoteEntityUpdate extends object = object,
> {
    protected asyncOps = new SvelteMap<string, Promise<void>>();

    data: RemoteEntity = $state() as RemoteEntity;
    isLoading: boolean = $derived(this.asyncOps.size !== 0);
    abstract info: Record<string, { name: string; value: string }>;

    canStart = $derived(false);
    canRestart = $derived(false);
    canStop = $derived(false);
    canDelete = $derived(true);

    constructor(
        public api: EntityApi<RemoteEntity, RemoteEntityAdd, RemoteEntityUpdate>,
        data: RemoteEntity,
    ) {
        this.data = data;
    }

    protected async asyncOp(callback: () => Promise<void>, operation: string, autoRefresh: boolean = false) {
        const doAsyncOp = async () => {
            await callback();
            this.asyncOps.delete(operation);
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

    async update(updateData: RemoteEntityUpdate) {
        await this.asyncOp(
            async () => {
                this.data = (await this.api.update(this.data.id, updateData)).result;
            },
            'updating',
            true,
        );
    }

    start(): Promise<void> {
        throw new Error('Unsupported operation');
    }
    restart(): Promise<void> {
        throw new Error('Unsupported operation');
    }
    stop(): Promise<void> {
        throw new Error('Unsupported operation');
    }
}

export abstract class EntityProvider<
    RemoteEntity extends RemoteEntityData,
    RemoteEntityAdd extends object = object,
    RemoteEntityUpdate extends object = object,
    Entity extends LocalEntity<RemoteEntity, RemoteEntityAdd, RemoteEntityUpdate> = LocalEntity<
        RemoteEntity,
        RemoteEntityAdd,
        RemoteEntityUpdate
    >,
> {
    $entity: Entity = undefined as never;
    $add: RemoteEntityAdd = undefined as never;
    $update: RemoteEntityUpdate = undefined as never;

    protected fetch: RemoteData<{ result: RemoteEntity[] }>;
    list: Entity[] | null = $state(null);
    isLoading: boolean;

    constructor(
        protected api: EntityApi<RemoteEntity, RemoteEntityAdd, RemoteEntityUpdate>,
        protected factory: (entity: RemoteEntity) => Entity,
    ) {
        this.fetch = new RemoteData(api.list, {
            keepStale: true,
            autoRefresh: 3000,
            onDataUpdated: this.onDataUpdated.bind(this),
        });
        this.isLoading = $derived(this.fetch.isLoading);
    }

    onDataUpdated(data: { result: RemoteEntity[] } | null) {
        this.list = data?.result.map(this.factory) ?? null;
    }

    async add(entity: RemoteEntityAdd, props?: MutationRequestProperties): Promise<Entity> {
        const response = await this.api.add(entity, props);
        const localEntity = this.factory(response.result);
        this.list?.push(localEntity);
        return localEntity;
    }

    async delete(entity: Entity, props?: MutationRequestProperties) {
        await this.api.delete(entity.data.id, props);
        if (this.list) {
            this.list = this.list.filter((item) => item.data.id !== entity.data.id);
        }
    }

    protected destroy() {
        this.fetch.destroy();
    }
}
