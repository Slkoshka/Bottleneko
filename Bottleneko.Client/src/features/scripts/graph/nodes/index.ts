import { MessageReceivedNode } from './events/MessageReceivedNode';
import { IfNode } from './control/IfNode';
import { SplitStructureNode } from './utils/SplitStructureNode';
import { SwitchNode } from './control/SwitchNode';
import { IfValidNode } from './control/IfValidNode';
import { FormatTextNode } from './text/FormatTextNode';
import { NodeProps } from './NekoNodeBase';
import { LogMessageNode } from './utils/LogMessageNode';
import { ConcatNode } from './text/ConcatNode';
import { AddNode } from './math/AddNode';
import { SubtractNode } from './math/SubtractNode';
import { MultiplyNode } from './math/MultiplyNode';
import { DivideNode } from './math/DivideNode';
import { RemainderNode } from './math/RemainderNode';
import { NegateNode } from './math/NegateNode';
import { PowerNode } from './math/PowerNode';
import { SqrtNode } from './math/SqrtNode';
import { FloorNode } from './math/FloorNode';
import { CeilNode } from './math/CeilNode';
import { RoundNode } from './math/RoundNode';
import { LogNode } from './math/LogNode';
import { Log2Node } from './math/Log2Node';
import { Log10Node } from './math/Log10Node';
import { MinNode } from './math/MinNode';
import { MaxNode } from './math/MaxNode';
import { AverageNode } from './math/AverageNode';
import { RandomRangeNode } from './math/RandomRangeNode';
import { RandomNumberNode } from './math/RandomNumberNode';
import { SwitchOnSignNode } from './math/SwitchOnSignNode';
import { SignNode } from './math/SignNode';
import { CheckNumberNode } from './math/CheckNumberNode';

export type ControlNode =
    IfNode |
    IfValidNode |
    SwitchNode;

export type EventNode =
    MessageReceivedNode;

export type MathNode =
    AddNode |
    SubtractNode |
    MultiplyNode |
    DivideNode |
    RemainderNode |
    NegateNode |
    PowerNode |
    SqrtNode |
    FloorNode |
    CeilNode |
    RoundNode |
    LogNode |
    Log2Node |
    Log10Node |
    MinNode |
    MaxNode |
    AverageNode |
    RandomRangeNode |
    RandomNumberNode |
    SwitchOnSignNode |
    SignNode |
    CheckNumberNode;

export type TextNode =
    ConcatNode |
    FormatTextNode;

export type UtilsNode =
    LogMessageNode |
    SplitStructureNode;

export type NekoNode =
    ControlNode |
    EventNode |
    MathNode |
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
    ['Math', [
        node(AddNode),
        node(SubtractNode),
        node(MultiplyNode),
        node(DivideNode),
        node(RemainderNode),
        node(PowerNode),
        node(SqrtNode),
        node(FloorNode),
        node(CeilNode),
        node(RoundNode),
        node(LogNode),
        node(Log2Node),
        node(Log10Node),
        node(MinNode),
        node(MaxNode),
        node(AverageNode),
        node(RandomRangeNode),
        node(RandomNumberNode),
        node(SwitchOnSignNode),
        node(SignNode),
        node(CheckNumberNode),
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
