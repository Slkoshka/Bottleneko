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
    type = 'message-received-event';
    category = 'events' as const;
    readonly isEvent = true;

    constructor(props: NodeProps) {
        super(MessageReceivedNode.name(), { }, props);

        // Inputs

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('msg', new ClassicPreset.Output(new ChatMessageSocket(), 'Message', true));

        // Controls
    }

    static name() {
        return 'Message Received';
    }

    static default(props: NodeProps) {
        return new MessageReceivedNode(props);
    }
}
