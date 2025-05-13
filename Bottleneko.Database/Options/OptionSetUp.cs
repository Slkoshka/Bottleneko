namespace Bottleneko.Database.Options;

public record OptionSetUp(bool IsSetUp) : Option
{
    public OptionSetUp() : this(false) { }
}
