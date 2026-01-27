import type { LogLetter, LogSourceType, LogSeverity } from '$lib/api/bottleneko.gen';
import type { DataTableType } from '$lib/components/DataTable';

export interface Props {
    sourceType?: LogSourceType;
    sourceId?: string;
    class?: string;
}

export type TableType = DataTableType<LogLetter, 'timestamp' | 'source' | 'category' | 'message'>;

export const getSeverityButtonVariant = (severity: LogSeverity, isActive: boolean) => {
    switch (severity) {
        case 'Critical':
        case 'Error':
        case 'Warning':
        case 'Info':
        case 'Verbose':
        case 'Debug':
        default:
            return isActive ? 'dark' : 'primary';
    }
};
