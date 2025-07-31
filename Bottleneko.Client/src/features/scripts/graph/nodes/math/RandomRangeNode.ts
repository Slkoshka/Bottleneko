import { ClassicPreset } from 'rete';
import { ExecSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { ToggleInputControl } from '../../controls/ToggleInputControl';

export class RandomRangeNode extends NekoNodeBase<
    {
        exec: ExecSocket;
        min: NumberSocket;
        max: NumberSocket;
    },
    {
        exec: ExecSocket;
        out: NumberSocket;
    },
    {
        integers: ToggleInputControl;
    }
> {
    constructor(public integers: boolean, props: NodeProps) {
        super(RandomRangeNode.name(), props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('min', new ClassicPreset.Input(new NumberSocket(), 'Min', false));
        this.addInput('max', new ClassicPreset.Input(new NumberSocket(), 'Min', false));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), 'Out', true));

        // Controls
        this.addControl('integers', new ToggleInputControl({ initial: integers, label: 'Only Integers', change: (value) => {
            this.integers = value;
        } }));
    }

    clone() {
        return new RandomRangeNode(this.integers, this.props);
    }

    static name() {
        return 'Random Number In Range';
    }

    static default(props: NodeProps) {
        return new RandomRangeNode(false, props);
    }
}
