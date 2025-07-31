import { ClassicPreset } from 'rete';
import { NekoSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { NumberInputControl } from '../../controls/NumberInputControl';
import { NekoNode } from '..';

export interface AnyArityMathOpNodeCustomization {
    name?: (idx: number) => string;
    outName?: string;
}

export abstract class AnyArityMathOpNode<Props extends NodeProps = NodeProps> extends NekoNodeBase<
    Record<string, NekoSocket>,
    {
        out: NumberSocket;
    },
    {
        inputs: NumberInputControl;
    },
    Props
> {
    constructor(name: string, initial: number, props: Props, private readonly customization?: AnyArityMathOpNodeCustomization) {
        super(name, props);

        // Inputs

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
        this.addControl('inputs', new NumberInputControl({ initial, label: 'Inputs', min: 1, max: 16, fastUpdate: true, change: (value) => {
            this.onChanged(value);
        } }));

        this.onChanged(initial);
    }

    onChanged(value: number) {
        const inputs = Object.values(this.inputs) as ClassicPreset.Input<NumberSocket>[];
        for (let i = 0; i < Math.max(value, inputs.length); i++) {
            const key = `in-${i.toString()}`;
            if (i >= inputs.length) {
                this.addInput(key, new ClassicPreset.Input(new NumberSocket(), this.customization?.name?.(i) ?? `Input ${(i + 1).toString()}`, false));
            }
            else if (i >= value) {
                this.removeInput(key);
                for (const connection of this.props.editor.getConnections().filter(connection => connection.target === this.id && connection.targetInput === key)) {
                    void this.props.editor.removeConnection(connection.id);
                }
            }
        }
        this.props.refresh?.(this as NekoNode);
    }
}
