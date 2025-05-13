using Bottleneko;
using Bottleneko.Api.Packets;
using Bottleneko.Logging;
using Bottleneko.Scripting;
using Spectre.Console.Cli;
using System.ComponentModel;
using System.Numerics;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

class Program
{
    record TypeDefinition(string Name);
    record BuiltinTypeDefinition(string Name) : TypeDefinition(Name);
    record EnumDefinition(string Name, string[] Values) : TypeDefinition(Name);
    record FieldDefinition(string Name, Type Type, bool IsTask, bool IsArray, bool IsOptional);
    record MethodDefinition(string Name, FieldDefinition Return, FieldDefinition[] Arguments);
    record StructDefinition(string Name, FieldDefinition[] Fields, MethodDefinition[] Methods) : TypeDefinition(Name);
    record UnionSubTypeDefinition(Type Type, string Discriminator);
    record UnionDefinition(string Name, UnionSubTypeDefinition[] Types) : TypeDefinition(Name);

    class DefaultCommand : Command<DefaultCommand.Settings>
    {
        public class Settings : CommandSettings
        {
            [Description("API bindings output location")]
            [CommandArgument(0, "<api>")]
            public required string API { get; init; }

            [Description("Script bindings output location")]
            [CommandArgument(1, "<script>")]
            public required string Bindings { get; init; }
        }

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

