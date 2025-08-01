import { ClassicPreset } from 'rete';
import { ExecSocket, StringSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { LogSeverityInputControl } from '../../controls/LogSeverityInputControl';
import { GraphLogMessageNodeData, LogSeverity } from '../../../../api/dtos.gen';

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
    },
    GraphLogMessageNodeData
> {
    type = 'log-message' as const;
    category = 'utils' as const;
    width = 250;

    constructor(initial: LogMessageNode['state'], props: NodeProps) {
        super(LogMessageNode.name(), initial, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new StringSocket(), 'Message', false));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));

        // Controls
        this.addControl('severity', new LogSeverityInputControl({ initial: initial.severity, change: (value) => {
            this.state.severity = value;
            void this.dirty();
        } }));
    }

    async stateUpdated() {
        this.controls.severity.setValue(this.state.severity);
        await super.stateUpdated();
    }

    static name() {
        return 'Log Message';
    }

    static default(props: NodeProps) {
        return new LogMessageNode({ severity: LogSeverity.Info }, props);
    }
}
