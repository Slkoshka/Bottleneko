import type { ExtendedConnectionStatus } from '$lib/api/bottleneko.gen';

export interface Props {
    status: ExtendedConnectionStatus;
    'show-label'?: boolean;
    size?: string;
}
