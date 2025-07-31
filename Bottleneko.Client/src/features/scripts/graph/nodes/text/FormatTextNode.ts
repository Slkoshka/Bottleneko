import { ClassicPreset } from 'rete';
import { NekoSocket, StringSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { TextInputControl } from '../../controls/TextInputControl';

export class FormatTextNode extends NekoNodeBase<
    Record<string, NekoSocket>,
    {
        out: StringSocket;
    },
    {
        format: TextInputControl;
    }
> {
    width = 350;

    constructor(initial: string, props: NodeProps) {
        super(FormatTextNode.name(), props);

        // Inputs

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new StringSocket(), 'Out', true));

        // Controls
        this.addControl('format', new TextInputControl({ initial, label: 'Format', change: (value) => {
            this.onChanged(value);
        } }));

        this.onChanged(initial);
    }

    onChanged(value: string) {
        const matches = [...value.matchAll(/\{(.+?)\}/g)];
        const inputs = Object.values(this.inputs) as ClassicPreset.Input<StringSocket>[];
        for (let i = 0; i < Math.max(matches.length, inputs.length); i++) {
            const key = `in-${i.toString()}`;
            if (i >= inputs.length) {
                this.addInput(key, new ClassicPreset.Input(new StringSocket(), matches[i][1], false));
            }
            else if (i >= matches.length) {
                this.removeInput(key);
                for (const connection of this.props.editor.getConnections().filter(connection => connection.target === this.id && connection.targetInput === key)) {
                    void this.props.editor.removeConnection(connection.id);
                }
            }
            else {
                inputs[i].label = matches[i][1];
            }
        }
        this.props.refresh?.(this);
    }

    clone() {
        return new FormatTextNode(this.controls.format.value, this.props);
    }

    static name() {
        return 'Format Text';
    }

    static default(props: NodeProps) {
        return new FormatTextNode('', props);
    }
}
