import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class DivideNode extends BinaryMathOpNode {
    type = 'divide';

    constructor(props: NodeProps) {
        super(DivideNode.name(), props, { leftName: 'Divident', rightName: 'Divisor' });
    }

    static name() {
        return 'Divide';
    }

    static default(props: NodeProps) {
        return new DivideNode(props);
    }
}
