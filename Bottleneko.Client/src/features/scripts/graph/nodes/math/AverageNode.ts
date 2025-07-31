import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AverageNode extends AnyArityMathOpNode {
    constructor(initial: number, props: NodeProps) {
        super(AverageNode.name(), initial, props);
    }

    clone() {
        return new AverageNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Average';
    }

    static default(props: NodeProps) {
        return new AverageNode(2, props);
    }
}
