import { ClassicPreset } from 'rete';
import { NekoSocket, StringSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { TextInputControl } from '../../controls/TextInputControl';
import { GraphFormatTextNodeData } from '../../../../api/dtos.gen';

export class FormatTextNode extends NekoNodeBase<
    Record<string, NekoSocket>,
    {
        out: StringSocket;
    },
    {
        format: TextInputControl;
    },
    GraphFormatTextNodeData
> {
    type = 'format-text' as const;
    category = 'text-ops' as const;
    width = 350;

    constructor(initial: FormatTextNode['state'], props: NodeProps) {
        super(FormatTextNode.name(), initial, props);

        // Inputs

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new StringSocket(), 'Out', true));

        // Controls
        this.addControl('format', new TextInputControl({ initial: initial.format, label: 'Format', change: (value) => {
            void this.onChanged(value);
        } }));

        void this.onChanged(initial.format);
    }

    async onChanged(value: string) {
        const matches = [...value.matchAll(/\{(.+?)\}/g)];
        const inputs = Object.values(this.inputs) as ClassicPreset.Input<StringSocket>[];
        for (let i = 0; i < Math.max(matches.length, inputs.length); i++) {
            const key = `in-${i.toString()}`;
            if (i >= inputs.length) {
                this.addInput(key, new ClassicPreset.Input(new StringSocket(), matches[i][1], false));
            }
            else if (i >= matches.length) {
                this.removeInput(key);
                if (this.props.editor) {
                    for (const connection of this.props.editor.getConnections().filter(connection => connection.target === this.id && connection.targetInput === key)) {
                        await this.props.editor.removeConnection(connection.id);
                    }
                }
            }
            else {
                inputs[i].label = matches[i][1];
            }
        }
        this.state.format = value;
        void this.dirty();
        await this.refreshEditorView();
    }

    async stateUpdated() {
        this.controls.format.setValue(this.state.format);
        await super.stateUpdated();
    }

    static name() {
        return 'Format Text';
    }

    static default(props: NodeProps) {
        return new FormatTextNode({ format: '' }, props);
    }
}
