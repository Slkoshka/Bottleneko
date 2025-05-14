Environment.SetEnvironmentVariable("ASPIRE_ALLOW_UNSECURED_TRANSPORT", "true");

var builder = DistributedApplication.CreateBuilder(args);

var server = builder.AddProject<Projects.Bottleneko_Server>("bottleneko-server", options =>
    {
        options.ExcludeLaunchProfile = true;
    })
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpEndpoint(0)
    .WithUrlForEndpoint("http", annotation => annotation.Url += "/swagger/")
    .WithExternalHttpEndpoints();

var npmApp = builder.AddNpmApp("bottleneko-client", "../Bottleneko.Client")
    .WithReference(server)
    .WithEnvironment("BROWSER", "none")
    .WithHttpEndpoint(env: "VITE_PORT")
    .WithExternalHttpEndpoints();

// Uncomment to test on other devices in your local network
//foreach (var endpoint in npmApp.Resource.Annotations.OfType<EndpointAnnotation>())
//{
//    endpoint.TargetHost = "0.0.0.0";
//}

builder.Build().Run();
