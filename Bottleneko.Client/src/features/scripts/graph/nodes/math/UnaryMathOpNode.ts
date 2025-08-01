import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { GraphNodeData } from '../../../../api/dtos.gen';

export interface UnaryMathOpNodeCustomization {
    inName?: string;
    outName?: string;
}

export abstract class UnaryMathOpNode<Data extends GraphNodeData, Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        in: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    object,
    Data,
    Props
> {
    category = 'math' as const;

    constructor(name: string, initial: UnaryMathOpNode<Data, Props>['initial'], props: Props, customization?: UnaryMathOpNodeCustomization) {
        super(name, initial, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), customization?.inName ?? 'In', false));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
