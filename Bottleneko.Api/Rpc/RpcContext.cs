namespace Bottleneko.Api.Rpc;

public abstract record RpcContext
{
    public T Require<T>() where T: RpcContext
    {
        if (this is T t)
        {
            return t;
        }
        else
        {
            throw new InvalidOperationException("Unsupported");
        }
    }
}
