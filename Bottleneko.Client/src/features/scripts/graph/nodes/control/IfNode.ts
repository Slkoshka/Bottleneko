import { ClassicPreset } from 'rete';
import { BooleanSocket, ExecSocket } from '../../sockets';
import { NekoNodeBase } from '../NekoNodeBase';

export class IfNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in: BooleanSocket;
    },
    {
        true: ExecSocket;
        false: ExecSocket;
    },
    object
> {
    width = 250;
    readonly isEvent = false;

    constructor() {
        super(IfNode.name());

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new BooleanSocket(), 'Condition', false));

        // Outputs
        this.addOutput('true', new ClassicPreset.Output(new ExecSocket(), 'True', false));
        this.addOutput('false', new ClassicPreset.Output(new ExecSocket(), 'False', false));

        // Controls
    }

    clone() {
        return new IfNode();
    }

    static name() {
        return 'If';
    }

    static default() {
        return new IfNode();
    }
}
