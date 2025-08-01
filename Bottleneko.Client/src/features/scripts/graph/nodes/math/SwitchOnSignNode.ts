import { ClassicPreset } from 'rete';
import { ExecSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export class SwitchOnSignNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: NumberSocket;
    },
    {
        negative: ExecSocket;
        zero: ExecSocket;
        positive: ExecSocket;
    },
    object
> {
    type = 'switch-on-sign';
    category = 'math' as const;

    constructor(props: NodeProps) {
        super(SwitchOnSignNode.name(), { }, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), 'In', true));

        // Outputs
        this.addOutput('negative', new ClassicPreset.Output(new ExecSocket(), 'Negative', false));
        this.addOutput('zero', new ClassicPreset.Output(new ExecSocket(), 'Zero', false));
        this.addOutput('positive', new ClassicPreset.Output(new ExecSocket(), 'Positive', false));

        // Controls
    }

    static name() {
        return 'Swtich On Sign';
    }

    static default(props: NodeProps) {
        return new SwitchOnSignNode(props);
    }
}
