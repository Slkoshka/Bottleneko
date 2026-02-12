using System.Collections.Immutable;
using System.Text;
using Bottleneko.SourceGenerator.Source;
using Bottleneko.SourceGenerator.Source.Expressions;
using Bottleneko.SourceGenerator.Source.Statements;
using Bottleneko.SourceGenerator.Source.Types;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace Bottleneko.SourceGenerator;

[Generator]
public class RpcContractGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        var rpcMethodInfo = SourceFile.Generate("Bottleneko.Api.Rpc", new RecordDeclaration("RpcMethod", [("RpcService", "Service"), ("string", "MethodName"), ("Type", "RequestType"), ("Type", "ResponseType")])
        {
            AccessModifier = AccessModifierType.Public,
            Attributes =
            {
                "Bottleneko.Api.Hidden",
            },
        });

        context.RegisterPostInitializationOutput(ctx => ctx.AddSource("RpcMethod.cs", SourceText.From(rpcMethodInfo, Encoding.UTF8)));

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

    record RpcMethodDefinition(string Name, RecordDeclaration Request, RecordDeclaration Response, SwitchCase ExecuteCase, IExpression MethodInfoExpression);

    private static RpcMethodDefinition ExtractMethodInfo(string serviceType, IMethodSymbol methodSymbol)
    {
        var methodName = methodSymbol.Name.EndsWith("Async") ? methodSymbol.Name.Substring(0, methodSymbol.Name.Length - "Async".Length) : methodSymbol.Name;
        var isAsyncMethod = methodSymbol.ReturnType.TypeKind == TypeKind.Class && methodSymbol.ReturnType.ContainingNamespace?.ToDisplayString() == "System.Threading.Tasks" && (methodSymbol.ReturnType.Name == "Task" || methodSymbol.ReturnType.Name == "ValueTask");
        var returnType = methodSymbol.ReturnType.SpecialType == SpecialType.System_Void ? null : methodSymbol.ReturnType.ToDisplayString();

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
        
        if (methodSymbol.Parameters.Length == 0 || methodSymbol.Parameters[0].Type.ToDisplayString() != "Bottleneko.Api.Rpc.IRpcContext")
        {
            throw new Exception("First argument of RpcService should have IRpcContext type");
        }

        var request = new RecordDeclaration($"{serviceType}{methodName}Request", [..methodSymbol.Parameters.Skip(1).Select(parameter => (Type: parameter.Type.ToDisplayString(), Name: Capitalize(parameter.Name)))])
        {
            BaseTypes = { "Bottleneko.Api.Rpc.RpcRequest" },
        };
        var response = new RecordDeclaration($"{serviceType}{methodName}Response", returnType is null ? null : [(Type: returnType, Name: "Result")])
        {
            BaseTypes = { "Bottleneko.Api.Rpc.RpcResponse" },
        };

        var callMethod = new CallExpression($"this.{methodSymbol.Name}")
        {
            Arguments =
            [
                new IdentifierExpression("context"),
                ..methodSymbol.Parameters.Skip(1).Select(parameter => new IdentifierExpression($"request{methodName}.{Capitalize(parameter.Name)}")),
            ],
        };
        IExpression resultExpression = isAsyncMethod ? new AwaitExpression(callMethod) : callMethod;
        IStatement resultStatement = returnType is null ? new ExpressionStatement(resultExpression) : new VariableDeclaration("var", "result", resultExpression);

        var returnStatement = new ReturnStatement(new NewExpression("Bottleneko.Api.Rpc.ResponsePacket")
        {
            Arguments =
            {
                new IdentifierExpression("packet.RequestId"),
                new NewExpression("Bottleneko.Api.Rpc.SuccessResult")
                {
                    Arguments =
                    {
                        returnType is null ? new NewExpression($"{serviceType}{methodName}Response") : new NewExpression($"{serviceType}{methodName}Response")
                        {
                            Arguments =
                            {
                                new IdentifierExpression("result"),
                            },
                        },
                    },
                },
            },
        });

        var @case = new SwitchCase(new($"{request.Name}{(methodSymbol.Parameters.Length == 1 ? "" : $" request{methodName}")}"), Body:
        [
            resultStatement,
            returnStatement,
        ]);

        var methodInfoExpression = new NewExpression("Bottleneko.Api.Rpc.RpcMethod")
        {
            Arguments =
            [
                new IdentifierExpression($"Bottleneko.Api.Rpc.RpcService.{serviceType}"),
                new StringExpression(methodName),
                new TypeofExpression(request.Name),
                new TypeofExpression(response.Name),
            ],
        };

        return new(methodName, request, response, @case, methodInfoExpression);
    }

    private static void Execute(Compilation _, ImmutableArray<INamedTypeSymbol> interfaces, SourceProductionContext spc)
    {
        foreach (var interfaceSymbol in interfaces.OrderBy(@interface => @interface.ToDisplayString()))
        {
            if (interfaceSymbol.GetAttributes().FirstOrDefault(attr => attr.AttributeClass?.ContainingNamespace.ToDisplayString() == "Bottleneko.Api.Rpc" && attr.AttributeClass?.Name == "RpcServiceAttribute") is not { } serviceAttribute)
            {
                continue;
            }

            if (serviceAttribute.ConstructorArguments[0].Type?.TypeKind != TypeKind.Enum || serviceAttribute.ConstructorArguments[0].Type is not INamedTypeSymbol serviceTypeEnum)
            {
                continue;
            }

            var serviceTypes = serviceTypeEnum.GetMembers().Where(member => member is IFieldSymbol { ConstantValue: not null }).Cast<IFieldSymbol>().ToImmutableDictionary(x => (int)x.ConstantValue!, x => x.Name);
            var serviceType = serviceTypes[(int)serviceAttribute.ConstructorArguments[0].Value!];

            var methods = interfaceSymbol
                .GetMembers()
                .Where(member => member is IMethodSymbol { MethodKind: MethodKind.Ordinary, DeclaredAccessibility: Accessibility.Public, IsStatic: false } methodSymbol)
                .Cast<IMethodSymbol>()
                .Select(methodSymbol => ExtractMethodInfo(serviceType, methodSymbol))
                .OrderBy(method => method.Name);

            var @interface = new InterfaceDeclaration(interfaceSymbol.Name)
            {
                AccessModifier = AccessModifierType.Public,
                IsPartial = true,
                BaseTypes =
                [
                    "Bottleneko.Api.Rpc.IRpcService",
                ],
                Members =
                [
                    ..methods.SelectMany<RpcMethodDefinition, IMemberDeclaration>(method => [method.Request, method.Response]),
                    new MethodDeclaration("Task<Bottleneko.Api.Rpc.ResponsePacket>", "Bottleneko.Api.Rpc.IRpcService.ExecuteAsync", [("Bottleneko.Api.Rpc.IRpcContext", "context"), ("Bottleneko.Api.Rpc.RequestPacket", "packet")])
                    {
                        IsAsync = true,
                        Body =
                        [
                            new SwitchStatement(new IdentifierExpression("packet.Request"))
                            {
                                Cases =
                                [
                                    ..methods.Select(method => method.ExecuteCase),
                                ],
                                Default = [new ReturnStatement(new NewExpression("Bottleneko.Api.Rpc.ResponsePacket")
                                {
                                    Arguments =
                                    [
                                        new IdentifierExpression("packet.RequestId"),
                                        new NewExpression("Bottleneko.Api.Rpc.ErrorResult")
                                        {
                                            Arguments =
                                            {
                                                new IdentifierExpression("Bottleneko.Api.Rpc.ErrorCode.Unsupported"),
                                                new StringExpression("Unknown method"),
                                            }
                                        },
                                    ],
                                })],
                            },
                        ],
                    },

                    new MethodDeclaration("bool", "Bottleneko.Api.Rpc.IRpcService.IsMethodSupported", [("Bottleneko.Api.Rpc.RequestPacket", "packet")])
                    {
                        Body =
                        [
                            new SwitchStatement(new IdentifierExpression("packet.Request"))
                            {
                                Cases =
                                [
                                    ..methods.Select(method => new SwitchCase(new(method.Request.Name), Body: [new ReturnStatement(new BooleanExpression(true))])),
                                ],
                                Default = [new ReturnStatement(new BooleanExpression(false))],
                            },
                        ],
                    },

                    new MethodDeclaration("Bottleneko.Api.Rpc.RpcMethod[]", "GetMethods", [])
                    {
                        Type = MethodType.Static,
                        Body =
                        [
                            new ReturnStatement(new CollectionExpression(methods.Select(method => method.MethodInfoExpression))),
                        ],
                    },
                ],
            };

            var source = SourceFile.Generate([
                interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false ? new ScopedNamespace(interfaceSymbol.ContainingNamespace.ToDisplayString(), @interface) : @interface,

                new ScopedNamespace("Bottleneko.Api.Rpc")
                {
                    new RecordDeclaration("RpcRequest", null)
                    {
                        AccessModifier = AccessModifierType.Public,
                        IsPartial = true,
                        Attributes = [.. methods.Select(method =>
                            new AttributeSpecifier("System.Text.Json.Serialization.JsonDerivedType")
                            {
                                Arguments =
                                [
                                    new TypeofExpression($"{(interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false ? $"{interfaceSymbol.ContainingNamespace.ToDisplayString()}." : "")}{interfaceSymbol.Name}.{method.Request.Name}"),
                                    new StringExpression($"{serviceType}/{method.Name}"),
                                ],
                            }
                        )],
                    },

                    new RecordDeclaration("RpcResponse", null)
                    {
                        AccessModifier = AccessModifierType.Public,
                        IsPartial = true,
                        Attributes = [.. methods.Select(method =>
                            new AttributeSpecifier("System.Text.Json.Serialization.JsonDerivedType")
                            {
                                Arguments =
                                [
                                    new TypeofExpression($"{(interfaceSymbol.ContainingNamespace?.IsGlobalNamespace == false ? $"{interfaceSymbol.ContainingNamespace.ToDisplayString()}." : "")}{interfaceSymbol.Name}.{method.Response.Name}"),
                                    new StringExpression($"{serviceType}/{method.Name}"),
                                ]
                            }
                        )],
                    },
                },
            ]);

            spc.AddSource($"{interfaceSymbol.Name}_Contract.cs", SourceText.From(source, Encoding.UTF8));
        }
    }
}
