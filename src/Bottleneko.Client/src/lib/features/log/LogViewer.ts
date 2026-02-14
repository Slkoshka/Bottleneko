import type { LogSourceType, LogSeverity } from '$lib/api/bottleneko.gen';

export interface Props {
    sourceType?: LogSourceType;
    sourceId?: string;
    class?: string;
}

export const severityStyle: Record<LogSeverity, string> = {
    Critical: 'color: #ff0000',
    Error: 'color: #f00000',
    Warning: 'color: #ffa040',
    Info: 'color: #2070ff',
    Verbose: 'color: #707070',
    Debug: 'color: #707070',
};

export const messageStyle: Record<LogSeverity, string> = {
    Critical: 'color: #ff0000; font-weight: bold',
    Error: 'color: #d0d0d0',
    Warning: 'color: #d0d0d0',
    Info: 'color: #d0d0d0',
    Verbose: 'color: #707070',
    Debug: 'color: #707070',
};

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
