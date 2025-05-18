using HttpMultipartParser;
using System.Diagnostics.CodeAnalysis;
using System.Net.Http.Headers;
using System.Text;
using System.Web;

namespace Bottleneko.Scripting.Js;

[ExposeToScripts(IsInternal = true)]
public record FormDataItem(string Name, object Data, string? Filename = null, string? ContentType = null);

public class JsHttpResponse
{
    public record HeaderItem(string Name, string Data);

    public int StatusCode { get; }
    public string StatusText { get; }
    public HeaderItem[] Headers { get; }
    public bool Redirected { get; }
    public string FinalUrl { get; }

    private readonly HttpResponseMessage _response;
    private bool _disposed = false;

    internal JsHttpResponse(HttpResponseMessage response, bool redirected, string finalUrl)
    {
        _response = response;
        StatusCode = (int)response.StatusCode;
        StatusText = response.ReasonPhrase ?? "";
        Headers = [.. response.Headers.SelectMany(keyValue => keyValue.Value.Select(value => new HeaderItem(keyValue.Key, value)))];
        Redirected = redirected;
        FinalUrl = finalUrl;
    }

    public async Task<JsMemoryStream> ReadAsMemoryStreamAsync()
    {
        if (_disposed)
        {
            throw new Exception("Response has been consumed already");
        }
        _disposed = true;

        var result = new JsMemoryStream(new MemoryStream(await _response.Content.ReadAsByteArrayAsync()));
        _response.Dispose();
        return result;
    }

    public async Task<string> ReadAsStringAsync()
    {
        if (_disposed)
        {
            throw new Exception("Response has been consumed already");
        }
        _disposed = true;

        var result = await _response.Content.ReadAsStringAsync();
        _response.Dispose();
        return result;
    }

    public async Task<FormDataItem[]> ReadAsFormDataAsync()
    {
        if (_disposed)
        {
            throw new Exception("Response has been consumed already");
        }
        _disposed = true;

        if (!_response.Headers.TryGetValues("Content-Type", out var headers) || headers.Count() is 0 or > 2)
        {
            throw new Exception("Invalid Content-Type header");
        }

        switch (headers.Single())
        {
            case "multipart/form-data":
                {
                    using var stream = await _response.Content.ReadAsStreamAsync();
                    var parser = new StreamingMultipartFormDataParser(stream, Encoding.UTF8);

                    var formData = new List<FormDataItem>();

                    parser.ParameterHandler += parameter => formData.Add(new FormDataItem(parameter.Name, parameter.Data));
                    parser.FileHandler += (name, filename, contentType, _, buffer, _, part, _) =>
                    {
                        if (part == 0)
                        {
                            formData.Add(new FormDataItem(name, new JsMemoryStream(), filename, contentType));
                        }

                        ((JsMemoryStream)formData[^1].Data).Write(buffer);
                    };

                    await parser.RunAsync();

                    _response.Dispose();
                    return [.. formData];
                }

            case "application/x-www-form-urlencoded":
                return JsHttpClient.ParseQueryStringImplementation(await _response.Content.ReadAsStringAsync());

            default:
                throw new Exception("Invalid Content-Type header");
        }
        
    }
}

public class JsHttpClient : IDisposable
{
    private readonly HttpClient _http = new();

    internal static FormDataItem[] ParseQueryStringImplementation(string str)
    {
        var formData = new List<FormDataItem>();
        var values = HttpUtility.ParseQueryString(str, Encoding.UTF8);
        foreach (var (key, value) in values.AllKeys.SelectMany(key => values.GetValues(key)!.Select(value => (key, value))))
        {
            formData.Add(new FormDataItem(key ?? "", value));
        }
        return [.. formData];
    }

    [SuppressMessage("Performance", "CA1822:Mark members as static")]
    public FormDataItem[] ParseQueryString(string str)
    {
        return ParseQueryStringImplementation(str);
    }

    [SuppressMessage("Performance", "CA1822:Mark members as static")]
    public JsMemoryStream SerializeFormData(IList<object> items)
    {
        var content = new MultipartFormDataContent();
        foreach (var item in items)
        {
            var formDataItem = (FormDataItem)item;
            if (formDataItem.Data is string str)
            {
                content.Add(new StringContent(str, Encoding.UTF8, formDataItem.ContentType));
            }
            else if (formDataItem.Data is JsMemoryStream blob)
            {
                content.Add(new ByteArrayContent(blob.AsByteArray())
                {
                    Headers =
                    {
                        ContentType = MediaTypeHeaderValue.Parse(formDataItem.ContentType!),
                    }
                }, formDataItem.Name, formDataItem.Filename!);
            }
        }
        var ms = new MemoryStream();
        content.CopyTo(ms, null, CancellationToken.None);
        return new JsMemoryStream(ms);
    }

    public async Task<JsHttpResponse> MakeRequestAsync(string method, string url, JsMemoryStream? body, string? bodyContentType, IDictionary<string, object> headers, bool followRedirects)
    {
        var content = body is null ? null : new ByteArrayContent(body.AsByteArray());
        if (!headers.ContainsKey("content-type") && !string.IsNullOrEmpty(bodyContentType))
        {
            content?.Headers.Add("Content-Type", bodyContentType);
        }

        var request = new HttpRequestMessage(HttpMethod.Parse(method), url)
        {
            Content = content,
        };

        foreach (var (key, values) in headers)
        {
            foreach (var value in (IList<object>)values)
            {
                if (!request.Headers.TryAddWithoutValidation(key, (string)value))
                {
                    request.Content?.Headers.TryAddWithoutValidation(key, (string)value);
                }
            }
        }

        for (var i = 0; i < 10; i++)
        {
            var response = await _http.SendAsync(request);
            if (followRedirects && (int)response.StatusCode >= 300 && (int)response.StatusCode <= 399)
            {
                if (response.Headers.Location is null)
                {
                    throw new Exception("Invalid redirect");
                }

                request.RequestUri = response.Headers.Location;
                continue;
            }

            return new JsHttpResponse(response, i > 0, request.RequestUri!.ToString());
        }

        throw new Exception("Too many redirects");
    }

    public void Dispose()
    {
        GC.SuppressFinalize(this);

        _http.Dispose();
    }
}
