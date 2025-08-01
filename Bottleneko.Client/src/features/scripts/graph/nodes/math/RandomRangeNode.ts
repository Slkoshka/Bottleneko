import { ClassicPreset } from 'rete';
import { ExecSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { ToggleInputControl } from '../../controls/ToggleInputControl';
import { GraphRandomRangeNodeData } from '../../../../api/dtos.gen';

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
    },
    GraphRandomRangeNodeData
> {
    type = 'random-range' as const;
    category = 'math' as const;

    constructor(initial: RandomRangeNode['initial'], props: NodeProps) {
        super(RandomRangeNode.name(), initial, props);

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('min', new ClassicPreset.Input(new NumberSocket(), 'Min', false));
        this.addInput('max', new ClassicPreset.Input(new NumberSocket(), 'Min', false));

        // Outputs
        this.addOutput('exec', new ClassicPreset.Output(new ExecSocket(), 'Exec', false));
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), 'Out', true));

        // Controls
        this.addControl('integers', new ToggleInputControl({ initial: initial.integers, label: 'Only Integers', change: (value) => {
            this.state.integers = value;
            void this.dirty();
        } }));
    }

    async stateUpdated() {
        this.controls.integers.setValue(this.state.integers);
        await super.stateUpdated();
    }

    static name() {
        return 'Random Number In Range';
    }

    static default(props: NodeProps) {
        return new RandomRangeNode({ integers: false }, props);
    }
}
