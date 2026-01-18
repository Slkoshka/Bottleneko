import type { LogSourceType } from '$lib/api/dtos.gen';

export interface Props {
    sourceType: LogSourceType;
    sourceId: string;
}
