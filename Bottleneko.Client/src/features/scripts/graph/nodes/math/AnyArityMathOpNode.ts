import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps, NodeState } from '../NekoNodeBase';
import { NumberInputControl } from '../../controls/NumberInputControl';

export interface AnyArityMathOpNodeCustomization {
    name?: (idx: number) => string;
    inName?: string;
    outName?: string;
}

export abstract class AnyArityMathOpNode<Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        in: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    {
        inputs: NumberInputControl;
    },
    NodeState,
    Props
> {
    category = 'math' as const;

    constructor(name: string, props: Props, readonly customization?: AnyArityMathOpNodeCustomization) {
        super(name, { }, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), customization?.inName ?? 'Inputs', true));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
