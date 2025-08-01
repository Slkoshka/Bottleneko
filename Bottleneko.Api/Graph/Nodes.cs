using Bottleneko.Logging;
using System.Text.Json.Serialization;

namespace Bottleneko.Api.Graph;

// Control nodes
public record GraphIfNodeData() : GraphNodeData;
public record GraphIfValidNodeData() : GraphNodeData;
public record GraphSwitchNodeData(GraphSocketType? InputType) : GraphNodeData;

// Event nodes
public record GraphMessageReceivedNodeData() : GraphNodeData;

// Math nodes
public record GraphAddNodeData() : GraphNodeData;
public record GraphAverageNodeData() : GraphNodeData;
public record GraphCeilNodeData() : GraphNodeData;
public record GraphCheckNumberNodeData() : GraphNodeData;
public record GraphDivideNodeData() : GraphNodeData;
public record GraphFloorNodeData() : GraphNodeData;
public record GraphLog2NodeData() : GraphNodeData;
public record GraphLog10NodeData() : GraphNodeData;
public record GraphLogNodeData() : GraphNodeData;
public record GraphMaxNodeData() : GraphNodeData;
public record GraphMinNodeData() : GraphNodeData;
public record GraphMultiplyNodeData() : GraphNodeData;
public record GraphNegateNodeData() : GraphNodeData;
public record GraphPowerNodeData() : GraphNodeData;
public record GraphRandomNumberNodeData() : GraphNodeData;
public record GraphRandomRangeNodeData(bool Integers) : GraphNodeData;
public record GraphRemainderNodeData() : GraphNodeData;
public record GraphRoundNodeData() : GraphNodeData;
public record GraphSignNodeData() : GraphNodeData;
public record GraphSqrtNodeData() : GraphNodeData;
public record GraphSubtractNodeData() : GraphNodeData;
public record GraphSwitchOnSignNodeData() : GraphNodeData;

// Text Operations nodes
public record GraphConcatNodeData(int Inputs) : GraphNodeData;
public record GraphFormatTextNodeData(string Format) : GraphNodeData;

// Utilities nodes
public record GraphLogMessageNodeData(LogSeverity Severity) : GraphNodeData;
public record GraphSplitStructureNodeData(GraphSocketType? InputType) : GraphNodeData;

[JsonDerivedType(typeof(GraphIfNodeData), "if")]
[JsonDerivedType(typeof(GraphIfValidNodeData), "if-valid")]
[JsonDerivedType(typeof(GraphSwitchNodeData), "switch")]
[JsonDerivedType(typeof(GraphMessageReceivedNodeData), "message-received-event")]
[JsonDerivedType(typeof(GraphAddNodeData), "add")]
[JsonDerivedType(typeof(GraphAverageNodeData), "average")]
[JsonDerivedType(typeof(GraphCeilNodeData), "ceil")]
[JsonDerivedType(typeof(GraphCheckNumberNodeData), "check-number")]
[JsonDerivedType(typeof(GraphDivideNodeData), "divide")]
[JsonDerivedType(typeof(GraphFloorNodeData), "floor")]
[JsonDerivedType(typeof(GraphLog2NodeData), "log2")]
[JsonDerivedType(typeof(GraphLog10NodeData), "log10")]
[JsonDerivedType(typeof(GraphLogNodeData), "log")]
[JsonDerivedType(typeof(GraphMaxNodeData), "max")]
[JsonDerivedType(typeof(GraphMinNodeData), "min")]
[JsonDerivedType(typeof(GraphMultiplyNodeData), "multiply")]
[JsonDerivedType(typeof(GraphNegateNodeData), "negate")]
[JsonDerivedType(typeof(GraphPowerNodeData), "power")]
[JsonDerivedType(typeof(GraphRandomNumberNodeData), "random-number")]
[JsonDerivedType(typeof(GraphRandomRangeNodeData), "random-range")]
[JsonDerivedType(typeof(GraphRemainderNodeData), "remainder")]
[JsonDerivedType(typeof(GraphRoundNodeData), "round")]
[JsonDerivedType(typeof(GraphSignNodeData), "sign")]
[JsonDerivedType(typeof(GraphSqrtNodeData), "sqrt")]
[JsonDerivedType(typeof(GraphSubtractNodeData), "subtract")]
[JsonDerivedType(typeof(GraphSwitchOnSignNodeData), "switch-on-sign")]
[JsonDerivedType(typeof(GraphConcatNodeData), "concat")]
[JsonDerivedType(typeof(GraphFormatTextNodeData), "format-text")]
[JsonDerivedType(typeof(GraphLogMessageNodeData), "log-message")]
[JsonDerivedType(typeof(GraphSplitStructureNodeData), "split-structure")]
public abstract record GraphNodeData();
