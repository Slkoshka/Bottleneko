import type { Snippet } from 'svelte';

export interface Props {
    title?: Snippet | string;
    loading?: boolean;
    'fill-screen'?: boolean;
    children?: Snippet;
    ontabchanged?: (tab: string | number) => void;
}
