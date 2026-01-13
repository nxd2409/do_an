using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Project.Core.Entities.AD;

namespace Project.Core.Refrences.AD
{
    public class AdAccountConfig : IEntityTypeConfiguration<AdAccount>
    {
        public void Configure(EntityTypeBuilder<AdAccount> builder)
        {
            builder.HasOne(x => x.Title)
                   .WithMany()
                   .HasForeignKey(x => x.TitleCode)
                   .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
