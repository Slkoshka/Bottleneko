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
    constructor(props: NodeProps) {
        super(SwitchOnSignNode.name(), props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), 'In', true));

        // Outputs
        this.addOutput('negative', new ClassicPreset.Output(new ExecSocket(), 'Negative', false));
        this.addOutput('zero', new ClassicPreset.Output(new ExecSocket(), 'Zero', false));
        this.addOutput('positive', new ClassicPreset.Output(new ExecSocket(), 'Positive', false));

        // Controls
    }

    clone() {
        return new SwitchOnSignNode(this.props);
    }

    static name() {
        return 'Swtich On Sign';
    }

    static default(props: NodeProps) {
        return new SwitchOnSignNode(props);
    }
}
