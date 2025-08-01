import { ClassicPreset } from 'rete';
import { BooleanSocket, ExecSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { GraphIfNodeData } from '../../../../api/dtos.gen';

export class IfNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: BooleanSocket;
    },
    {
        true: ExecSocket;
        false: ExecSocket;
    },
    object,
    GraphIfNodeData
> {
    type = 'if' as const;
    category = 'control' as const;
    width = 250;

    constructor(props: NodeProps) {
        super(IfNode.name(), { }, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new BooleanSocket(), 'Condition', false));

        // Outputs
        this.addOutput('true', new ClassicPreset.Output(new ExecSocket(), 'True', false));
        this.addOutput('false', new ClassicPreset.Output(new ExecSocket(), 'False', false));

        // Controls
    }

    static name() {
        return 'If';
    }

    static default(props: NodeProps) {
        return new IfNode(props);
    }
}
