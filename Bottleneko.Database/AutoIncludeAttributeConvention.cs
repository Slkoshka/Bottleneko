using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Metadata.Conventions.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace Bottleneko.Database;

class AutoIncludeAttributeConvention(ProviderConventionSetBuilderDependencies dependencies) : NavigationAttributeConventionBase<AutoIncludeAttribute>(dependencies), INavigationAddedConvention, ISkipNavigationAddedConvention
{

    public override void ProcessNavigationAdded(IConventionNavigationBuilder navigationBuilder, AutoIncludeAttribute attribute, IConventionContext<IConventionNavigationBuilder> context)
    {
        navigationBuilder.AutoInclude(true, true);
    }

    public override void ProcessSkipNavigationAdded(IConventionSkipNavigationBuilder skipNavigationBuilder, AutoIncludeAttribute attribute, IConventionContext<IConventionSkipNavigationBuilder> context)
    {
        skipNavigationBuilder.AutoInclude(true, true);
    }
}
