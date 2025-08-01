import { NekoControl } from '../controls/NekoControl';
import { NekoSocket } from '../sockets';
import { MessageReceivedNode } from './events/MessageReceivedNode';
import { IfNode } from './control/IfNode';
import { SplitStructureNode } from './utils/SplitStructureNode';
import { SwitchNode } from './control/SwitchNode';
import { IfValidNode } from './control/IfValidNode';
import { FormatTextNode } from './text-ops/FormatTextNode';
import { NekoNodeBase, NodeProps } from './NekoNodeBase';
import { LogMessageNode } from './utils/LogMessageNode';
import { ConcatNode } from './text-ops/ConcatNode';
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

// export type ControlNode =
//     IfNode |
//     IfValidNode |
//     SwitchNode;

// export type EventNode =
//     MessageReceivedNode;

// export type MathNode =
//     AddNode |
//     SubtractNode |
//     MultiplyNode |
//     DivideNode |
//     RemainderNode |
//     NegateNode |
//     PowerNode |
//     SqrtNode |
//     FloorNode |
//     CeilNode |
//     RoundNode |
//     LogNode |
//     Log2Node |
//     Log10Node |
//     MinNode |
//     MaxNode |
//     AverageNode |
//     RandomRangeNode |
//     RandomNumberNode |
//     SwitchOnSignNode |
//     SignNode |
//     CheckNumberNode;

// export type TextNode =
//     ConcatNode |
//     FormatTextNode;

// export type UtilsNode =
//     LogMessageNode |
//     SplitStructureNode;

// export type NekoNode =
//     ControlNode |
//     EventNode |
//     MathNode |
//     TextNode |
//     UtilsNode;

export type NekoNode = NekoNodeBase<Record<string, NekoSocket> | object, Record<string, NekoSocket> | object, Record<string, NekoControl> | object>;

export interface NekoNodeConstructor {
    default: (props: NodeProps) => NekoNode;
    name: () => string;
};

export type NodeCollectionItem = [string, NekoNodeConstructor | NodeCollectionItem[]];
export type NodeCollection = NodeCollectionItem[];

// const node = (type: NekoNodeConstructor): [string, NekoNodeConstructor] => [type.name(), type];

// export const nodes: NodeCollection = [
//     ['Events', [
//         node(MessageReceivedNode),
//     ]],
//     ['Control', [
//         node(IfNode),
//         node(IfValidNode),
//         node(SwitchNode),
//     ]],
//     ['Math', [
//         node(AddNode),
//         node(SubtractNode),
//         node(MultiplyNode),
//         node(DivideNode),
//         node(RemainderNode),
//         node(NegateNode),
//         node(PowerNode),
//         node(SqrtNode),
//         node(FloorNode),
//         node(CeilNode),
//         node(RoundNode),
//         node(LogNode),
//         node(Log2Node),
//         node(Log10Node),
//         node(MinNode),
//         node(MaxNode),
//         node(AverageNode),
//         node(RandomRangeNode),
//         node(RandomNumberNode),
//         node(SwitchOnSignNode),
//         node(SignNode),
//         node(CheckNumberNode),
//     ]],
//     ['Text Operations', [
//         node(ConcatNode),
//         node(FormatTextNode),
//     ]],
//     ['Utilities', [
//         node(SplitStructureNode),
//         node(LogMessageNode),
//     ]],
// ];

export const nodeList = [
    MessageReceivedNode,
    IfNode,
    IfValidNode,
    SwitchNode,
    AddNode,
    SubtractNode,
    MultiplyNode,
    DivideNode,
    RemainderNode,
    NegateNode,
    PowerNode,
    SqrtNode,
    FloorNode,
    CeilNode,
    RoundNode,
    LogNode,
    Log2Node,
    Log10Node,
    MinNode,
    MaxNode,
    AverageNode,
    RandomRangeNode,
    RandomNumberNode,
    SwitchOnSignNode,
    SignNode,
    CheckNumberNode,
    ConcatNode,
    FormatTextNode,
    SplitStructureNode,
    LogMessageNode,
].sort((a, b) => a.name().localeCompare(b.name()));

const nodesByCategory = new Map<NekoNode['category'], [name: string, type: NekoNodeConstructor][]>();
for (const nodeType of nodeList) {
    const node = nodeType.default({ });
    const category = node.category;
    if (nodesByCategory.has(category)) {
        nodesByCategory.get(category)?.push([nodeType.name(), nodeType]);
    }
    else {
        nodesByCategory.set(category, [[nodeType.name(), nodeType]]);
    }
}

export const nodes: NodeCollection = [
    ...nodesByCategory.get(null) ?? [],
    ['Control', nodesByCategory.get('control') ?? []],
    ['Events', nodesByCategory.get('events') ?? []],
    ['Math', nodesByCategory.get('math') ?? []],
    ['Text Operations', nodesByCategory.get('text-ops') ?? []],
    ['Utilities', nodesByCategory.get('utils') ?? []],
];

// type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// export type NekoNode = ArrayElement<typeof nodeList & NekoNodeConstructor>;
