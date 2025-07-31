import { ClassicPreset } from 'rete';
import { BooleanSocket, ExecSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export class IfNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: BooleanSocket;
    },
    {
        true: ExecSocket;
        false: ExecSocket;
    },
    object
> {
    width = 250;
    readonly isEvent = false;

    constructor(props: NodeProps) {
        super(IfNode.name(), props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new BooleanSocket(), 'Condition', false));

        // Outputs
        this.addOutput('true', new ClassicPreset.Output(new ExecSocket(), 'True', false));
        this.addOutput('false', new ClassicPreset.Output(new ExecSocket(), 'False', false));

        // Controls
    }

    clone() {
        return new IfNode(this.props);
    }

    static name() {
        return 'If';
    }

    static default(props: NodeProps) {
        return new IfNode(props);
    }
}
