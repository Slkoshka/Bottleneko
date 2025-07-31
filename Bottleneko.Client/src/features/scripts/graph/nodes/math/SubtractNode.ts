import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class SubtractNode extends AnyArityMathOpNode {
    constructor(initial: number, props: NodeProps) {
        super(SubtractNode.name(), initial, props);
    }

    clone() {
        return new SubtractNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Subtract';
    }

    static default(props: NodeProps) {
        return new SubtractNode(2, props);
    }
}
