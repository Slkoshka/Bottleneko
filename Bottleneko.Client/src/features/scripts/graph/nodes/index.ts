import { MessageReceivedNode } from './events/MessageReceivedNode';
import { TestNode } from './TestNode';
import { IfNode } from './control/IfNode';
import { SplitStructureNode } from './utils/SplitStructureNode';
import { SwitchNode } from './control/SwitchNode';
import { IfValidNode } from './control/IfValidNode';

export type AnyNekoNode = TestNode | MessageReceivedNode | IfNode | IfValidNode | SwitchNode | SplitStructureNode;

export interface NekoNodeConstructor {
    default: () => AnyNekoNode;
    name: () => string;
};

export const nodes: Record<string, NekoNodeConstructor[]> = {
    '': [],
    'Events': [
        MessageReceivedNode,
    ],
    'Control': [
        IfNode,
        IfValidNode,
        SwitchNode,
    ],
    'Utilities': [
        SplitStructureNode,
        TestNode,
    ],
};
