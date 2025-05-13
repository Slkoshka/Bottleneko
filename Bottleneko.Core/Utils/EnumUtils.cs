namespace Bottleneko.Utils;

static class EnumUtils
{
    public static bool IsSameEnum<T1, T2>()
        where T1: struct, Enum
        where T2: struct, Enum
    {
        return Enumerable.SequenceEqual(Enum.GetNames<T1>().OrderBy(x => x), Enum.GetNames<T2>().OrderBy(x => x)) && Enumerable.SequenceEqual(Enum.GetValuesAsUnderlyingType<T1>().Cast<int>().OrderBy(x => x), Enum.GetValuesAsUnderlyingType<T2>().Cast<int>().OrderBy(x => x));
    }
}
