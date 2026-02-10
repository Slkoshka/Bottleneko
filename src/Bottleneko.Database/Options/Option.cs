using System.Text.Json.Serialization;

namespace Bottleneko.Database.Options;

[JsonDerivedType(typeof(OptionSecretKey), "SecretKey")]
[JsonDerivedType(typeof(OptionSetUp), "SetUp")]
public abstract record Option();
