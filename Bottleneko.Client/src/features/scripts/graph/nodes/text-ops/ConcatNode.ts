import { ClassicPreset } from 'rete';
import { NekoSocket, StringSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { NumberInputControl } from '../../controls/NumberInputControl';
import { GraphConcatNodeData } from '../../../../api/dtos.gen';

export class ConcatNode extends NekoNodeBase<
    Record<string, NekoSocket>,
    {
        out: StringSocket;
    },
    {
        inputs: NumberInputControl;
    },
    GraphConcatNodeData
> {
    type = 'concat' as const;
    category = 'text-ops' as const;

    constructor(initial: ConcatNode['state'], props: NodeProps) {
        super(ConcatNode.name(), initial, props);

        // Inputs

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new StringSocket(), 'Out', true));

        // Controls
        this.addControl('inputs', new NumberInputControl({ initial: initial.inputs, label: 'Inputs', min: 1, max: 16, fastUpdate: true, change: (value) => {
            void this.onChanged(value);
        } }));

        void this.onChanged(initial.inputs);
    }

    async onChanged(value: number) {
        const inputs = Object.values(this.inputs) as ClassicPreset.Input<StringSocket>[];
        for (let i = 0; i < Math.max(value, inputs.length); i++) {
            const key = `in-${i.toString()}`;
            if (i >= inputs.length) {
                this.addInput(key, new ClassicPreset.Input(new StringSocket(), `Input ${(i + 1).toString()}`, false));
            }
            else if (i >= value) {
                this.removeInput(key);
                if (this.props.editor) {
                    for (const connection of this.props.editor.getConnections().filter(connection => connection.target === this.id && connection.targetInput === key)) {
                        await this.props.editor.removeConnection(connection.id);
                    }
                }
            }
        }
        this.state.inputs = value;
        await this.refreshEditorView();
    }

    async stateUpdated() {
        this.controls.inputs.setValue(this.state.inputs);
        await super.stateUpdated();
    }

    static name() {
        return 'Concatenate';
    }

    static default(props: NodeProps) {
        return new ConcatNode({ inputs: 2 }, props);
    }
}
