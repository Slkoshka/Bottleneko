import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AverageNode extends AnyArityMathOpNode {
    constructor(props: NodeProps) {
        super(AverageNode.name(), props);
    }

    clone() {
        return new AverageNode(this.props);
    }

    static name() {
        return 'Average';
    }

    static default(props: NodeProps) {
        return new AverageNode(props);
    }
}
