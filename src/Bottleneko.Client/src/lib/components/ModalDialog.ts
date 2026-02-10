import type { Snippet } from 'svelte';

export interface Props {
    title?: Snippet | string;
    children?: Snippet;
    footer?: Snippet | string;
    size?: 'xl' | 'lg' | 'md' | 'sm';
    show?: boolean;
    onclose?: () => void;
}
