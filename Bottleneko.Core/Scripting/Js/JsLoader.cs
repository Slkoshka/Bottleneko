using Microsoft.ClearScript;
using Microsoft.ClearScript.JavaScript;
using System.Reflection;

namespace Bottleneko.Scripting.Js;

class JsLoader : DefaultDocumentLoader
{
    private readonly Dictionary<string, string> _modules;
    private readonly string _script;

    public JsLoader(string script)
    {
        _script = script;

        const string basePath = "Bottleneko.Scripting.Js.API.";
        const string extension = ".js";

        _modules = Assembly.GetExecutingAssembly().GetManifestResourceNames()
            .Where(name => name.StartsWith(basePath) && name.EndsWith(extension))
            .ToDictionary(path => "neko." + path[basePath.Length..^extension.Length], path => path);
    }

    public override async Task<Document> LoadDocumentAsync(DocumentSettings settings, DocumentInfo? sourceInfo, string specifier, DocumentCategory category, DocumentContextCallback contextCallback)
    {
        if (specifier == "@script")
        {
            var scriptUri = new Uri("file:///script.js", UriKind.Absolute);
            if (GetCachedDocument(scriptUri) is Document cached)
            {
                return cached;
            }
            else
            {
                return CacheDocument(new StringDocument(new DocumentInfo(scriptUri)
                {
                    Category = ModuleCategory.Standard,
                }, _script), false);
            }
        }

        var fromScript = sourceInfo?.Name == "@script";
        var parts = specifier.Split('/');
        if (!sourceInfo.HasValue || (fromScript && (parts[0] != "neko" || parts.Any(part => part == ".." || part == "." || part.StartsWith("_")))))
        {
            throw new Exception($"Module not found: {specifier}");
        }
        var sourceParts = sourceInfo!.Value.Name.Split(".").ToList();
        var fullPath = parts[0] != "." && parts[0] != ".." ? [] : sourceParts;
        if (fullPath.Count > 0)
        {
            fullPath.RemoveAt(fullPath.Count - 1);
        }
        foreach (var part in parts)
        {
            if (part == ".")
            {
                continue;
            }
            else if (part == "..")
            {
                if (fullPath.Count == 0)
                {
                    throw new Exception($"Module not found: {specifier}");
                }
                fullPath.RemoveAt(fullPath.Count - 1);
            }
            else
            {
                fullPath.Add(part);
            }
        }
        List<string> paths = [string.Join(".", fullPath)];
        paths.Add(paths[0] + ".index");
        
        foreach (var path in paths)
        {
            if (_modules.TryGetValue(path, out var resource))
            {
                var uri = new Uri($"file:///{path}", UriKind.Absolute);
                if (GetCachedDocument(uri) is Document cached)
                {
                    return cached;
                }

                using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resource) ?? throw new Exception("Can't get embedded resource");
                using var reader = new StreamReader(stream);

                return CacheDocument(new StringDocument(new DocumentInfo(uri)
                {
                    Category = ModuleCategory.Standard,
                }, await reader.ReadToEndAsync()), false);
            }
        }

        throw new Exception($"Module not found: {specifier}");
    }
}
