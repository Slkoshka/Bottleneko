import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps, NodeState } from '../NekoNodeBase';

export interface UnaryMathOpNodeCustomization {
    inName?: string;
    outName?: string;
}

export abstract class UnaryMathOpNode<Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        in: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    object,
    NodeState,
    Props
> {
    category = 'math' as const;

    constructor(name: string, props: Props, customization?: UnaryMathOpNodeCustomization) {
        super(name, { }, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), customization?.inName ?? 'In', false));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
