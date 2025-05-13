using Akka.Actor;
using Bottleneko.Database;
using Bottleneko.Messages;
namespace Bottleneko.Actors;

abstract class ContainerCat<TChild, TEntity, TAddMsg, TUpdateMsg, TRemoveMsg>(IServiceProvider services) : NekoActor(services)
    where TAddMsg: IContainerMessage.Add
    where TUpdateMsg : IContainerMessage.Update
    where TRemoveMsg : IContainerMessage.Remove
    where TChild : ActorBase
    where TEntity : Entity
{
    protected record CreateChildActor(TEntity Entity);
    protected record UpdateChildActor(TUpdateMsg Update);
    protected record DestroyChildActor(long Id);

    private readonly Dictionary<long, IActorRef> _children = [];
    private bool _waitingForShutdown = false;

    protected abstract Task<TEntity> AddAsync(TAddMsg msg);
    protected abstract Task<TEntity> UpdateAsync(TUpdateMsg msg);
    protected abstract Task<bool> RemoveAsync(long id);

    private async Task<TEntity> AddWrapperAsync(IActorRef self, TAddMsg msg)
    {
        var entity = await AddAsync(msg);
        self.Tell(new CreateChildActor(entity));
        return entity;
    }

    private async Task<TEntity> UpdateWrapperAsync(IActorRef self, TUpdateMsg msg)
    {
        var entity = await UpdateAsync(msg);
        self.Tell(new UpdateChildActor(msg));
        return entity;
    }

    private async Task<bool> RemoveWrapperAsync(IActorRef self, long id)
    {
        var result = await RemoveAsync(id);
        self.Tell(new DestroyChildActor(id));
        return result;
    }

    protected virtual bool CustomMessageHandler(object message)
    {
        return false;
    }

    protected IActorRef? GetChild(long id)
    {
        return _children.GetValueOrDefault(id);
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case TAddMsg add:
                _ = AddWrapperAsync(Self, add).PipeTo(Sender, Self, entity => entity);
                break;

            case TUpdateMsg update:
                _ = UpdateWrapperAsync(Self, update).PipeTo(Sender, Self, entity => entity);
                break;

            case TRemoveMsg remove:
                _ = RemoveWrapperAsync(Self, remove.Id).PipeTo(Sender, Self, result => result);
                break;

            case CreateChildActor createChildActor:
                var actor = _children[createChildActor.Entity.Id] = CreateChild<TChild>([createChildActor.Entity], $"id-{createChildActor.Entity.Id}");
                Context.Watch(actor);
                break;

            case UpdateChildActor updateChildActor:
                {
                    if (_children.TryGetValue(updateChildActor.Update.Id, out var child))
                    {
                        child.Tell(updateChildActor.Update);
                    }
                    break;
                }

            case DestroyChildActor destroyChildActor:
                {
                    if (_children.Remove(destroyChildActor.Id, out var child))
                    {
                        child.Tell(IControlMessage.Shutdown.Instance);
                    }
                    break;
                }

            case IContainerMessage.ContainerItemMessage msg:
                if (_children.TryGetValue(msg.Id, out var item))
                {
                    item.Forward(message);
                }
                else if (msg is IHasReply)
                {
                    Sender.Tell(new Status.Failure(new Exception($"Child with id {msg.Id} not found")));
                }
                break;

            case IControlMessage.Shutdown:
                _waitingForShutdown = true;
                if (_children.Count == 0)
                {
                    Context.Stop(Self);
                }
                foreach (var child in _children.Values)
                {
                    child.Tell(IControlMessage.Shutdown.Instance);
                }
                break;

            case Terminated t:
                foreach (var child in _children)
                {
                    if (child.Value == t.ActorRef)
                    {
                        _children.Remove(child.Key);
                        break;
                    }
                }
                if (_waitingForShutdown && _children.Count == 0)
                {
                    Context.Stop(Self);
                }
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }
}
