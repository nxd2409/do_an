using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Project.Core.Entities.MT;

namespace Project.Core.Refrences.MT
{
    public class MeetingInfoConfig : IEntityTypeConfiguration<MeetingInfo>
    {
        public void Configure(EntityTypeBuilder<MeetingInfo> builder)
        {
            builder.HasMany(p => p.Personal)
               .WithOne()
               .HasForeignKey(f => f.MeetingId)
               .HasPrincipalKey(p => p.Id)
               .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(p => p.Votes)
              .WithOne()
              .HasForeignKey(f => f.MeetingId)
              .HasPrincipalKey(p => p.Id)
              .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
