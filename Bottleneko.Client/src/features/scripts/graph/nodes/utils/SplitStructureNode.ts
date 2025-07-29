import { ClassicPreset } from 'rete';
import { NekoSocket, SplittableInputSocket, SplittableObjectSocket } from '../../sockets';
import { NekoNode } from '../NekoNode';

export class SplitStructureNode extends NekoNode<
    {
        in: SplittableInputSocket;
    },
    Record<string, NekoSocket>,
    object
> {
    readonly isEvent = false;
    type: string | null = null;

    constructor() {
        super(SplitStructureNode.name());

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new SplittableInputSocket(), 'In', false));

        // Outputs

        // Controls
    }

    connect(source: NekoSocket, target: NekoSocket) {
        if (target === this.inputs.in?.socket && source.type !== this.type) {
            for (const output of Object.keys(this.outputs)) {
                this.removeOutput(output as never);
            }

            if (source instanceof SplittableObjectSocket) {
                for (const { id, name, constructor, singleConnection } of source.parts()) {
                    this.addOutput(id, new ClassicPreset.Output(constructor(), name, !singleConnection));
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
        return new SplitStructureNode();
    }

    static name() {
        return 'Split Structure';
    }

    static default() {
        return new SplitStructureNode();
    }
}
