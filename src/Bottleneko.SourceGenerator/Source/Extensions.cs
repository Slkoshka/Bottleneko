namespace Bottleneko.SourceGenerator.Source;

static class Extensions
{
    extension<T>(IEnumerable<T> items)
    {
        public IEnumerable<T> Append(T value)
        {
            foreach (var item in items)
            {
                yield return item;
            }
            yield return value;
        }
    }

    extension<T>(IEnumerable<IEnumerable<T>> groups)
    {
        public IEnumerable<T> SeparatedBy(T separator)
        {
            var first = true;
            foreach (var group in groups)
            {
                if (!first)
                {
                    yield return separator;
                }
                first = false;

                foreach (var item in group)
                {
                    yield return item;
                }
            }
        }
    }
}
