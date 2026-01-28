using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Bottleneko.Logging;
using Bottleneko.Api.Rpc;
using Bottleneko.Api;

namespace Bottleneko.CodeGenerator;

record TypeDefinition(string Name);
record BuiltinTypeDefinition(string Name) : TypeDefinition(Name);
record EnumDefinition(string Name, string[] Values) : TypeDefinition(Name);
record FieldDefinition(string Name, Type Type, bool IsTask, bool IsArray, bool IsOptional);
record MethodDefinition(string Name, FieldDefinition Return, FieldDefinition[] Arguments);
record StructDefinition(string Name, FieldDefinition[] Fields, MethodDefinition[] Methods) : TypeDefinition(Name);
record UnionSubTypeDefinition(Type Type, string Discriminator);
record UnionDefinition(string Name, UnionSubTypeDefinition[] Types) : TypeDefinition(Name);

public class Generator
{
    private static FieldDefinition ExtractField(string name, Type type, NullabilityInfo nullability)
    {
        var isOptional = false;
        var isArray = false;
        var isTask = false;
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Task<>))
        {
            type = type.GetGenericArguments()[0];
            isTask = true;

        }
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Nullable<>))
        {
            type = type.GetGenericArguments()[0];
            isOptional = true;
        }
        if (type.IsArray)
        {
            if (type.GetArrayRank() > 1)
            {
                throw new Exception($"Multi-dimensional arrays are not supported ({type.FullName}.{name})");
            }
            type = type.GetElementType()!;
            isArray = true;
        }
        if (nullability.WriteState == NullabilityState.Nullable)
        {
            isOptional = true;
        }

        return new FieldDefinition(name, type, isTask, isArray, isOptional);
    }

    private static TypeDefinition GetType(Dictionary<Type, TypeDefinition> types, Type type)
    {
        if (types.TryGetValue(type, out var typeDefinition))
        {
            return typeDefinition;
        }
        else
        {
            throw new Exception($"Unsupported type: {type.FullName}");
        }
    }

    public static void GenerateApi(string definitionsOutput, string? rpcOutput, bool includeImportExtensions)
    {
        var destRpcs = new Dictionary<RpcService, List<(string MethodName, string RequestType, string ResponseType)>>();

        var destTypes = new Dictionary<Type, TypeDefinition>()
        {
            { typeof(bool), new BuiltinTypeDefinition("boolean") },
            { typeof(int), new BuiltinTypeDefinition("number") },
            { typeof(uint), new BuiltinTypeDefinition("number") },
            { typeof(short), new BuiltinTypeDefinition("number") },
            { typeof(ushort), new BuiltinTypeDefinition("number") },
            { typeof(byte), new BuiltinTypeDefinition("number") },
            { typeof(sbyte), new BuiltinTypeDefinition("number") },
            { typeof(float), new BuiltinTypeDefinition("number") },
            { typeof(double), new BuiltinTypeDefinition("number") },
            { typeof(string), new BuiltinTypeDefinition("string") },
            { typeof(DateTime), new BuiltinTypeDefinition("string") },
        };

        void ProcessType(Type type)
        {
            if (type.GetCustomAttribute<HiddenAttribute>() is not null)
            {
                return;
            }

            if (type is { IsEnum: true })
            {
                destTypes.Add(type, new EnumDefinition(type.Name, Enum.GetNames(type)));
            }
            else if (type is { IsClass: true, IsAbstract: true, IsSealed: false, IsGenericType: false } && !type.IsAssignableTo(typeof(Attribute)) && type.GetCustomAttributes<JsonDerivedTypeAttribute>().ToArray() is { Length: > 0 } derivedTypes)
            {
                destTypes.Add(type, new UnionDefinition(type.Name, [.. derivedTypes.Select(derived => new UnionSubTypeDefinition(derived.DerivedType, derived.TypeDiscriminator as string ?? throw new Exception("Invalid type discriminator")))]));
            }
            else if (type is { IsClass: true, IsAbstract: false, IsGenericType: false } && !type.IsAssignableTo(typeof(Attribute)))
            {
                destTypes.Add(type, new StructDefinition(type.Name,
                    [.. type
                        .GetProperties(BindingFlags.Instance | BindingFlags.Public)
                        .Where(property => property is { CanRead: true, IsSpecialName: false } && property.GetCustomAttribute<HiddenAttribute>() is null)
                        .Select(property => ExtractField(property.Name, property.PropertyType, new NullabilityInfoContext().Create(property)))
                    ], []));
            }
            else if (type is { IsInterface: true, IsGenericType: false })
            {
                if (type.GetCustomAttribute<RpcServiceAttribute>() is { } attr)
                {
                    foreach (var method in (type.GetMethod("GetMethods", BindingFlags.Public | BindingFlags.Static)?.Invoke(null, null) as RpcMethod[]) ?? [])
                    {
                        if (!destRpcs.TryGetValue(method.Service, out var methodList))
                        {
                            methodList = destRpcs[method.Service] = [];
                        }
                        methodList.Add((method.MethodName, method.RequestType.Name, method.ResponseType.Name));
                    }
                }
                foreach (var subType in type.GetNestedTypes().Where(type => type.IsNestedPublic))
                {
                    ProcessType(subType);
                }
            }
        }

        foreach (var type in new[] {
                typeof(Packet),
                typeof(LogSeverity),
            }.Select(type => type.Assembly).Distinct().SelectMany(assembly => assembly.GetTypes().Where(type => type.IsPublic)))
        {
            ProcessType(type);
        }

        var generatedTypes = new StringBuilder();
        generatedTypes.AppendLine("// Generated by Bottleneko.CodeGenerator");

        foreach (var type in destTypes)
        {
            switch (type.Value)
            {
                case BuiltinTypeDefinition:
                    break;

                case EnumDefinition enumDefinition:
                    generatedTypes.AppendLine();
                    if (enumDefinition.Values.Length == 0)
                    {
                        generatedTypes.AppendLine($"export type {enumDefinition.Name} = never;");
                        generatedTypes.AppendLine($"export const {enumDefinition.Name}Values : {enumDefinition.Name}[] = [];");
                    }
                    else
                    {
                        if (enumDefinition.Values.Length == 1)
                        {
                            generatedTypes.AppendLine($"export type {enumDefinition.Name} = '{enumDefinition.Values[0]}';");
                        }
                        else
                        {
                            generatedTypes.AppendLine();
                            generatedTypes.AppendLine($"export type {enumDefinition.Name}");
                            generatedTypes.AppendLine($"    = '{enumDefinition.Values[0]}'");
                            foreach (var value in enumDefinition.Values.Skip(1).Take(enumDefinition.Values.Length - 2))
                            {
                                generatedTypes.AppendLine($"        | '{value}'");
                            }
                            generatedTypes.AppendLine($"        | '{enumDefinition.Values[^1]}';");
                        }

                        generatedTypes.AppendLine($"export const {enumDefinition.Name}Values : {enumDefinition.Name}[] = [");
                        foreach (var value in enumDefinition.Values)
                        {
                            generatedTypes.AppendLine($"    '{value}',");
                        }
                        generatedTypes.AppendLine($"];");
                    }
                    break;

                case StructDefinition structDefinition:
                    generatedTypes.AppendLine();
                    generatedTypes.AppendLine($"export interface {structDefinition.Name} {{");
                    var discriminators = destTypes.Values.Where(type => type is UnionDefinition).Cast<UnionDefinition>().SelectMany(union => union.Types.Where(subType => subType.Type == type.Key));
                    if (discriminators.Any())
                    {
                        generatedTypes.AppendLine($"    $type: {string.Join(" | ", discriminators.Select(discriminator => $"'{discriminator.Discriminator}'"))};");
                    }
                    foreach (var field in structDefinition.Fields)
                    {
                        generatedTypes.AppendLine($"    {JsonNamingPolicy.CamelCase.ConvertName(field.Name)}: {GetType(destTypes, field.Type).Name}{(field.IsArray ? "[]" : "")}{(field.IsOptional ? " | null" : "")};");
                    }
                    generatedTypes.AppendLine("}");
                    break;

                case UnionDefinition unionDefinition:
                    generatedTypes.AppendLine();
                    generatedTypes.AppendLine($"export type {unionDefinition.Name}");
                    if (unionDefinition.Types.Length > 1)
                    {
                        generatedTypes.AppendLine($"    = {GetType(destTypes, unionDefinition.Types.First().Type).Name}");
                        foreach (var subType in unionDefinition.Types.Skip(1).Take(unionDefinition.Types.Length - 2))
                        {
                            generatedTypes.AppendLine($"        | {GetType(destTypes, subType.Type).Name}");
                        }
                        generatedTypes.AppendLine($"        | {GetType(destTypes, unionDefinition.Types.Last().Type).Name};");
                    }
                    else
                    {
                        generatedTypes.AppendLine($"    = {GetType(destTypes, unionDefinition.Types.First().Type).Name};");
                    }
                    break;
            }
        }

        File.WriteAllText(definitionsOutput, generatedTypes.ToString());

        if (rpcOutput is not null)
        {
            var generatedRpc = new StringBuilder();
            generatedRpc.AppendLine("// Generated by Bottleneko.CodeGenerator");
            generatedRpc.AppendLine("/* eslint-disable @typescript-eslint/no-confusing-void-expression */");
            generatedRpc.AppendLine();
            generatedRpc.AppendLine($"import type * as bottleneko from './bottleneko.gen{(includeImportExtensions ? ".ts" : "")}';");
            generatedRpc.AppendLine();
            generatedRpc.AppendLine("export type ResultType<T, Default> = 'result' extends keyof T ? T['result'] : Default;");
            generatedRpc.AppendLine();
            generatedRpc.AppendLine("export default abstract class AbstractRpc {");
            foreach (var service in destRpcs)
            {
                generatedRpc.AppendLine($"    {JsonNamingPolicy.CamelCase.ConvertName(service.Key.ToString())} = {{");
                foreach (var (MethodName, RequestType, ResponseType) in service.Value)
                {
                    generatedRpc.AppendLine($"        async {JsonNamingPolicy.CamelCase.ConvertName(MethodName)}(args: Omit<bottleneko.{RequestType}, '$type'>) {{ return await (this as unknown as AbstractRpc).call<bottleneko.{ResponseType}>({{ $type: '{service.Key}/{MethodName}', ...args }}); }},");
                }
                generatedRpc.AppendLine("    };");
            }
            generatedRpc.AppendLine("    #subscriptions = new Map<string, (letter: bottleneko.Letter) => Promise<void> | void>();");
            generatedRpc.AppendLine();
            generatedRpc.AppendLine("    constructor() {");
            foreach (var service in destRpcs)
            {
                var name = JsonNamingPolicy.CamelCase.ConvertName(service.Key.ToString());
                generatedRpc.AppendLine($"        this.{name} = Object.fromEntries(Object.entries(this.{name}).map(([name, method]) => [name, method.bind(this)])) as typeof this.{name};");
            }
            generatedRpc.AppendLine("    }");
            generatedRpc.AppendLine(@"
    abstract call<T extends bottleneko.RpcResponse>(request: bottleneko.RpcRequest): Promise<ResultType<T, void>>;

    protected async onMail(mail: bottleneko.MailPacket) {
        const callback = this.#subscriptions.get(mail.subscriptionId.id);
        if (callback !== undefined) {
            for (const letter of mail.letters) {
                const result = callback(letter);
                if (result !== undefined) {
                    await result;
                }
            }
        }
    }

    async watch<T extends unknown[]>(args: T, subscribe: (...args: T) => Promise<bottleneko.SubscriptionId>, unsubscribe: (args: { subscriptionId: bottleneko.SubscriptionId }) => Promise<void>, callback: (letter: bottleneko.Letter) => Promise<void> | void) {
        const id = await subscribe(...args);
        this.#subscriptions.set(id.id, callback);
        return async () => {
            await unsubscribe({ subscriptionId: id });
            this.#subscriptions.delete(id.id);
        };
    }");
            generatedRpc.AppendLine("};");

            File.WriteAllText(rpcOutput, generatedRpc.ToString());
        }
    }
}
