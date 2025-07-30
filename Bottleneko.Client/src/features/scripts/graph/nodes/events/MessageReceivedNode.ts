import { ClassicPreset } from 'rete';
import { ChatMessageSocket, ExecSocket } from '../../sockets';
import { NekoNodeBase } from '../NekoNodeBase';

export class MessageReceivedNode extends NekoNodeBase<
    object,
    {
        exec: ExecSocket;
        msg: ChatMessageSocket;
    },
    object
> {
    readonly isEvent = true;

    constructor() {
        super(MessageReceivedNode.name());

        // Inputs

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('msg', new ClassicPreset.Output(new ChatMessageSocket(), 'Message', true));

        // Controls
    }

    clone() {
        return new MessageReceivedNode();
    }

    static name() {
        return 'Message Received';
    }

    static default() {
        return new MessageReceivedNode();
    }
}
