import { ClassicPreset } from 'rete';
import { ExecSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export class RandomNumberNode extends NekoNodeBase<
    {
        exec: ExecSocket;
    },
    {
        exec: ExecSocket;
        out: NumberSocket;
    },
    object
> {
    constructor(props: NodeProps) {
        super(RandomNumberNode.name(), props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), 'Out', true));

        // Controls
    }

    clone() {
        return new RandomNumberNode(this.props);
    }

    static name() {
        return 'Random Number [0; 1)';
    }

    static default(props: NodeProps) {
        return new RandomNumberNode(props);
    }
}
