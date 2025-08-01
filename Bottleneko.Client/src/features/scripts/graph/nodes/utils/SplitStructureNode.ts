import { ClassicPreset } from 'rete';
import deepEqual from 'deep-equal';
import { NekoSocket, AnyStructureInputSocket, SplittableObjectSocket } from '../../sockets';
import { NekoNodeBase, NodeProps, NodeSocket } from '../NekoNodeBase';
import { GraphSplitStructureNodeData } from '../../../../api/dtos.gen';

export class SplitStructureNode extends NekoNodeBase<
    {
        in: AnyStructureInputSocket;
    },
    Record<string, NekoSocket>,
    object,
    GraphSplitStructureNodeData
> {
    type = 'split-structure' as const;
    category = 'utils' as const;

    constructor(initial: SplitStructureNode['state'], props: NodeProps) {
        super(SplitStructureNode.name(), initial, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new AnyStructureInputSocket(), 'In', false));

        // Outputs

        // Controls
    }

    async connect(source: NodeSocket, target: NodeSocket) {
        if (target.node === this && !deepEqual(source.socket.type, this.type)) {
            this.state.inputType = source.socket.type;
            await this.stateUpdated();

            return true;
        }
        else {
            return false;
        }
    }

    async stateUpdated() {
        if (this.props.editor) {
            for (const connection of this.props.editor.getConnections().filter(connection => connection.source === this.id)) {
                void this.props.editor.removeConnection(connection.id);
            }
        }

        for (const output of Object.keys(this.outputs)) {
            this.removeOutput(output as never);
        }

        if (this.state.inputType) {
            const socket = NekoSocket.fromType(this.state.inputType);

            if (socket instanceof SplittableObjectSocket) {
                for (const { id, name, constructor, singleConnection } of socket.parts()) {
                    this.addOutput(id, new ClassicPreset.Output(constructor(), name, !singleConnection));
                }
            }
        }

        await super.stateUpdated();
    }

    static name() {
        return 'Split Structure';
    }

    static default(props: NodeProps) {
        return new SplitStructureNode({ inputType: null }, props);
    }
}
