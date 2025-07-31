import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MultiplyNode extends AnyArityMathOpNode {
    constructor(initial: number, props: NodeProps) {
        super(MultiplyNode.name(), initial, props);
    }

    clone() {
        return new MultiplyNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Multiply';
    }

    static default(props: NodeProps) {
        return new MultiplyNode(2, props);
    }
}
