import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class DivideNode extends BinaryMathOpNode {
    constructor(props: NodeProps) {
        super(DivideNode.name(), props, { leftName: 'Divident', rightName: 'Divisor' });
    }

    clone() {
        return new DivideNode(this.props);
    }

    static name() {
        return 'Divide';
    }

    static default(props: NodeProps) {
        return new DivideNode(props);
    }
}
