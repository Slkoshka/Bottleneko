import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MaxNode extends AnyArityMathOpNode {
    constructor(initial: number, props: NodeProps) {
        super(MaxNode.name(), initial, props);
    }

    clone() {
        return new MaxNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Max';
    }

    static default(props: NodeProps) {
        return new MaxNode(2, props);
    }
}
