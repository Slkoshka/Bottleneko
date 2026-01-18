import type { ExtendedConnectionStatus } from '$lib/api/dtos.gen';

export interface Props {
    status: ExtendedConnectionStatus;
    'show-label'?: boolean;
    size?: string;
}
