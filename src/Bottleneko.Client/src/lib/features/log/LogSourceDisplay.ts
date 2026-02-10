import type { LogSourceType } from '$lib/api/bottleneko.gen';

export interface Props {
    sourceType: LogSourceType;
    sourceId: string;
}
