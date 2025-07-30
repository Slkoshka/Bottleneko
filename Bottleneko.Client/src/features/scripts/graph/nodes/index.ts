import { MessageReceivedNode } from './events/MessageReceivedNode';
import { TestNode } from './TestNode';
import { IfNode } from './control/IfNode';
import { SplitStructureNode } from './utils/SplitStructureNode';
import { SwitchNode } from './control/SwitchNode';
import { IfValidNode } from './control/IfValidNode';

export type NekoNode = TestNode | MessageReceivedNode | IfNode | IfValidNode | SwitchNode | SplitStructureNode;

export interface NekoNodeConstructor {
    default: () => NekoNode;
    name: () => string;
};

export type NodeCollectionItem = [string, NekoNodeConstructor | NodeCollectionItem[]];
export type NodeCollection = NodeCollectionItem[];

const node = (type: NekoNodeConstructor): [string, NekoNodeConstructor] => [type.name(), type];

export const nodes: NodeCollection = [
    ['Events', [
        node(MessageReceivedNode),
    ]],
    ['Control', [
        node(IfNode),
        node(IfValidNode),
        node(SwitchNode),
    ]],
    ['Utilities', [
        node(SplitStructureNode),
        node(TestNode),
    ]],
];
