import type { UserDto } from '$lib/api/dtos.gen';
import type { UsersProvider } from './provider.svelte';

export interface Props {
    user: UserDto | null;
    show: boolean;
    onsuccess?: (user: UsersProvider['$update']) => Promise<void>;
    onclose?: () => void;
}
