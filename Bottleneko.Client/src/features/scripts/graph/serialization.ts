import { NekoNode, nodeList } from './nodes';
import { NodeSerializationData } from './nodes/NekoNodeBase';

export async function deserializeNode(data: NodeSerializationData): Promise<NekoNode | undefined> {
    const node = nodeList.map(node => node.default({ })).find(node => node.type === data.type);
    await node?.deserialize(data.state as never);
    return node;
}
