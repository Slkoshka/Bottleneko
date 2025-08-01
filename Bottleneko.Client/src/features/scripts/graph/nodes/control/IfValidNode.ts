import { ClassicPreset } from 'rete';
import { ExecSocket, OptionalInputSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { GraphIfValidNodeData } from '../../../../api/dtos.gen';

export class IfValidNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: OptionalInputSocket;
    },
    {
        valid: ExecSocket;
        invalid: ExecSocket;
    },
    object,
    GraphIfValidNodeData
> {
    type = 'if-valid' as const;
    category = 'control' as const;
    width = 350;

    constructor(props: NodeProps) {
        super(IfValidNode.name(), { }, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new OptionalInputSocket(), 'Optional Value', false));

        // Outputs
        this.addOutput('valid', new ClassicPreset.Output(new ExecSocket(), 'Valid', false));
        this.addOutput('invalid', new ClassicPreset.Output(new ExecSocket(), 'Not Valid', false));

        // Controls
    }

    static name() {
        return 'If Valid';
    }

    static default(props: NodeProps) {
        return new IfValidNode(props);
    }
}
