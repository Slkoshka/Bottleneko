import { OptionListInputControl, OptionListInputControlProps } from './OptionListInputControl';

export type LogSeverity = 'critical' | 'error' | 'warning' | 'info' | 'verbose' | 'debug';
export type LogSeverityInputControlProps = Omit<OptionListInputControlProps<LogSeverity>, 'initial'> & { initial?: LogSeverity };

export class LogSeverityInputControl extends OptionListInputControl<LogSeverity> {
    constructor(props?: LogSeverityInputControlProps) {
        super({ initial: 'info', ...props });
    }

    options(): { name: string; value: LogSeverity }[] {
        return [
            { name: 'Critical', value: 'critical' },
            { name: 'Error', value: 'error' },
            { name: 'Warning', value: 'warning' },
            { name: 'Information', value: 'info' },
            { name: 'Verbose', value: 'verbose' },
            { name: 'Debug', value: 'debug' },
        ];
    }
}
