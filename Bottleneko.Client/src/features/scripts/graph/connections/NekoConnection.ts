import { ClassicPreset } from 'rete';
import { NekoNode } from '../nodes';
import { NekoSocket } from '../sockets';
import { GraphSocketType } from '../../../api/dtos.gen';

export default class NekoConnection<A extends NekoNode = NekoNode, B extends NekoNode = NekoNode> extends ClassicPreset.Connection<A, B> {
    sourceType: GraphSocketType;
    targetType: GraphSocketType;
    readonly isPseudo = false;
    isLoop? = false;

    constructor(source: A, sourceOutput: keyof A['outputs'], target: B, targetInput: keyof B['inputs']) {
        super(source, sourceOutput, target, targetInput);

        const sourceSocket = (source.outputs as Record<keyof A['outputs'], ClassicPreset.Output<NekoSocket>>)[sourceOutput].socket;
        this.sourceType = sourceSocket.type;

        const targetSocket = (target.inputs as Record<keyof B['inputs'], ClassicPreset.Input<NekoSocket>>)[targetInput].socket;
        this.targetType = targetSocket.type;
    }
}
