import { ClassicPreset } from 'rete';
import { BooleanSocket, ExecSocket, NumberSocket, StringSocket } from '../sockets';
import { NekoNodeBase } from './NekoNodeBase';

export class TestNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        in1: NumberSocket;
        in2: NumberSocket;
        in3: StringSocket;
        in4: BooleanSocket;
    },
    {
        exec: ExecSocket;
        out1: NumberSocket;
        out2: NumberSocket;
        out3: BooleanSocket;
    },
    {
        value: ClassicPreset.InputControl<'number'>;
    }
> {
    readonly isEvent = false;

    constructor(initial: number) {
        super(TestNode.name());

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in1', new ClassicPreset.Input(new NumberSocket(), 'In 1', false));
        this.addInput('in2', new ClassicPreset.Input(new NumberSocket(), 'In 2', false));
        this.addInput('in3', new ClassicPreset.Input(new StringSocket(), 'In 3', false));
        this.addInput('in4', new ClassicPreset.Input(new BooleanSocket(), 'In 4', false));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('out1', new ClassicPreset.Output(new NumberSocket(), 'Out 1', true));
        this.addOutput('out2', new ClassicPreset.Output(new StringSocket(), 'Out 2', true));
        this.addOutput('out3', new ClassicPreset.Output(new BooleanSocket(), 'Out 3', true));

        // Controls
        this.addControl('value', new ClassicPreset.InputControl('number', { initial }));
    }

    clone() {
        return new TestNode(this.controls.value.value ?? 0);
    }

    static name() {
        return '[DEV] Test';
    }

    static default() {
        return new TestNode(0);
    }
}
