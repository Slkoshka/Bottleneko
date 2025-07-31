import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class CeilNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(CeilNode.name(), props);
    }

    clone() {
        return new CeilNode(this.props);
    }

    static name() {
        return 'Round Up';
    }

    static default(props: NodeProps) {
        return new CeilNode(props);
    }
}
