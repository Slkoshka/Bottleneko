import { ClassicPreset, NodeEditor } from 'rete';
import { ExecSocket, SwitchableInputSocket, SwitchableObjectSocket } from '../../sockets';
import { NekoNodeBase, NodeProps, NodeSocket } from '../NekoNodeBase';
import { Schemes } from '../../editor';

export class SwitchNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: SwitchableInputSocket;
    },
    Record<string, ExecSocket>,
    object
> {
    width = 300;
    type: string | null = null;

    constructor(props: NodeProps) {
        super(SwitchNode.name(), props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new SwitchableInputSocket(), 'Value', false));

        // Outputs

        // Controls
    }

    connect(editor: NodeEditor<Schemes>, source: NodeSocket, target: NodeSocket) {
        if (target.socket === this.inputs.in?.socket && source.socket.type !== this.type) {
            for (const connection of editor.getConnections().filter(connection => connection.source === this.id)) {
                void editor.removeConnection(connection.id);
            }

            for (const output of Object.keys(this.outputs)) {
                this.removeOutput(output as never);
            }

            if (source.socket instanceof SwitchableObjectSocket) {
                for (const { id, name } of source.socket.options()) {
                    this.addOutput(id, new ClassicPreset.Output(new ExecSocket(), name, false));
                }
            }

            this.type = source.socket.type;

            return true;
        }
        else {
            return false;
        }
    }

    clone() {
        return new SwitchNode(this.props);
    }

    static name() {
        return 'Switch';
    }

    static default(props: NodeProps) {
        return new SwitchNode(props);
    }
}
