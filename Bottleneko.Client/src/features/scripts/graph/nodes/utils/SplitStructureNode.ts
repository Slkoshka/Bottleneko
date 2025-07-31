import { ClassicPreset, NodeEditor } from 'rete';
import { NekoSocket, SplittableInputSocket, SplittableObjectSocket } from '../../sockets';
import { NekoNodeBase, NodeProps, NodeSocket } from '../NekoNodeBase';
import { Schemes } from '../../editor';

export class SplitStructureNode extends NekoNodeBase<
    {
        in: SplittableInputSocket;
    },
    Record<string, NekoSocket>,
    object
> {
    readonly isEvent = false;
    type: string | null = null;

    constructor(props: NodeProps) {
        super(SplitStructureNode.name(), props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new SplittableInputSocket(), 'In', false));

        // Outputs

        // Controls
    }

    connect(editor: NodeEditor<Schemes>, source: NodeSocket, target: NodeSocket) {
        if (target.node === this && source.socket.type !== this.type) {
            for (const connection of editor.getConnections().filter(connection => connection.source === this.id)) {
                void editor.removeConnection(connection.id);
            }

            for (const output of Object.keys(this.outputs)) {
                this.removeOutput(output as never);
            }

            if (source.socket instanceof SplittableObjectSocket) {
                for (const { id, name, constructor, singleConnection } of source.socket.parts()) {
                    this.addOutput(id, new ClassicPreset.Output(constructor(), name, !singleConnection));
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
        return new SplitStructureNode(this.props);
    }

    static name() {
        return 'Split Structure';
    }

    static default(props: NodeProps) {
        return new SplitStructureNode(props);
    }
}
