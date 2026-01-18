import type { Snippet } from 'svelte';

export interface Props {
    title?: string;
    show?: boolean;
    loading?: boolean;
    onaccept?: () => Promise<void>;
    onclose?: () => void;
    children?: Snippet;
    cancelText?: string;
    acceptText?: string;
    acceptVariant?: ButtonStyleVariant;
}
