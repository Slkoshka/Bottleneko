import { ClassicPreset } from 'rete';
import { ExecSocket, NekoSocket, SwitchableInputSocket, SwitchableObjectSocket } from '../../sockets';
import { NekoNode } from '../NekoNode';

export class SwitchNode extends NekoNode<
    {
        exec: ExecSocket;
        in: SwitchableInputSocket;
    },
    Record<string, ExecSocket>,
    object
> {
    width = 300;
    readonly isEvent = false;
    type: string | null = null;

    constructor() {
        super(SwitchNode.name());

        // Inputs
        this.addInput('exec', new ClassicPreset.Input(new ExecSocket(), 'Exec', true));
        this.addInput('in', new ClassicPreset.Input(new SwitchableInputSocket(), 'Value', false));

        // Outputs

        // Controls
    }

    connect(source: NekoSocket, target: NekoSocket) {
        if (target === this.inputs.in?.socket && source.type !== this.type) {
            for (const output of Object.keys(this.outputs)) {
                this.removeOutput(output as never);
            }

            if (source instanceof SwitchableObjectSocket) {
                for (const { id, name } of source.options()) {
                    this.addOutput(id, new ClassicPreset.Output(new ExecSocket(), name, false));
                }
            }

            this.type = source.type;

            return true;
        }
        else {
            return false;
        }
    }

    disconnect(source: NekoSocket | null, target: NekoSocket) {
        void source;
        void target;

        for (const output of Object.keys(this.outputs)) {
            this.removeOutput(output as never);
        }

        this.type = null;

        return true;
    }

    clone() {
        return new SwitchNode();
    }

    static name() {
        return 'Switch';
    }

    static default() {
        return new SwitchNode();
    }
}
