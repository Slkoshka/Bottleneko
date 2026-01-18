import type { ScriptStatus } from '$lib/api/dtos.gen';

export interface Props {
    status: ScriptStatus;
    'show-label'?: boolean;
    size?: string;
}
