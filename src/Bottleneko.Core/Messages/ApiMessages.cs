using Bottleneko.Database.Schema;

namespace Bottleneko.Messages;

public static class ApiMessages
{
    public record Authenticate(string AccessToken);
    public record AuthenticationResult(UserEntity? User);
}
