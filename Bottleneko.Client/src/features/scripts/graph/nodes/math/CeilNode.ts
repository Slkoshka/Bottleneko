import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class CeilNode extends UnaryMathOpNode {
    type = 'ceil';

    constructor(props: NodeProps) {
        super(CeilNode.name(), props);
    }

    static name() {
        return 'Round Up';
    }

    static default(props: NodeProps) {
        return new CeilNode(props);
    }
}
