using Spectre.Console.Rendering;

namespace Bottleneko.Helpers;

class LineRenderable(IRenderable renderable) : IRenderable
{
    public Measurement Measure(RenderOptions options, int maxWidth)
    {
        var measurement = renderable.Measure(options, maxWidth);
        return new Measurement(Math.Min(maxWidth, measurement.Min), Math.Min(maxWidth, measurement.Max));
    }

    public IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var written = 0;
        foreach (var segment in renderable.Render(options, int.MaxValue))
        {
            if (segment.IsLineBreak)
            {
                yield return new Segment("…");
                yield break;
            }

            var size = segment.CellCount();
            if (size + written >= maxWidth)
            {
                yield return segment.Split(maxWidth - written - 1).First;
                yield return new Segment("…");
                yield break;
            }

            written += size;
            yield return segment;
        }
    }
}
