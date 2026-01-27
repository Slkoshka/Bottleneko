using System.Collections.Immutable;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace Bottleneko.SourceGenerator;

[Generator]
public class RpcContractGenerator : IIncrementalGenerator
{
    private const string ATTRIBUTE_SOURCE = @"namespace Bottleneko.Api.Rpc;

[AttributeUsage(AttributeTargets.Interface, AllowMultiple = false)]
public class RpcServiceAttribute(RpcService service) : System.Attribute
{
    public RpcService Service { get; } = service;
}
";

    private const string METHOD_INFO_SOURCE = @"namespace Bottleneko.Api.Rpc;

[Hidden]
public record RpcMethod(RpcService Service, string MethodName, Type RequestType, Type ResponseType);
";

    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        context.RegisterPostInitializationOutput(ctx => ctx.AddSource("RpcServiceAttribute.cs", SourceText.From(ATTRIBUTE_SOURCE, Encoding.UTF8)));
        context.RegisterPostInitializationOutput(ctx => ctx.AddSource("RpcMethod.cs", SourceText.From(METHOD_INFO_SOURCE, Encoding.UTF8)));

        var interfaceSymbols = context.SyntaxProvider
            .ForAttributeWithMetadataName("Bottleneko.Api.Rpc.RpcServiceAttribute", static (node, _) => node is InterfaceDeclarationSyntax, static (ctx, _) => (INamedTypeSymbol)ctx.TargetSymbol)
            .Where(static symbol => symbol is not null)!;

