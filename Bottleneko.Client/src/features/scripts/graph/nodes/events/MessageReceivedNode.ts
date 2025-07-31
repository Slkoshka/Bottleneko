import { ClassicPreset } from 'rete';
import { ChatMessageSocket, ExecSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export class MessageReceivedNode extends NekoNodeBase<
    object,
    {
        exec: ExecSocket;
        msg: ChatMessageSocket;
    },
    object
> {
    readonly isEvent = true;

    constructor(props: NodeProps) {
        super(MessageReceivedNode.name(), props);

        // Inputs

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('msg', new ClassicPreset.Output(new ChatMessageSocket(), 'Message', true));

        // Controls
    }

    clone() {
        return new MessageReceivedNode(this.props);
    }

    static name() {
        return 'Message Received';
    }

    static default(props: NodeProps) {
        return new MessageReceivedNode(props);
    }
}
