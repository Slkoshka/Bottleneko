import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AddNode extends AnyArityMathOpNode {
    type = 'add';

    constructor(props: NodeProps) {
        super(AddNode.name(), props);
    }

    static name() {
        return 'Add';
    }

    static default(props: NodeProps) {
        return new AddNode(props);
    }
}
