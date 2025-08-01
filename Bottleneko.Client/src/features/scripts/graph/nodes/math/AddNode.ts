import { GraphAddNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AddNode extends AnyArityMathOpNode<GraphAddNodeData> {
    type = 'add' as const;

    constructor(props: NodeProps) {
        super(AddNode.name(), { }, props);
    }

    static name() {
        return 'Add';
    }

    static default(props: NodeProps) {
        return new AddNode(props);
    }
}
