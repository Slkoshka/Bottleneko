import { ClassicPreset } from 'rete';
import { ExecSocket, StringSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { LogSeverityInputControl, LogSeverity } from '../../controls/LogSeverityInputControl';

export class LogMessageNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: StringSocket;
    },
    {
        exec: ExecSocket;
    },
    {
        severity: LogSeverityInputControl;
    }
> {
    width = 250;
    readonly isEvent = false;

    constructor(public severity: LogSeverity, props: NodeProps) {
        super(LogMessageNode.name(), props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new StringSocket(), 'Message', false));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));

        // Controls
        this.addControl('severity', new LogSeverityInputControl({ initial: severity, change: (value) => {
            this.severity = value;
        } }));
    }

    clone() {
        return new LogMessageNode(this.severity, this.props);
    }

    static name() {
        return 'Log Message';
    }

    static default(props: NodeProps) {
        return new LogMessageNode('info', props);
    }
}
