import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AddNode extends AnyArityMathOpNode {
    constructor(props: NodeProps) {
        super(AddNode.name(), props);
    }

    clone() {
        return new AddNode(this.props);
    }

    static name() {
        return 'Add';
    }

    static default(props: NodeProps) {
        return new AddNode(props);
    }
}