        private static void GenerateAPI(string output)
        {
            Console.WriteLine(" [*] Generating API bindings...");

            Console.WriteLine("     [*] Loading type definitions...");
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

            foreach (var type in new[] {
                    typeof(Packet),
                    typeof(LogSeverity),
                }.Select(type => type.Assembly).Distinct().SelectMany(assembly => assembly.GetTypes().Where(type => type.IsPublic)))
            {
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
                            .Where(property => property is { CanRead: true, IsSpecialName: false })
                            .Select(property => ExtractField(property.Name, property.PropertyType, new NullabilityInfoContext().Create(property)))
                        ], []));
                }
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
                        generatedTypes.AppendLine($"export enum {enumDefinition.Name} {{");
                        foreach (var value in enumDefinition.Values)
                        {
                            generatedTypes.AppendLine($"    {value} = '{value}',");
                        }
                        generatedTypes.AppendLine("}");
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
                        generatedTypes.AppendLine($"export type {unionDefinition.Name} =");
                        foreach (var subType in unionDefinition.Types)
                        {
                            generatedTypes.AppendLine($"    {GetType(destTypes, subType.Type).Name} |");
                        }
                        generatedTypes.AppendLine($"    {{ $type: string }};");
                        break;
                }
            }

            File.WriteAllText(output, generatedTypes.ToString());

            Console.WriteLine($"     [*] Written to {Path.GetFullPath(output)}");
        }

        private static void GenerateScriptBindings(string output)
        {
            static string SimplifyTypeName(Type type)
            {
                return type.Name.EndsWith("Binding") ? type.Name[..^"Binding".Length] : type.Name;
            }

            static StructDefinition ProcessStruct(Type type)
            {
                return new StructDefinition(SimplifyTypeName(type),
                    [.. type
                        .GetProperties(BindingFlags.Instance | BindingFlags.Public)
                        .Where(property => property is { CanRead: true, IsSpecialName: false })
                        .Select(property => ExtractField(property.Name, property.PropertyType, new NullabilityInfoContext().Create(property)))
                    ],
                    [.. type
                        .GetMethods(BindingFlags.Instance | BindingFlags.Public)
                        .Where(method => method is { IsSpecialName: false, IsGenericMethod: false, IsAbstract: false, IsStatic: false, IsConstructor: false } && method.Name != "GetType" && method.Name != "Equals" && method.Name != "GetHashCode")
                        .Select(method =>
                            new MethodDefinition(
                                method.Name,
                                ExtractField("", method.ReturnType, new NullabilityInfoContext().Create(method.ReturnParameter)),
                                [.. method.GetParameters().Select(parameter => ExtractField(parameter.Name!, parameter.ParameterType, new NullabilityInfoContext().Create(parameter)))]
                            ))
                    ]);
            }

            static string RenderFieldType(FieldDefinition field, TypeDefinition type)
            {
                return type is UnionDefinition union ? string.Join(" | ", union.Types.Select(t => t.Discriminator)) : $"{(field.IsTask ? "Promise<" : "")}{(type is EnumDefinition ? $"EnumValue<{type.Name}>" : type.Name)}{(field.IsArray ? "[]" : "")}{(field.IsOptional ? " | null" : "")}{(field.IsTask ? ">" : "")}";
            }

            static string RenderMethodType(Dictionary<Type, TypeDefinition> destTypes, MethodDefinition method)
            {
                return $"({string.Join(", ", method.Arguments.Select(arg => $"{arg.Name}: {RenderFieldType(arg, GetType(destTypes, arg.Type))}"))}) => {RenderFieldType(method.Return, GetType(destTypes, method.Return.Type))}";
            }

            Console.WriteLine(" [*] Generating API bindings...");

            Console.WriteLine("     [*] Loading type definitions...");
            var destTypes = new Dictionary<Type, TypeDefinition>()
            {
                { typeof(void), new BuiltinTypeDefinition("void") },
                { typeof(object), new BuiltinTypeDefinition("never") },
                { typeof(Task), new BuiltinTypeDefinition("Promise") },
                { typeof(bool), new BuiltinTypeDefinition("boolean") },
                { typeof(BigInteger), new BuiltinTypeDefinition("bigint") },
                { typeof(long), new BuiltinTypeDefinition("bigint") },
                { typeof(ulong), new BuiltinTypeDefinition("bigint") },
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
            foreach (var type in new[] {
                    typeof(Packet),
                    typeof(LogSeverity),
                    typeof(NekoSettings),
                }.Select(type => type.Assembly).Distinct().SelectMany(assembly => assembly.GetTypes().Where(type => type.IsPublic && type.GetCustomAttribute<ExposeToScriptsAttribute>() is not null)))
            {
                if (type is { IsEnum: true })
                {
                    destTypes.Add(type, new EnumDefinition(SimplifyTypeName(type), Enum.GetNames(type)));
                }
                else if (type is { IsClass: true, IsAbstract: true, IsSealed: false, IsGenericType: false } or { IsInterface: true } && !type.IsAssignableTo(typeof(Attribute)) && type.GetCustomAttributes<ExposeToScriptsAttribute>().Single() is { DerivedTypes.Length: > 0 } attr)
                {
                    destTypes.Add(type, new UnionDefinition(SimplifyTypeName(type), [.. attr.DerivedTypes.Select(derived => new UnionSubTypeDefinition(derived, SimplifyTypeName(derived)))]));
                }
                else if (type is { IsClass: true, IsAbstract: false, IsGenericType: false } && !type.IsAssignableTo(typeof(Attribute)) && type.GetCustomAttribute<ExposeToScriptsAttribute>() is not null)
                {
                    destTypes.Add(type, ProcessStruct(type));
                }
            }

            var generatedTypes = new StringBuilder();
            generatedTypes.AppendLine("// Generated by Bottleneko.CodeGenerator");


            generatedTypes.AppendLine();
            generatedTypes.AppendLine("// eslint-disable-next-line @typescript-eslint/no-unused-vars");
            generatedTypes.AppendLine("interface EnumValue<T> { ToString: () => string }");

            foreach (var type in destTypes)
            {
                switch (type.Value)
                {
                    case BuiltinTypeDefinition:
                        break;

                    case EnumDefinition enumDefinition:
                        generatedTypes.AppendLine();
                        generatedTypes.AppendLine($"interface {enumDefinition.Name} {{");
                        foreach (var value in enumDefinition.Values)
                        {
                            generatedTypes.AppendLine($"    {value}: EnumValue<{enumDefinition.Name}>;");
                        }
                        generatedTypes.AppendLine("}");
                        break;

                    case StructDefinition structDefinition:
                        generatedTypes.AppendLine();
                        generatedTypes.AppendLine($"interface {structDefinition.Name} {{");
                        foreach (var field in structDefinition.Fields)
                        {
                            generatedTypes.AppendLine($"    {field.Name}: {RenderFieldType(field, GetType(destTypes, field.Type))};");
                        }
                        if (structDefinition.Methods.Length > 0)
                        {
                            if (structDefinition.Fields.Length > 0)
                            {
                                generatedTypes.AppendLine();
                            }
                            foreach (var methodGroup in structDefinition.Methods.GroupBy(m => m.Name))
                            {
                                var count = methodGroup.Count();
                                if (count > 1)
                                {
                                    generatedTypes.AppendLine($"    {methodGroup.Key}:");
                                    foreach (var (index, method) in methodGroup.Index())
                                    {
                                        generatedTypes.AppendLine($"        ({RenderMethodType(destTypes, method)}){(index == count - 1 ? ";" : " &")}");
                                    }
                                }
                                else
                                {
                                    var method = methodGroup.Single();
                                    generatedTypes.AppendLine($"    {method.Name}: {RenderMethodType(destTypes, method)};");
                                }
                            }
                        }
                        generatedTypes.AppendLine("}");
                        break;

                    case UnionDefinition:
                        break;
                }
            }

            File.WriteAllText(output, generatedTypes.ToString());

            Console.WriteLine($"     [*] Written to {Path.GetFullPath(output)}");
        }

        public override int Execute(CommandContext context, Settings settings)
        {

            Console.WriteLine("Bottleneko Code Generator");
            Console.WriteLine();

            GenerateAPI(settings.API);
            GenerateScriptBindings(settings.Bindings);

            return 0;
        }
    }

    public static int Main(string[] args)
    {
        var app = new CommandApp<DefaultCommand>();
        return app.Run(args);
    }
}
