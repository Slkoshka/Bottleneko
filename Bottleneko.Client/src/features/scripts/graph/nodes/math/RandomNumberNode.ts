import { ClassicPreset } from 'rete';
import { ExecSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { GraphRandomNumberNodeData } from '../../../../api/dtos.gen';

export class RandomNumberNode extends NekoNodeBase<
    {
        exec: ExecSocket;
    },
    {
        exec: ExecSocket;
        out: NumberSocket;
    },
    object,
    GraphRandomNumberNodeData
> {
    type = 'random-number' as const;
    category = 'math' as const;

    constructor(props: NodeProps) {
        super(RandomNumberNode.name(), { }, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), 'Out', true));

        // Controls
    }

    static name() {
        return 'Random Number [0; 1)';
    }

    static default(props: NodeProps) {
        return new RandomNumberNode(props);
    }
}
