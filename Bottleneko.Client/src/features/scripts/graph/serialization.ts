import { NodeEditor } from 'rete';
import { BaseAreaPlugin } from 'rete-area-plugin';
import { GraphConnection, GraphNode, GraphNodeData, GraphScriptCode } from '../../api/dtos.gen';
import { NekoNode, nodeList } from './nodes';
import { Schemes } from './editor';
import NekoConnection from './connections/NekoConnection';

export async function deserializeNode(editor: NodeEditor<Schemes>, area: BaseAreaPlugin<Schemes, unknown>, data: GraphNodeData): Promise<NekoNode | undefined> {
    const node = nodeList.map(node => node.default({ editor, area })).find(node => node.type === data.$type);
    await node?.deserialize(data as never);
    return node;
}

export async function deserializeEditor(editor: NodeEditor<Schemes>, area: BaseAreaPlugin<Schemes, unknown>, data: GraphScriptCode): Promise<void> {
    await editor.clear();

    const nodes = new Map<string, NekoNode>();
    for (const serializedNode of data.nodes) {
        const node = await deserializeNode(editor, area, serializedNode.data);
        if (!node) {
            continue;
        }
        node.id = serializedNode.id;
        await area.translate(node.id, serializedNode.position);
        nodes.set(node.id, node);
    }
    for (const serializedConnection of data.connections) {
        const sourceNode = nodes.get(serializedConnection.source.nodeId);
        const targetNode = nodes.get(serializedConnection.target.nodeId);
        if (!sourceNode || !targetNode) {
            continue;
        }
        const connection = new NekoConnection(sourceNode, serializedConnection.source.portId as never, targetNode, serializedConnection.target.portId as never);
        connection.id = serializedConnection.id;
        await editor.addConnection(connection);
    }
}

export function serializeNode(area: BaseAreaPlugin<Schemes, unknown>, node: NekoNode): GraphNode | undefined {
    const position = area.nodeViews.get(node.id)?.position;
    if (!position) {
        return undefined;
    }

    return {
        id: node.id,
        position,
        data: node.serialize(),
    };
}

export function serializeConnection(connection: NekoConnection): GraphConnection | undefined {
    if (connection.isPseudo as boolean) {
        return undefined;
    }

    return {
        id: connection.id,
        source: {
            nodeId: connection.source,
            portId: connection.sourceOutput,
        },
        target: {
            nodeId: connection.target,
            portId: connection.targetInput,
        },
    };
}

export function serializeEditor(editor: NodeEditor<Schemes>, area: BaseAreaPlugin<Schemes, unknown>): GraphScriptCode {
    return {
        $type: 'Graph',
        nodes: editor.getNodes().map(node => serializeNode(area, node)).filter(serialized => serialized !== undefined),
        connections: editor.getConnections().map(connection => serializeConnection(connection)).filter(serialized => serialized !== undefined),
    };
}
