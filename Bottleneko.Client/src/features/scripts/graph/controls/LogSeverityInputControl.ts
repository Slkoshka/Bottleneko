import { LogSeverity } from '../../../api/dtos.gen';
import { OptionListInputControl, OptionListInputControlProps } from './OptionListInputControl';

export type LogSeverityInputControlProps = Omit<OptionListInputControlProps<LogSeverity>, 'initial'> & { initial?: LogSeverity };

export class LogSeverityInputControl extends OptionListInputControl<LogSeverity> {
    constructor(props?: LogSeverityInputControlProps) {
        super({ initial: LogSeverity.Info, label: 'Severity', ...props });
    }

    options(): { name: string; value: LogSeverity }[] {
        return [
            { name: 'Critical', value: LogSeverity.Critical },
            { name: 'Error', value: LogSeverity.Error },
            { name: 'Warning', value: LogSeverity.Warning },
            { name: 'Information', value: LogSeverity.Info },
            { name: 'Verbose', value: LogSeverity.Verbose },
            { name: 'Debug', value: LogSeverity.Debug },
        ];
    }
}
