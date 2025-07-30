import { ClassicPreset } from 'rete';
import { ExecSocket, OptionalInputSocket } from '../../sockets';
import { NekoNodeBase } from '../NekoNodeBase';

export class IfValidNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: OptionalInputSocket;
    },
    {
        valid: ExecSocket;
        invalid: ExecSocket;
    },
    object
> {
    width = 350;
    readonly isEvent = false;

    constructor() {
        super(IfValidNode.name());

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new OptionalInputSocket(), 'Optional Value', false));

        // Outputs
        this.addOutput('valid', new ClassicPreset.Output(new ExecSocket(), 'Valid', false));
        this.addOutput('invalid', new ClassicPreset.Output(new ExecSocket(), 'Not Valid', false));

        // Controls
    }

    clone() {
        return new IfValidNode();
    }

    static name() {
        return 'If Valid';
    }

    static default() {
        return new IfValidNode();
    }
}
