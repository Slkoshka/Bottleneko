using Bottleneko.Api.Dtos;

namespace Bottleneko.Api.Graph;

public record GraphNodePortRef(string NodeId, string PortId);

public record GraphNodePosition(float X, float Y);

public record GraphNode(string Id, GraphNodePosition Position, GraphNodeData Data);

public record GraphConnection(string Id, GraphNodePortRef Source, GraphNodePortRef Target);

public record GraphScriptCode(GraphNode[] Nodes, GraphConnection[] Connections) : ScriptCode;

