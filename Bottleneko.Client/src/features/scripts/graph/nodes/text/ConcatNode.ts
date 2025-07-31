import { ClassicPreset } from 'rete';
import { NekoSocket, StringSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { NumberInputControl } from '../../controls/NumberInputControl';

export class ConcatNode extends NekoNodeBase<
    Record<string, NekoSocket>,
    {
        out: StringSocket;
    },
    {
        inputs: NumberInputControl;
    }
> {
    width = 350;
    readonly isEvent = false;

    constructor(initial: number, props: NodeProps) {
        super(ConcatNode.name(), props);

        // Inputs

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new StringSocket(), 'Out', true));

        // Controls
        this.addControl('inputs', new NumberInputControl({ initial, label: 'Inputs', min: 1, max: 16, fastUpdate: true, change: (value) => {
            this.onChanged(value);
        } }));

        this.onChanged(initial);
    }

    onChanged(value: number) {
        const inputs = Object.values(this.inputs) as ClassicPreset.Input<StringSocket>[];
        for (let i = 0; i < Math.max(value, inputs.length); i++) {
            const key = `in-${i.toString()}`;
            if (i >= inputs.length) {
                this.addInput(key, new ClassicPreset.Input(new StringSocket(), `Input ${(i + 1).toString()}`, false));
            }
            else if (i >= value) {
                this.removeInput(key);
                for (const connection of this.props.editor.getConnections().filter(connection => connection.target === this.id && connection.targetInput === key)) {
                    void this.props.editor.removeConnection(connection.id);
                }
            }
        }
        this.props.refresh?.(this);
    }

    clone() {
        return new ConcatNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Concatenate';
    }

    static default(props: NodeProps) {
        return new ConcatNode(2, props);
    }
}