        IncrementalValueProvider<(Compilation Compilation, ImmutableArray<INamedTypeSymbol> Interfaces)> interfaces = context.CompilationProvider.Combine(interfaceSymbols.Collect());
        context.RegisterSourceOutput(interfaces, static (spc, source) => Execute(source.Compilation, source.Interfaces, spc));
    }
    
    private static string Capitalize(string s)
    {
        return $"{char.ToUpperInvariant(s[0])}{s.Substring(1)}";
    }

    private static void Execute(Compilation compilation, ImmutableArray<INamedTypeSymbol> interfaces, SourceProductionContext spc)
    {
        foreach (var interfaceSymbol in interfaces)
        {
            if (interfaceSymbol.GetAttributes().FirstOrDefault(attr => attr.AttributeClass?.ContainingNamespace.ToDisplayString() == "Bottleneko.Api.Rpc" && attr.AttributeClass?.Name == "RpcServiceAttribute") is not { } serviceAttribute)
            {
                continue;
            }

            var contract = new StringBuilder();
            var execute = new StringBuilder();
            var methodList = new StringBuilder();

            if (serviceAttribute.ConstructorArguments[0].Type?.TypeKind != TypeKind.Enum || serviceAttribute.ConstructorArguments[0].Type is not INamedTypeSymbol serviceTypeEnum)
            {
                continue;
            }

            var serviceTypes = serviceTypeEnum.GetMembers().Where(member => member is IFieldSymbol { ConstantValue: not null }).Cast<IFieldSymbol>().ToImmutableDictionary(x => (int)x.ConstantValue!, x => x.Name);
            var serviceType = serviceTypes[(int)serviceAttribute.ConstructorArguments[0].Value!];

            if (interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false)
            {
                contract.AppendLine($"namespace {interfaceSymbol.ContainingNamespace.ToDisplayString()}");
                contract.AppendLine("{");
            }

            contract.AppendLine($"    public partial interface {interfaceSymbol.Name} : Bottleneko.Api.Rpc.IRpcService");
            contract.AppendLine("    {");

            var methods = new List<string>();

            foreach (var member in interfaceSymbol.GetMembers())
            {
                if (member is IMethodSymbol { MethodKind: MethodKind.Ordinary, DeclaredAccessibility: Accessibility.Public, IsStatic: false } methodSymbol)
                {
                    var methodName = methodSymbol.Name.EndsWith("Async") ? methodSymbol.Name.Substring(0, methodSymbol.Name.Length - "Async".Length) : methodSymbol.Name;
                    var isAsyncMethod = methodSymbol.ReturnType.TypeKind == TypeKind.Class && methodSymbol.ReturnType.ContainingNamespace?.ToDisplayString() == "System.Threading.Tasks" && (methodSymbol.ReturnType.Name == "Task" || methodSymbol.ReturnType.Name == "ValueTask");
                    var returnType = methodSymbol.ReturnType.SpecialType == SpecialType.System_Void ? null : methodSymbol.ReturnType.ToDisplayString();

                    methods.Add(methodName);

                    if (isAsyncMethod)
                    {
                        if (methodSymbol.ReturnType is INamedTypeSymbol namedReturnTypeSymbol && namedReturnTypeSymbol.IsGenericType && namedReturnTypeSymbol.TypeArguments.Length == 1)
                        {
                            // Generic [Value]Task
                            returnType = namedReturnTypeSymbol.TypeArguments[0].ToDisplayString();
                        }
                        else
                        {
                            // Non-generic [Value]Task
                            returnType = null;
                        }
                    }
                    
                    var isVoidMethod = returnType is null;

                    contract.AppendLine($"        public record {methodName}Request({string.Join(", ", methodSymbol.Parameters.Select(parameter => $"{parameter.Type.ToDisplayString()} {Capitalize(parameter.Name)}"))}) : Bottleneko.Api.Rpc.RpcRequest;");
                    contract.AppendLine($"        public record {methodName}Response({(isVoidMethod ? "" : $"{returnType} Result")}) : Bottleneko.Api.Rpc.RpcResponse;");

                    execute.AppendLine($"                case {methodName}Request{(methodSymbol.Parameters.Length == 0 ? "" : $" request{methodName}")}:");
                    execute.AppendLine("                {");
                    if (isVoidMethod && !isAsyncMethod)
                    {
                        execute.AppendLine($"                    this.{methodSymbol.Name}({string.Join(", ", methodSymbol.Parameters.Select(parameter => $"request{methodName}.{Capitalize(parameter.Name)}"))});");
                    }
                    else
                    {
                        execute.AppendLine($"                    var result{(isAsyncMethod ? "Task" : "")} = this.{methodSymbol.Name}({string.Join(", ", methodSymbol.Parameters.Select(parameter => $"request{methodName}.{Capitalize(parameter.Name)}"))});");
                    }

                    if (isAsyncMethod)
                    {
                        if (isVoidMethod)
                        {
                            execute.AppendLine("                    await resultTask;");
                        }
                        else
                        {
                            execute.AppendLine("                    var result = await resultTask;");
                        }
                    }

                    if (isVoidMethod)
                    {
                        execute.AppendLine($"                    return new(packet.RequestId, new Bottleneko.Api.Rpc.SuccessResult(new {methodName}Response()));");
                    }
                    else
                    {
                        execute.AppendLine($"                    return new(packet.RequestId, new Bottleneko.Api.Rpc.SuccessResult(new {methodName}Response(result)));");
                    }
                    execute.AppendLine("                }");
                    execute.AppendLine();

                    methodList.AppendLine($"                new(Bottleneko.Api.Rpc.RpcService.{serviceType}, \"{methodName}\", typeof({methodName}Request), typeof({methodName}Response)),");
                }
            }

            contract.AppendLine($"        async Task<Bottleneko.Api.Rpc.ResponsePacket> Bottleneko.Api.Rpc.IRpcService.ExecuteAsync(Bottleneko.Api.Rpc.RequestPacket packet)");
            contract.AppendLine("        {");
            contract.AppendLine("            switch (packet.Request)");
            contract.AppendLine("            {");
            contract.Append(execute.ToString());
            contract.AppendLine("                default:");
            contract.AppendLine("                    return new(packet.RequestId, new Bottleneko.Api.Rpc.ErrorResult(\"Unknown method\"));");
            contract.AppendLine("            }");
            contract.AppendLine("        }");
            contract.AppendLine();

            contract.AppendLine($"        bool Bottleneko.Api.Rpc.IRpcService.IsMethodSupported(Bottleneko.Api.Rpc.RequestPacket packet)");
            contract.AppendLine("        {");
            contract.AppendLine("            switch (packet.Request)");
            contract.AppendLine("            {");
            foreach (var method in methods)
            {
                contract.AppendLine($"                case {method}Request:");
                contract.AppendLine("                    return true;");
            }
            contract.AppendLine("                default:");
            contract.AppendLine("                    return false;");
            contract.AppendLine("            }");
            contract.AppendLine("        }");
            contract.AppendLine();

            contract.AppendLine($"        static Bottleneko.Api.Rpc.RpcMethod[] GetMethods()");
            contract.AppendLine("        {");
            contract.AppendLine("            return [");
            contract.Append(methodList.ToString());
            contract.AppendLine("            ];");
            contract.AppendLine("        }");
            contract.AppendLine("    }");

            if (interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false)
            {
                contract.AppendLine("}");
            }

            contract.AppendLine();
            contract.AppendLine("namespace Bottleneko.Api.Rpc");
            contract.AppendLine("{");
            foreach (var method in methods)
            {
                contract.AppendLine($"    [System.Text.Json.Serialization.JsonDerivedType(typeof({(interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false ? $"{interfaceSymbol.ContainingNamespace.ToDisplayString()}." : "")}{interfaceSymbol.Name}.{method}Request), \"{serviceType}/{method}\")]");
            }
            contract.AppendLine("    public partial record RpcRequest;");

            contract.AppendLine();

            foreach (var method in methods)
            {
                contract.AppendLine($"    [System.Text.Json.Serialization.JsonDerivedType(typeof({(interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false ? $"{interfaceSymbol.ContainingNamespace.ToDisplayString()}." : "")}{interfaceSymbol.Name}.{method}Response), \"{serviceType}/{method}\")]");
            }
            contract.AppendLine("    public partial record RpcResponse;");
            contract.AppendLine("}");

            spc.AddSource($"{interfaceSymbol.Name}_Contract.cs", SourceText.From(contract.ToString(), Encoding.UTF8));
        }
    }
}
