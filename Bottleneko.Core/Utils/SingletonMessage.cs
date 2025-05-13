namespace Bottleneko.Utils;

public abstract record SingletonMessage<T> where T: SingletonMessage<T>, new()
{
    public static readonly T Instance = new();
}
