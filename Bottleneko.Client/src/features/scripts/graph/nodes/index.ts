import { MessageReceivedNode } from './events/MessageReceivedNode';
import { IfNode } from './control/IfNode';
import { SplitStructureNode } from './utils/SplitStructureNode';
import { SwitchNode } from './control/SwitchNode';
import { IfValidNode } from './control/IfValidNode';
import { FormatTextNode } from './text/FormatTextNode';
import { NodeProps } from './NekoNodeBase';
import { LogMessageNode } from './utils/LogMessageNode';
import { ConcatNode } from './text/ConcatNode';

export type ControlNode =
    IfNode |
    IfValidNode |
    SwitchNode;

export type EventNode =
    MessageReceivedNode;

export type TextNode =
    ConcatNode |
    FormatTextNode;

export type UtilsNode =
    LogMessageNode |
    SplitStructureNode;

export type NekoNode =
    ControlNode |
    EventNode |
    TextNode |
    UtilsNode;

export interface NekoNodeConstructor {
    default: (props: NodeProps) => NekoNode;
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
    ['Text Operations', [
        node(ConcatNode),
        node(FormatTextNode),
    ]],
    ['Utilities', [
        node(SplitStructureNode),
        node(LogMessageNode),
    ]],
];
