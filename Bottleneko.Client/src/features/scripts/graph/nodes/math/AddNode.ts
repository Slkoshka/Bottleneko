import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AddNode extends AnyArityMathOpNode {
    constructor(initial: number, props: NodeProps) {
        super(AddNode.name(), initial, props);
    }

    clone() {
        return new AddNode(this.controls.inputs.value, this.props);
    }

    static name() {
        return 'Add';
    }

    static default(props: NodeProps) {
        return new AddNode(2, props);
    }
}
