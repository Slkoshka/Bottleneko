import { ClassicPreset } from 'rete';
import deepEqual from 'deep-equal';
import { ExecSocket, NekoSocket, AnyEnumInputSocket, SwitchableObjectSocket } from '../../sockets';
import { NekoNodeBase, NodeProps, NodeSocket } from '../NekoNodeBase';
import { GraphSwitchNodeData } from '../../../../api/dtos.gen';

export class SwitchNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: AnyEnumInputSocket;
    },
    Record<string, ExecSocket>,
    object,
    GraphSwitchNodeData
> {
    type = 'switch' as const;
    category = 'control' as const;
    width = 300;

    constructor(props: NodeProps) {
        super(SwitchNode.name(), { inputType: null }, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new AnyEnumInputSocket(), 'Value', false));

        // Outputs

        // Controls
    }

    async connect(source: NodeSocket, target: NodeSocket) {
        if (target.socket === this.inputs.in?.socket && !deepEqual(source.socket.type, this.state.inputType)) {
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
                await this.props.editor.removeConnection(connection.id);
            }
        }

        for (const output of Object.keys(this.outputs)) {
            this.removeOutput(output as never);
        }

        if (this.state.inputType) {
            const socket = NekoSocket.fromType(this.state.inputType);

            if (socket instanceof SwitchableObjectSocket) {
                for (const { id, name } of socket.options()) {
                    this.addOutput(id, new ClassicPreset.Output(new ExecSocket(), name, false));
                }
            }
        }

        await super.stateUpdated();
    }

    static name() {
        return 'Switch';
    }

    static default(props: NodeProps) {
        return new SwitchNode(props);
    }
}
