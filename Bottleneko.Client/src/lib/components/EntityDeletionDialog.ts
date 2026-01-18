import type { LocalEntity, RemoteEntityData } from '$lib/provider.svelte';

export interface Props<T extends LocalEntity<RemoteEntityData, never, never>> {
    ['type-name']?: string;
    item: T | null;
    loading?: boolean;
    ondelete?: () => Promise<void>;
    onclose?: () => void;
}
