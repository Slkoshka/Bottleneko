import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MinNode extends AnyArityMathOpNode {
    constructor(initial: number, props: NodeProps) {
        super(MinNode.name(), initial, props);
    }

    clone() {
        return new MinNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Min';
    }

    static default(props: NodeProps) {
        return new MinNode(2, props);
    }
}
