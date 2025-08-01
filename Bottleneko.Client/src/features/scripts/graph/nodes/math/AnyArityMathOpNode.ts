import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { NumberInputControl } from '../../controls/NumberInputControl';
import { GraphNodeData } from '../../../../api/dtos.gen';

export interface AnyArityMathOpNodeCustomization {
    name?: (idx: number) => string;
    inName?: string;
    outName?: string;
}

export abstract class AnyArityMathOpNode<Data extends GraphNodeData, Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        in: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    {
        inputs: NumberInputControl;
    },
    Data,
    Props
> {
    category = 'math' as const;

    constructor(name: string, initial: AnyArityMathOpNode<Data, Props>['initial'], props: Props, readonly customization?: AnyArityMathOpNodeCustomization) {
        super(name, initial, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), customization?.inName ?? 'Inputs', true));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
